/* eslint-disable no-restricted-syntax */

import { rollupImportMapPlugin as importMapPlugin } from 'rollup-plugin-import-map';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

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
        return await Promise.all(maps);
    } catch (err) {
        throw new Error(
            `Unable to load import map file from server: ${err.message}`,
        );
    }
}

export default function esmImportToUrl({
    imports = [],
    urls = [],
    path: eikPath = path.join(process.cwd(), 'eik.json'),
} = {}) {
    const _imports = Array.isArray(imports) ? imports : [imports];
    const _urls = Array.isArray(urls) ? urls : [urls];
    let plugin;

    return {
        name: 'rollup-plugin-eik-import-map',

        async buildStart(options) {
            const importmapUrls = await readEikJSONMaps(eikPath);
            for (const map of importmapUrls) {
                _urls.push(map);
            }

            const fetched = await fetchImportMaps(_urls);
            const mappings = _imports.concat(fetched);

            plugin = importMapPlugin(mappings);
            await plugin.buildStart(options);
        },

        resolveId(importee) {
            return plugin.resolveId(importee);
        }
    };
}
