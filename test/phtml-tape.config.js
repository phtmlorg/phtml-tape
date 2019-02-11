module.exports = {
	'basic': {
		message: 'supports basic usage'
	},
	'basic:generate': {
		message: 'supports generating all files',
		after() {
			require('fs').unlinkSync('test/basic.generate.result.html');
		}
	},
	'basic:sources': {
		message: 'supports specifying files',
		source:  'basic.html',
		expect:  'basic.custom-expect.html',
		result:  'basic.custom-result.html',
		after() {
			require('fs').unlinkSync('test/basic.custom-result.html');
		}
	},
	'basic:errors': {
		message: 'supports failing',
		options: {
			shouldFail: true
		},
		errors: {
			message: /should fail/
		}
	},
	'basic:warnings': {
		message: 'supports warnings',
		options: {
			shouldWarn: true
		},
		warnings: {
			text: /should warn/
		},
		after() {
			require('fs').unlinkSync('test/basic.warnings.result.html');
		}
	}
};
