'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { parseMarkup, cssUri } from '../../markupParser';
import * as fs from 'fs';
import * as prettier from '@prettier/sync';

const FILE_ENCODING = 'utf8';

const CONFLUENCE_FILENAME_EXTENSION = 'confluence';
const HTML_FILENAME_EXTENSION = 'html';

const PROJECT_ROOT_DIR = path.join(__dirname, '../../..');
const TEST_EXTENSION_PATH_PLACEHOLDER = '_TEST_EXTENSION_PATH_PLACEHOLDER_';
const TEST_FILES_ROOT = path.join(PROJECT_ROOT_DIR, '/src/test/suite/fixtures/testfiles');
const FIXTURES_ROOT = path.join(PROJECT_ROOT_DIR, '/src/test/suite/fixtures/expected');
const TEST_EXTENSION_PATH_PLACEHOLDER_REPLACE_PREFIX = 'https://file%2B.vscode-resource.vscode-cdn.net';

function walkdirSync(dir: string): string[] {
	return fs.readdirSync(dir).reduce(function (result: string[], file) {
		const name = path.join(dir, file);
		const isDir = fs.statSync(name).isDirectory();
		return result.concat(isDir ? walkdirSync(name) : [name]);
	}, []);
}

function isConfluence(element: string): boolean {
	return element.endsWith(`.${CONFLUENCE_FILENAME_EXTENSION}`);
}

// Defines a Mocha test suite to group tests of similar kind together
suite('MarkupParser Tests', function () {
	// Defines a Mocha unit test
	test('Test CSS Uri', function () {
		// const expected = vscode.Uri.file(path.join(__dirname, "../../../media/css/dummy.css"));
		const expected = vscode.Uri.file(path.join(PROJECT_ROOT_DIR, '/media/css/dummy.css'));
		// console.log(expected.fsPath)
		const css = cssUri('dummy.css');
		assert.notStrictEqual(css, undefined);
		if (css) {
			assert.strictEqual(css.fsPath, expected.fsPath);
			assert.strictEqual(css.scheme, expected.scheme);
		}
	});

	const eolMap = new Map();
	eolMap.set('lf', '\n');
	eolMap.set('cr', '\r');
	eolMap.set('crlf', '\r\n');

	for (const eolMapKey of eolMap.keys()) {
		walkdirSync(TEST_FILES_ROOT)
			.filter(isConfluence)
			.forEach(fullFilePath => {
				const fileName = path.basename(fullFilePath);
				const dirName = path.dirname(fullFilePath);

				let typeDir = path.basename(dirName);
				let scopedDir = '';
				if (dirName.endsWith('scoped')) {
					scopedDir = path.basename(dirName);
					typeDir = path.basename(path.dirname(dirName));
				}

				const testName = `Render testfile: ${path.join(typeDir, scopedDir, fileName)} with EOL: ${eolMapKey.toUpperCase()}`;
				test(testName, function () {
					const fixtureFile = path.join(FIXTURES_ROOT, scopedDir, fileName.replace(CONFLUENCE_FILENAME_EXTENSION, HTML_FILENAME_EXTENSION));
					const testFileUri = vscode.Uri.file(fullFilePath);

					let project_root_dir = PROJECT_ROOT_DIR;
					if (process.platform === 'win32') {
						project_root_dir = `/${project_root_dir.split(path.sep).join(path.posix.sep).replace(':', '%3A')}`;
					}

					const readedFixtureContent = fs
						.readFileSync(fixtureFile, FILE_ENCODING)
						.replace(new RegExp(TEST_EXTENSION_PATH_PLACEHOLDER, 'g'), `${TEST_EXTENSION_PATH_PLACEHOLDER_REPLACE_PREFIX}${project_root_dir}`)
						.replace(/\r?\n/g, eolMap.get(eolMapKey)); //fix win git checkout issue: normalize eol

					const expectedContent = prettier.format(readedFixtureContent, { parser: 'html', endOfLine: eolMapKey });

					const confluenceContent = fs.readFileSync(testFileUri.fsPath, FILE_ENCODING).replace(/\r?\n/g, eolMap.get(eolMapKey)); //fix win git checkout issue: normalize eol

					// // const rawRenderedHtml = `<!DOCTYPE html><html lang="und"><head><title>${testName}</title></head><body>${parseMarkup(testFileUri, confluenceContent)}</body></html>`;
					parseMarkup(testFileUri, confluenceContent).then(rawRenderedHtml => {
						const formattedContent = prettier.format(rawRenderedHtml, { parser: 'html', endOfLine: eolMapKey });
						assert.strictEqual(expectedContent, formattedContent);
					});
				});
			});
	}
});
