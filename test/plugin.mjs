import fs from 'fs';
import plugin from '../src/plugin';
import rollup from 'rollup';
import path from 'path';
import url from 'url';
import tap from 'tap';
import fastify from 'fastify';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const simple = `${__dirname}/../modules/simple/main.js`;
const basic = `${__dirname}/../modules/basic/main.js`;
const file = `${__dirname}/../modules/file/main.js`;

/*
 * When running tests on Windows, the output code get some extra \r on each line.
 * Remove these so snapshots work on all OSes.
 */
const clean = str => str.split('\r').join('');


tap.test('plugin() - target is not an absolute URL - should reject process', (t) => {
    const options = {
        input: simple,
        plugins: [plugin({
            imports: {
                'foo': './foo'
            }
        })],
    }
    t.rejects(rollup.rollup(options), new Error('Target for import specifier must be an absolute URL.'));
    t.end();
});

tap.test('plugin() - target is refered to in external - should reject process', (t) => {
    const options = {
        input: simple,
        external: ['foo'],
        plugins: [plugin({
            imports: {
                'foo': 'http://not.a.host.com'
            }
        })],
    }
    t.rejects(rollup.rollup(options), new Error('Import specifier must NOT be present in the Rollup external config. Please remove specifier from the Rollup external config.'));
    t.end();
});

tap.test('plugin() - basic module - should replace lit-element with CDN URL', async (t) => {
    const options = {
        input: basic,
        onwarn: (warning, warn) => {
            // Supress logging
        },
        plugins: [plugin({
            imports: {
                'lit-element': 'https://cdn.pika.dev/lit-element/v2'
            }
        })],
    }

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'basic example');
    t.end();
});

tap.test('plugin() - simple module - should replace lit-element with CDN URL', async (t) => {
    const options = {
        input: simple,
        onwarn: (warning, warn) => {
            // Supress logging
        },
        plugins: [plugin({
            imports: {
                'lit-element': 'https://cdn.pika.dev/lit-element/v2'
            }
        })],
    }

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'simple example');
    t.end();
});

tap.test('plugin() - import map maps non bare imports - should ignore non bare imports', async (t) => {
    const options = {
        input: simple,
        onwarn: (warning, warn) => {
            // Supress logging
        },
        plugins: [plugin({
            imports: {
                'lit-element': 'https://cdn.pika.dev/lit-element/v2',
                './utils/dom.js': 'https://cdn.pika.dev/something/v666'
            }
        })],
    }

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'non bare imports');
    t.end();
});

tap.test('plugin() - import values is an Array - should use the first entry in the Array', async (t) => {
    const options = {
        input: basic,
        onwarn: (warning, warn) => {
            // Supress logging
        },
        plugins: [plugin({
            imports: {
                'lit-element': [
                    'https://cdn.pika.dev/lit-element/v2',
                    'https://cdn.pika.dev/lit-element/v1',
                ]
            }
        })],
    }

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'first array entry');
    t.end();
});

tap.test('plugin() - import specifier is a interior package path - should replace with CDN URL', async (t) => {
    const options = {
        input: file,
        onwarn: (warning, warn) => {
            // Supress logging
        },
        plugins: [plugin({
            imports: {
                'lit-element': 'https://cdn.pika.dev/lit-element/v2',
                'lit-html/lit-html': 'https://cdn.pika.dev/lit-html/v2',
                'lit-html': 'https://cdn.pika.dev/lit-html/v1',
            }
        })],
    }

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'interior package path');
    t.end();
});

tap.test('plugin() - import map fetched from a URL', async (t) => {
    const server = fastify();
    server.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.pika.dev/lit-element/v2',
            }
        });
    });
    server.get('/two', (request, reply) => {
        reply.send({
            imports: {
                'lit-html': 'https://cdn.pika.dev/lit-html/v1',
            }
        });
    });
    const address = await server.listen();

    const options = {
        input: file,
        onwarn: (warning, warn) => {
            // Supress logging
        },
        plugins: [plugin({
            imports: {
                'lit-html/lit-html': 'https://cdn.pika.dev/lit-html/v2'
            },
            urls: [`${address}/one`, `${address}/two`]
        })],
    }

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'import maps from urls');
    await server.close();
    t.end();
});

tap.test('plugin() - import map fetched from a URL via eik.json', async (t) => {
    const server = fastify();
    server.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.pika.dev/lit-element/v2',
                'lit-html': 'https://cdn.pika.dev/lit-html/v1',
                'lit-html/lit-html': 'https://cdn.pika.dev/lit-html/v2'
            }
        });
    });
    const address = await server.listen();

    await fs.promises.writeFile(path.join(process.cwd(), 'eik.json'), JSON.stringify({
        name: 'test',
        version: '1.0.0',
        js: '',
        css: '',
        'import-map': `${address}/one`
    }));

    const options = {
        input: file,
        onwarn: (warning, warn) => {
            // Supress logging
        },
        plugins: [plugin()],
    }

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'eik.json import-map string');
    await server.close();
    await fs.promises.unlink(path.join(process.cwd(), 'eik.json'));
    t.end();
});

tap.test('plugin() - import maps via eik.json, URLs and direct definitions', async (t) => {
    const server = fastify();
    server.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.pika.dev/lit-element/v2',
            }
        });
    });
    server.get('/two', (request, reply) => {
        reply.send({
            imports: {
                'lit-html': 'https://cdn.pika.dev/lit-html/v1',
            }
        });
    });
    const address = await server.listen();

    await fs.promises.writeFile(path.join(process.cwd(), 'eik.json'), JSON.stringify({
        name: 'test',
        version: '1.0.0',
        js: '',
        css: '',
        'import-map': `${address}/one`
    }));

    const options = {
        input: file,
        onwarn: (warning, warn) => {
            // Supress logging
        },
        plugins: [plugin({
            imports: {
                'lit-html/lit-html': 'https://cdn.pika.dev/lit-html/v2'
            },
            urls: [`${address}/two`]
        })],
    }

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'import maps from eik.json, urls and direct definition');
    await server.close();
    await fs.promises.unlink(path.join(process.cwd(), 'eik.json'));
    t.end();
});