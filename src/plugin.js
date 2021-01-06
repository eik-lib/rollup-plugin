/* eslint-disable no-restricted-syntax */

import { rollupImportMapPlugin as importMapPlugin } from 'rollup-plugin-import-map';
import { join } from 'path';
import fetch from 'node-fetch';
import fs from 'fs';

async function readJSONFile(path) {
    try {
        const contents = await fs.promises.readFile(path);
        return JSON.parse(contents);
    } catch (err) {
        return {};
    }
}

async function readEikJSONMaps(eikJSONPath, pkgJSONPath) {
    const eikJSON = await readJSONFile(eikJSONPath);
    const pkgJSON = await readJSONFile(pkgJSONPath);

    if (eikJSON.name && pkgJSON.eik) {
        throw new Error('Eik configuration was defined in both in package.json and eik.json. You must specify one or the other.');
    }

    const config = { ...eikJSON, ...pkgJSON.eik };

    if (typeof config['import-map'] === 'string') return [config['import-map']];
    return config['import-map'] || [];
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
    path = join(process.cwd(), 'eik.json'),
    packagePath = join(process.cwd(), 'package.json'),
    maps = [],
    urls = [],
} = {}) {
    const pMaps = Array.isArray(maps) ? maps : [maps];
    const pUrls = Array.isArray(urls) ? urls : [urls];
    let plugin;

    return {
        name: 'rollup-plugin-eik-import-map',

        async buildStart(options) {
            const importmapUrls = await readEikJSONMaps(path, packagePath);
            for (const map of importmapUrls) {
                pUrls.push(map);
            }

            const fetched = await fetchImportMaps(pUrls);
            const mappings = pMaps.concat(fetched);

            plugin = importMapPlugin(mappings);
            await plugin.buildStart(options);
        },

        resolveId(importee) {
            return plugin.resolveId(importee);
        },
    };
}
