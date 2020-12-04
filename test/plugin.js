import fs from 'fs';
import { rollup } from 'rollup';
import path from 'path';
import tap from 'tap';
import fastify from 'fastify';
import plugin from '../src/plugin.js';
import { __dirname } from '../utils/dirname.js';

const file = `${__dirname}/../fixtures/modules/file/main.js`;

/*
 * When running tests on Windows, the output code get some extra \r on each line.
 * Remove these so snapshots work on all OSes.
 */
const clean = (str) => str.split('\r').join('');

tap.test('plugin() - import map fetched from a URL', async (t) => {
    const server = fastify();
    server.get('/one', (request, reply) => {
        reply.send({
            imports: {
                'lit-element': 'https://cdn.pika.dev/lit-element/v2',
            },
        });
    });
    server.get('/two', (request, reply) => {
        reply.send({
            imports: {
                'lit-html': 'https://cdn.pika.dev/lit-html/v1',
            },
        });
    });
    const address = await server.listen();

    const options = {
        input: file,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin({
            maps: [{
                imports: {
                    'lit-html/lit-html': 'https://cdn.pika.dev/lit-html/v2',
                },
            }],
            urls: [`${address}/one`, `${address}/two`],
        })],
    };

    const bundle = await rollup(options);
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
                'lit-html/lit-html': 'https://cdn.pika.dev/lit-html/v2',
            },
        });
    });
    const address = await server.listen();

    await fs.promises.writeFile(path.join(process.cwd(), 'eik.json'), JSON.stringify({
        name: 'test',
        version: '1.0.0',
        js: '',
        css: '',
        'import-map': `${address}/one`,
    }));

    const options = {
        input: file,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin()],
    };

    const bundle = await rollup(options);
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
            },
        });
    });
    server.get('/two', (request, reply) => {
        reply.send({
            imports: {
                'lit-html': 'https://cdn.pika.dev/lit-html/v1',
            },
        });
    });
    const address = await server.listen();

    await fs.promises.writeFile(path.join(process.cwd(), 'eik.json'), JSON.stringify({
        name: 'test',
        version: '1.0.0',
        js: '',
        css: '',
        'import-map': `${address}/one`,
    }));

    const options = {
        input: file,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin({
            maps: [{
                imports: {
                    'lit-html/lit-html': 'https://cdn.pika.dev/lit-html/v2',
                },
            }],
            urls: [`${address}/two`],
        })],
    };

    const bundle = await rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'import maps from eik.json, urls and direct definition');
    await server.close();
    await fs.promises.unlink(path.join(process.cwd(), 'eik.json'));
    t.end();
});
