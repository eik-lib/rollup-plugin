import { rollupImportMapPlugin as importMapPlugin } from "rollup-plugin-import-map";
import { helpers } from "@eik/common";
import { request } from "undici";

/**
 * @typedef {object} ImportMap
 * @property {Record<string, string>} imports
 */

/**
 * @param {string[]} urls
 * @returns {Promise<ImportMap[]>}
 */
const fetchImportMaps = async (urls = []) => {
	try {
		const maps = urls.map(async (map) => {
			const { statusCode, body } = await request(map, {
				maxRedirections: 2,
			});

			if (statusCode === 404) {
				throw new Error("Import map could not be found on server");
			} else if (statusCode >= 400 && statusCode < 500) {
				throw new Error("Server rejected client request");
			} else if (statusCode >= 500) {
				throw new Error("Server error");
			}
			return /** @type {Promise<ImportMap>} */ (body.json());
		});
		return await Promise.all(maps);
	} catch (err) {
		throw new Error(
			`Unable to load import map file from server: ${err.message}`,
		);
	}
};

/**
 * @typedef {object} PluginOptions
 * @property {string} [path=process.cwd()] Path to `eik.json`.
 * @property {string[]} [urls=[]] URLs to import maps hosted on an Eik server. Takes precedence over `eik.json`.
 * @property {ImportMap[]} [maps=[]] Inline import maps that should be used. Takes precedence over `urls` and `eik.json`.
 */

/**
 * @typedef {object} Plugin
 * @property {string} name
 * @property {(options?: unknown) => Promise<void>} buildStart
 * @property {(importee?: string) => string} resolveId
 */

/**
 * @param {PluginOptions} options
 * @returns {Plugin}
 */
export default function esmImportToUrl({
	path = process.cwd(),
	maps = [],
	urls = [],
} = {}) {
	const pMaps = Array.isArray(maps) ? maps : [maps];
	const pUrls = Array.isArray(urls) ? urls : [urls];
	let plugin;

	return {
		name: "eik-rollup-plugin",

		/**
		 * @this {import('rollup').PluginContext}
		 * @param {unknown} [options]
		 */
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

		/**
		 * @this {import('rollup').PluginContext}
		 * @param {string} [importee]
		 */
		resolveId(importee) {
			const resolved = plugin.resolveId(importee);
			if (resolved) {
				this.debug(`Resolved ${importee} to ${resolved.id}`);
			}
			return resolved;
		},
	};
}
