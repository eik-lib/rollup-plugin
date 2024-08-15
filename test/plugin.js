import { rollup } from "rollup";
import { fileURLToPath } from "node:url";
import fastify from "fastify";
import path, { dirname } from "node:path";
import tap from "tap";
import fs from "node:fs";

import plugin from "../src/plugin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FILE = path.resolve(
	__dirname,
	"..",
	"fixtures",
	"modules",
	"file",
	"main.js",
);

/*
 * When running tests on Windows, the output code get some extra \r on each line.
 * Remove these so snapshots work on all OSes.
 */
const clean = (str) => str.split("\r").join("");

tap.test("plugin() - import map fetched from a URL", async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v2",
			},
		});
	});
	app.get("/two", (request, reply) => {
		reply.send({
			imports: {
				"lit-html": "https://cdn.eik.dev/lit-html/v1",
			},
		});
	});
	const address = await app.listen({
		host: "0.0.0.0",
		port: 50253,
	});

	t.after(async () => {
		await app.close();
	});

	const options = {
		input: FILE,
		onwarn: () => {
			// Supress logging
		},
		plugins: [
			plugin({
				maps: [
					{
						imports: {
							"lit-html/lit-html": "https://cdn.eik.dev/lit-html/v2",
						},
					},
				],
				urls: [`${address}/one`, `${address}/two`],
			}),
		],
	};

	const bundle = await rollup(options);
	const { output } = await bundle.generate({ format: "esm" });

	t.matchSnapshot(clean(output[0].code), "import maps from urls");
	t.end();
});

tap.test("plugin() - import map fetched from a URL via eik.json", async (t) => {
	const app = fastify();
	app.server.keepAliveTimeout = 20;
	app.get("/one", (request, reply) => {
		reply.send({
			imports: {
				"lit-element": "https://cdn.eik.dev/lit-element/v2",
				"lit-html": "https://cdn.eik.dev/lit-html/v1",
				"lit-html/lit-html": "https://cdn.eik.dev/lit-html/v2",
			},
		});
	});
	const address = await app.listen({
		host: "0.0.0.0",
		port: 50253,
	});

	await fs.promises.writeFile(
		path.join(process.cwd(), "eik.json"),
		JSON.stringify({
			name: "test",
			server: address,
			version: "1.0.0",
			files: {
				"/css": "/src/css/**/*",
				"/js": "/src/js/**/*",
			},
			"import-map": `${address}/one`,
		}),
	);

	t.after(async () => {
		await app.close();
		await fs.promises.unlink(path.join(process.cwd(), "eik.json"));
	});

	const options = {
		input: FILE,
		onwarn: () => {
			// Supress logging
		},
		plugins: [plugin()],
	};

	const bundle = await rollup(options);
	const { output } = await bundle.generate({ format: "esm" });

	t.matchSnapshot(clean(output[0].code), "eik.json import-map string");
	t.end();
});

tap.test(
	'plugin() - Import map defined through constructor "maps" argument take precedence over import map defined in eik.json',
	async (t) => {
		const app = fastify();
		app.server.keepAliveTimeout = 20;
		app.get("/one", (request, reply) => {
			reply.send({
				imports: {
					"lit-element": "https://cdn.eik.dev/lit-element/v1",
				},
			});
		});

		const address = await app.listen({
			host: "0.0.0.0",
			port: 50253,
		});

		await fs.promises.writeFile(
			path.join(process.cwd(), "eik.json"),
			JSON.stringify({
				name: "test",
				server: address,
				version: "1.0.0",
				files: {
					"/css": "/src/css/",
					"/js": "/src/js/",
				},
				"import-map": `${address}/one`,
			}),
		);

		t.after(async () => {
			await app.close();
			await fs.promises.unlink(path.join(process.cwd(), "eik.json"));
		});

		const options = {
			input: FILE,
			onwarn: () => {
				// Supress logging
			},
			plugins: [
				plugin({
					maps: [
						{
							imports: {
								"lit-element": "https://cdn.eik.dev/lit-element/v2",
							},
						},
					],
				}),
			],
		};

		const bundle = await rollup(options);
		const { output } = await bundle.generate({ format: "esm" });

		t.matchSnapshot(
			clean(output[0].code),
			"Should rewrite import statement to https://cdn.eik.dev/lit-element/v2",
		);
		t.end();
	},
);

tap.test(
	'plugin() - Import map defined through constructor "urls" argument take precedence over import map defined in eik.json',
	async (t) => {
		const app = fastify();
		app.server.keepAliveTimeout = 20;
		app.get("/one", (request, reply) => {
			reply.send({
				imports: {
					"lit-element": "https://cdn.eik.dev/lit-element/v1",
				},
			});
		});

		app.get("/two", (request, reply) => {
			reply.send({
				imports: {
					"lit-element": "https://cdn.eik.dev/lit-element/v2",
				},
			});
		});

		const address = await app.listen({
			host: "0.0.0.0",
			port: 50253,
		});

		await fs.promises.writeFile(
			path.join(process.cwd(), "eik.json"),
			JSON.stringify({
				name: "test",
				server: address,
				version: "1.0.0",
				files: {
					"/css": "/src/css/",
					"/js": "/src/js/",
				},
				"import-map": `${address}/one`,
			}),
		);

		t.after(async () => {
			await app.close();
			await fs.promises.unlink(path.join(process.cwd(), "eik.json"));
		});

		const options = {
			input: FILE,
			onwarn: () => {
				// Supress logging
			},
			plugins: [
				plugin({
					urls: [`${address}/two`],
				}),
			],
		};

		const bundle = await rollup(options);
		const { output } = await bundle.generate({ format: "esm" });

		t.matchSnapshot(
			clean(output[0].code),
			"Should rewrite import statement to https://cdn.eik.dev/lit-element/v2",
		);
		t.end();
	},
);

tap.test(
	'plugin() - Import map defined through constructor "maps" argument take precedence over import map defined through constructor "urls" argument',
	async (t) => {
		const app = fastify();
		app.server.keepAliveTimeout = 20;
		app.get("/one", (request, reply) => {
			reply.send({
				imports: {
					"lit-element": "https://cdn.eik.dev/lit-element/v0",
				},
			});
		});

		app.get("/two", (request, reply) => {
			reply.send({
				imports: {
					"lit-element": "https://cdn.eik.dev/lit-element/v1",
				},
			});
		});

		const address = await app.listen({
			host: "0.0.0.0",
			port: 50253,
		});

		await fs.promises.writeFile(
			path.join(process.cwd(), "eik.json"),
			JSON.stringify({
				name: "test",
				server: address,
				version: "1.0.0",
				files: {
					"/css": "/src/css/",
					"/js": "/src/js/",
				},
				"import-map": `${address}/one`,
			}),
		);

		t.after(async () => {
			await app.close();
			await fs.promises.unlink(path.join(process.cwd(), "eik.json"));
		});

		const options = {
			input: FILE,
			onwarn: () => {
				// Supress logging
			},
			plugins: [
				plugin({
					maps: [
						{
							imports: {
								"lit-element": "https://cdn.eik.dev/lit-element/v2",
							},
						},
					],
					urls: [`${address}/two`],
				}),
			],
		};

		const bundle = await rollup(options);
		const { output } = await bundle.generate({ format: "esm" });

		t.matchSnapshot(
			clean(output[0].code),
			"Should rewrite import statement to https://cdn.eik.dev/lit-element/v2",
		);
		t.end();
	},
);
