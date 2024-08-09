import config from "@eik/eslint-config";

export default [
	...config,
	{
		ignores: ["tap-snapshots/*", "node_modules/*", "fixtures/*", "dist/*"],
	},
];
