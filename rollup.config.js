export default {
    input: 'src/plugin.js',
    external: ['node-fetch', 'url'],
    output: [
        { file: 'dist/plugin.cjs.js', format: 'cjs' },
    ]
};
