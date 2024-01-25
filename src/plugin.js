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
            // Load eik config from eik.json or package.json
            const config = await helpers.getDefaults(path);
            this.debug(`Loaded eik config ${JSON.stringify(config, null, 2)}`);

            // Fetch import maps from the server
            try {
                const fetched = await fetchImportMaps([...config.map, ...pUrls]);
                for (const map of fetched) {
                    this.debug(`Fetched import map ${JSON.stringify(map, null, 2)}`);
                }
                plugin = importMapPlugin([...fetched, ...pMaps]);
                await plugin.buildStart(options);
            } catch (err) {
                this.error(err.message);
            }
        },

        resolveId(importee) {
            const resolved = plugin.resolveId(importee);
            if (resolved) {
                this.debug(`Resolved ${importee} to ${resolved.id}`);
            }
            return resolved;
        },
    };
}
