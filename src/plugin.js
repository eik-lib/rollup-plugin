/* eslint-disable no-restricted-syntax */

import { rollupImportMapPlugin as importMapPlugin } from 'rollup-plugin-import-map';
import { helpers } from '@eik/common';
import { request } from 'undici';

const fetchImportMaps = async (urls = []) => {
    try {
        const maps = urls.map(async (map) => {
            const {
                statusCode,
                body,
            } = await request(map, { maxRedirections: 2 });

            if (statusCode === 404) {
                throw new Error('Import map could not be found on server');
            } else if (statusCode >= 400 && statusCode < 500) {
                throw new Error('Server rejected client request');
            } else if (statusCode >= 500) {
                throw new Error('Server error');
            }
            return body.json();
        });
        return await Promise.all(maps);
    } catch (err) {
        throw new Error(
            `Unable to load import map file from server: ${err.message}`,
        );
    }
};

export default function eikPlugin({
    path = process.cwd(),
    maps = [],
    urls = [],
    base = '',
} = {}) {
    const pMaps = Array.isArray(maps) ? maps : [maps];
    const pUrls = Array.isArray(urls) ? urls : [urls];
    let plugin;

    return {
        name: 'eik-rollup-plugin',

        async buildStart(options) {
            // Load eik config from eik.json or package.json
            const config = await helpers.getDefaults(path);

            // Fetch import maps from the server
            const fetched = await fetchImportMaps([...config.map, ...pUrls]);

            const pBase = (base === '') ? config.server : base; 

            plugin = importMapPlugin(pBase, [...fetched, ...pMaps]);
            await plugin.buildStart(options);
        },

        resolveId(importee) {
            return plugin.resolveId(importee);
        },
    };
}
