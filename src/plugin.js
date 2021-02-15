/* eslint-disable no-restricted-syntax */

import { rollupImportMapPlugin as importMapPlugin } from 'rollup-plugin-import-map';
import fetch from 'node-fetch';
import { helpers } from '@eik/common';

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
    path = process.cwd(),
    maps = [],
    urls = [],
} = {}) {
    const pMaps = Array.isArray(maps) ? maps : [maps];
    const pUrls = Array.isArray(urls) ? urls : [urls];
    let plugin;

    return {
        name: 'eik-rollup-plugin',

        async buildStart(options) {
            const config = await helpers.getDefaults(path);
            for (const map of config.map) {
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
