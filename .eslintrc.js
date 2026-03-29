/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	root: true,
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['./tsconfig.json'],
		sourceType: 'module',
		extraFileExtensions: ['.json'],
	},
	ignorePatterns: ['.eslintrc.js', '**/*.js', '**/node_modules/**', '**/dist/**'],
	plugins: ['eslint-plugin-n8n-nodes-base'],
	extends: ['plugin:eslint-plugin-n8n-nodes-base/nodes'],
	rules: {
		'n8n-nodes-base/node-execute-block-missing-continue-on-fail': 'warn',
		'n8n-nodes-base/node-resource-description-filename-against-convention': 'warn',
	},
};
