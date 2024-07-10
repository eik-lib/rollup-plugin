export default {
  input: "src/plugin.js",
  external: ["rollup-plugin-import-map", "undici", "path", "url", "fs"],
  output: [{ file: "dist/plugin.cjs", format: "cjs" }],
};
