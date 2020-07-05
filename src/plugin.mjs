/* eslint-disable no-restricted-syntax */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const notUrl = (url) => url.substr(0, 4) !== 'http';

const notBare = (str) => str.startsWith('/') || str.startsWith('./') || str.startsWith('../');

async function readEikJSONMaps(eikJSONPath) {
    try {
        const contents = await fs.promises.readFile(eikJSONPath);
        const eikJSON = JSON.parse(contents);
        if (typeof eikJSON['import-map'] === 'string') return [eikJSON['import-map']];
        return eikJSON['import-map'] || [];
    } catch (err) {
        return [];
    }
}

async function fetchImportMaps(urls = []) {
    try {
        const maps = urls.map((map) => fetch(map).then((result) => {
            if (result.status === 404) {
                throw new Error('Import map could not be found on server');
            } else if (result.status >= 400 && result.status < 500) {
                throw new Error('Server rejected client request');
            } else if (result.status >= 500) {
                throw new Error('Server error');
            }
            return result.json();
        }));
        const results = await Promise.all(maps);
        const dependencies = results.map((result) => result.imports);
        return Object.assign({}, ...dependencies);
    } catch (err) {
        throw new Error(
            `Unable to load import map file from server: ${err.message}`,
        );
    }
}

export default function esmImportToUrl({
    path: eikPath = path.join(process.cwd(), 'eik.json'),
    urls = [],
    imports = {},
} = {}) {
    const mapping = new Map();

    return {
        name: 'rollup-plugin-eik-import-map',

        async buildStart(options) {
            const importmapUrls = await readEikJSONMaps(eikPath);
            for (const map of importmapUrls) {
                urls.push(map);
            }

            let imprts = {};
            if (urls.length > 0) {
                imprts = { ...await fetchImportMaps(urls) };
            }
            Object.assign(imprts, imports);

            Object.keys(imprts).forEach((key) => {
                const value = Array.isArray(imprts[key]) ? imprts[key][0] : imprts[key];

                if (notBare(key)) return;

                if (typeof options.external === 'function') {
                    if (options.external(key)) throw Error('Import specifier must NOT be present in the Rollup external config. Please remove specifier from the Rollup external config.');
                }
                if (Array.isArray(options.external)) {
                    if (options.external.includes(key)) throw Error('Import specifier must NOT be present in the Rollup external config. Please remove specifier from the Rollup external config.');
                }

                if (notUrl(value)) throw Error('Target for import specifier must be an absolute URL.');

                mapping.set(key, value);
            });
        },

        resolveId(importee) {
            const url = mapping.get(importee);
            if (url) {
                return {
                    id: url,
                    external: true
                };
            }

            return null;
        }
    };
}
