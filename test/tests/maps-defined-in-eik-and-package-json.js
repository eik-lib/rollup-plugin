import fs from 'fs';
import { rollup } from 'rollup';
import path from 'path';
import tap from 'tap';
import plugin from '../../src/plugin.js';
import { dirname, filename } from '../utils/compat.js';
import tmpFolder from '../utils/tmp-folder.js';

const file = `${dirname(import.meta)}/../../fixtures/modules/file/main.js`;

tap.test('plugin() - package.json and eik.json defined import maps', (p) => {
    p.plan(0);
    let cwd = process.cwd();

    tap.test(async () => {
        cwd = await tmpFolder(path.basename(filename(import.meta)));
        await fs.promises.writeFile(path.join(cwd, 'eik.json'), JSON.stringify({
            name: 'test',
            version: '1.0.0',
            js: '',
            css: '',
            'import-map': 'http://test.com',
        }));

        await fs.promises.writeFile(path.join(cwd, 'pkg.json'), JSON.stringify({
            eik: {
                name: 'test',
                version: '1.0.0',
                js: '',
                css: '',
                'import-map': 'http://test.com',
            },
        }));
    });

    tap.test('should reject', (t) => {
        const options = {
            input: file,
            onwarn: () => {
                // Supress logging
            },
            plugins: [plugin({ packagePath: path.join(cwd, 'pkg.json') })],
        };

        t.rejects(rollup(options));
        t.end();
    });

    tap.test(async () => {
        await fs.promises.unlink(path.join(cwd, 'eik.json'));
        await fs.promises.unlink(path.join(cwd, 'pkg.json'));
    });
});
