import { rollup } from 'rollup';
import tap from 'tap';
import fastify from 'fastify';
import plugin from '../../src/plugin.js';
import { dirname } from '../utils/compat.js';
import clean from '../utils/clean.js';

const file = `${dirname(import.meta)}/../../fixtures/modules/file/main.js`;

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
