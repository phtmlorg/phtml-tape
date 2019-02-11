import getOptions from './lib/get-options';
import path from 'path';
import { readOrWriteFile, safelyReadFile, writeFile } from './lib/utils';
import * as log from './lib/log';

getOptions().then(
	async options => {
		let hadErrors = false;

		// runner
		for (const name in options.config) {
			const test = options.config[name];

			const testPlugin = test.plugin instanceof Function ? test.plugin : options.plugin;

			const testBase = name.split(':')[0];
			const testFull = name.split(':').join('.');

			// test paths
			const sourcePath = path.resolve(options.fixtures, test.source || `${testBase}.html`);
			const expectPath = path.resolve(options.fixtures, test.expect || `${testFull}.expect.html`);
			const resultPath = path.resolve(options.fixtures, test.result || `${testFull}.result.html`);

			const processOptions = Object.assign({ from: sourcePath, to: resultPath }, test.processOptions);
			const pluginOptions = test.options;

			const pluginName = Object(testPlugin.phtml).phtmlPlugin || 'phtml';

			log.wait(pluginName, test.message, options.ci);

			try {
				if (Object(test.before) instanceof Function) {
					await test.before();
				}

				const expectHTML = await safelyReadFile(expectPath);
				const sourceHTML = await readOrWriteFile(sourcePath, expectHTML);

				const result = await testPlugin.process(sourceHTML, processOptions, pluginOptions);
				const resultHTML = result.html;

				if ('fix' in options && options.fix !== false) {
					await writeFile(expectPath, resultHTML);
					await writeFile(resultPath, resultHTML);
				} else {
					await writeFile(resultPath, resultHTML);

					if (expectHTML !== resultHTML) {
						throw new Error([
							`Expected: ${JSON.stringify(expectHTML).slice(1, -1)}`,
							`Received: ${JSON.stringify(resultHTML).slice(1, -1)}`
						].join('\n'));
					}
				}

				const warnings = result.warnings;

				if (Object(test.warnings) instanceof Number) {
					if (test.warnings !== warnings.length) {
						const s = warnings.length !== 1 ? 's' : '';

						throw new Error(`Expected: ${test.warnings} warning${s}\nReceived: ${warnings.length} warnings`);
					}
				} else if (test.warnings) {
					if (warnings.length) {
						const areExpectedWarnings = warnings.every(
							warning => Object.keys(test.warnings).every(
								key => test.warnings[key] instanceof RegExp
									? test.warnings[key].test(warning[key])
								: test.warnings[key] === warning[key]
							)
						);

						if (!areExpectedWarnings) {
							const s = warnings.length !== 1 ? 's' : '';

							throw new Error(`Unexpected warning${s}:\n${warnings.join('\n')}`);
						}
					} else {
						throw new Error(`Expected a warning`);
					}
				}

				if (Object(test.after) instanceof Function) {
					await test.after();
				}

				log.pass(pluginName, test.message, options.ci);
			} catch (error) {
				const areExpectedErrors = test.errors === Object(test.errors) && Object.keys(test.errors).every(
					key => test.errors[key] instanceof RegExp
						? test.errors[key].test(error[key])
					: test.error[key] === error[key]
				);

				if (!areExpectedErrors) {
					log.fail(pluginName, test.message, options.ci);
					console.error(error.message);

					hadErrors = true;

					if (options.ci) {
						break;
					}
				} else {
					log.pass(pluginName, test.message, options.ci);
				}
			}
		}

		if (hadErrors) {
			throw new Error();
		}
	}
).then(
	() => {
		process.exit(0);
	},
	error => {
		if (Object(error).message) {
			console.error(error);
		}

		process.exit(1);
	}
)
