import fs from 'fs';
import { rollup } from 'rollup';
import path from 'path';
import tap from 'tap';
import fastify from 'fastify';
import plugin from '../../src/plugin.js';
import { dirname, filename } from '../utils/compat.js';
import clean from '../utils/clean.js';
import tmpFolder from '../utils/tmp-folder.js';

const file = `${dirname(import.meta)}/../../fixtures/modules/file/main.js`;

tap.test('plugin() - package.json defined import maps', async (t) => {
    const server = fastify();
    const cwd = await tmpFolder(path.basename(filename(import.meta)));

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

    await fs.promises.writeFile(path.join(cwd, 'pkg.json'), JSON.stringify({
        eik: {
            name: 'test',
            version: '1.0.0',
            js: '',
            css: '',
            'import-map': `${address}/one`,
        },
    }));

    const options = {
        input: file,
        onwarn: () => {
            // Supress logging
        },
        plugins: [plugin({ packagePath: path.join(cwd, 'pkg.json') })],
    };

    const bundle = await rollup(options);
    const { output } = await bundle.generate({ format: 'esm' });

    t.matchSnapshot(clean(output[0].code), 'import-map defined in package.json');
    await server.close();
    await fs.promises.unlink(path.join(cwd, 'pkg.json'));
    t.end();
});
