import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
	input: 'src/index.js',
	output: { file: 'index.js', format: 'cjs' },
	plugins: [
		babel({
			plugins: [ '@babel/syntax-dynamic-import' ],
			presets: [
				['@babel/env', {
					corejs: 3,
					loose: true,
					modules: false,
					targets: { node: 8 },
					useBuiltIns: 'entry'
				}]
			]
		}),
		terser(),
		trimUseStrict(),
		addHashBang()
	]
};

function addHashBang() {
	return {
		name: 'add-hash-bang',
		renderChunk(code) {
			return `#!/usr/bin/env node\n${code}`;
		}
	};
}

function trimUseStrict() {
	return {
		name: 'trim-use-strict',
		renderChunk(code) {
			return code.replace(/\s*('|")?use strict\1;\s*/, '');
		}
	};
}
