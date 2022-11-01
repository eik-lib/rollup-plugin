import { rollup } from 'rollup';
import { URL } from 'node:url';
import fastify from 'fastify';
import path from 'node:path';
import tap from 'tap';
import fs from 'node:fs';

import plugin from '../src/plugin.js';

const FILE = new URL('../fixtures/modules/file/main.js', import.meta.url).pathname;

/*
 * When running tests on Windows, the output code get some extra \r on each line.
 * Remove these so snapshots work on all OSes.
 */
const clean = (str) => str.split('\r').join('');

tap.test('plugin() - import map fetched from a URL', async (t) => {
    const app = fastify();
    app.server.keepAliveTimeout = 20;
    app.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.eik.dev/lit-element/v2',
            },
        });
    });
    app.get('/two', (request, reply) => {
        reply.send({
            imports: {
                'lit-html': 'https://cdn.eik.dev/lit-html/v1',
            },
        });
    });
    const address = await app.listen();

    const options = {
        input: FILE,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin({
            maps: [{
                imports: {
                    'lit-html/lit-html': 'https://cdn.eik.dev/lit-html/v2',
                },
            }],
            urls: [`${address}/one`, `${address}/two`],
            base: 'https://cdn.eik.dev',
        })],
    };

    const bundle = await rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'import maps from urls');
    await app.close();
    t.end();
});

tap.test('plugin() - import map fetched from a URL via eik.json', async (t) => {
    const app = fastify();
    app.server.keepAliveTimeout = 20;
    app.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.eik.dev/lit-element/v2',
                'lit-html': 'https://cdn.eik.dev/lit-html/v1',
                'lit-html/lit-html': 'https://cdn.eik.dev/lit-html/v2',
            },
        });
    });
    const address = await app.listen();

    await fs.promises.writeFile(path.join(process.cwd(), 'eik.json'), JSON.stringify({
        name: 'test',
        server: address,
        version: '1.0.0',
        files: {
            '/css': '/src/css/**/*',
            '/js': '/src/js/**/*',
        },
        'import-map': `${address}/one`,
    }));

    const options = {
        input: FILE,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin()],
    };

    const bundle = await rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'eik.json import-map string');
    await app.close();
    await fs.promises.unlink(path.join(process.cwd(), 'eik.json'));
    t.end();
});

tap.test('plugin() - Import map defined through constructor "maps" argument take precedence over import map defined in eik.json', async (t) => {
    const app = fastify();
    app.server.keepAliveTimeout = 20;
    app.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.eik.dev/lit-element/v1',
            },
        });
    });

    const address = await app.listen();

    await fs.promises.writeFile(path.join(process.cwd(), 'eik.json'), JSON.stringify({
        name: 'test',
        server: address,
        version: '1.0.0',
        files: {
            '/css': '/src/css/',
            '/js': '/src/js/',
        },
        'import-map': `${address}/one`,
    }));

    const options = {
        input: FILE,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin({
            maps: [{
                imports: {
                    'lit-element': 'https://cdn.eik.dev/lit-element/v2',
                },
            }],
        })],
    };

    const bundle = await rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'Should rewrite import statement to https://cdn.eik.dev/lit-element/v2');
    await app.close();
    await fs.promises.unlink(path.join(process.cwd(), 'eik.json'));
    t.end();
});

tap.test('plugin() - Import map defined through constructor "urls" argument take precedence over import map defined in eik.json', async (t) => {
    const app = fastify();
    app.server.keepAliveTimeout = 20;
    app.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.eik.dev/lit-element/v1',
            },
        });
    });

    app.get('/two', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.eik.dev/lit-element/v2',
            },
        });
    });

    const address = await app.listen();

    await fs.promises.writeFile(path.join(process.cwd(), 'eik.json'), JSON.stringify({
        name: 'test',
        server: address,
        version: '1.0.0',
        files: {
            '/css': '/src/css/',
            '/js': '/src/js/',
        },
        'import-map': `${address}/one`,
    }));

    const options = {
        input: FILE,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin({
            urls: [
                `${address}/two`,
            ],
        })],
    };

    const bundle = await rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'Should rewrite import statement to https://cdn.eik.dev/lit-element/v2');
    await app.close();
    await fs.promises.unlink(path.join(process.cwd(), 'eik.json'));
    t.end();
});

tap.test('plugin() - Import map defined through constructor "maps" argument take precedence over import map defined through constructor "urls" argument', async (t) => {
    const app = fastify();
    app.server.keepAliveTimeout = 20;
    app.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.eik.dev/lit-element/v0',
            },
        });
    });

    app.get('/two', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.eik.dev/lit-element/v1',
            },
        });
    });

    const address = await app.listen();

    await fs.promises.writeFile(path.join(process.cwd(), 'eik.json'), JSON.stringify({
        name: 'test',
        server: address,
        version: '1.0.0',
        files: {
            '/css': '/src/css/',
            '/js': '/src/js/',
        },
        'import-map': `${address}/one`,
    }));

    const options = {
        input: FILE,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin({
            maps: [{
                imports: {
                    'lit-element': 'https://cdn.eik.dev/lit-element/v2',
                },
            }],
            urls: [
                `${address}/two`,
            ],
        })],
    };

    const bundle = await rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'Should rewrite import statement to https://cdn.eik.dev/lit-element/v2');
    await app.close();
    await fs.promises.unlink(path.join(process.cwd(), 'eik.json'));
    t.end();
});
