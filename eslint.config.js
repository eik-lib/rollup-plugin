import config from "@eik/eslint-config";

export default [
  ...config,
  {
    ignores: [
      "tap-snapshots/*",
      "node_modules/*",
      "modules/*",
      "utils/*",
      "dist/*",
      "tmp/*",
    ],
  },
];
