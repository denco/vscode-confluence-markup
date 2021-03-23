'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { parseMarkup, cssUri } from '../../markupParser';
import * as fs from 'fs';
import { openStdin } from 'node:process';

const HTML_FORMATTER = require('html-formatter');

const FILE_ENCODING = 'utf8';

const CONFLUENCE_FILENAME_EXTENSION = 'confluence';
const HTML_FILENAME_EXTENSION = 'html';

const PROJECT_ROOT_DIR = path.join(__dirname, '../../..');
const TEST_EXTENSION_PATH_PLACEHOLDER = '_TEST_EXTENSION_PATH_PLACEHOLDER_';
const TEST_FILES_ROOT = path.join(PROJECT_ROOT_DIR, "/src/test/suite/fixtures/testfiles");
const FIXTURES_ROOT = path.join(PROJECT_ROOT_DIR, "/src/test/suite/fixtures/expected");

function walkdirSync(dir: string): string[] {
    return fs.readdirSync(dir).reduce(function (result: string[], file) {
        let name = path.join(dir, file);
        let isDir = fs.statSync(name).isDirectory();
        return result.concat(isDir ? walkdirSync(name) : [name]);
    }, []);
}

function isConfluence(element: string, index: number, array: string[]): boolean {
    return (element.endsWith(`.${CONFLUENCE_FILENAME_EXTENSION}`));
}

// Defines a Mocha test suite to group tests of similar kind together
suite("MarkupParser Tests", function () {

    // Defines a Mocha unit test
    test("Test CSS Uri", function () {
        // const expected = vscode.Uri.file(path.join(__dirname, "../../../media/css/dummy.css"));
        const expected = vscode.Uri.file(path.join(PROJECT_ROOT_DIR, "/media/css/dummy.css"));
        // console.log(expected.fsPath)
        const css = cssUri("dummy.css");
        assert.notStrictEqual(css, undefined);
        if (css) {
            assert.strictEqual(css.fsPath, expected.fsPath);
            assert.strictEqual(css.scheme, expected.scheme);
        }
    });

    walkdirSync(TEST_FILES_ROOT).filter(isConfluence).forEach(fullFilePath => {
        const fileName = path.basename(fullFilePath);
        const dirName = path.dirname(fullFilePath);

        let typeDir = path.basename(dirName);
        let scopedDir = ''
        if (dirName.endsWith('scoped')) {
            scopedDir = path.basename(dirName);
            typeDir = path.basename(path.dirname(dirName));
        }

        const testName = "Render testfile: " + path.join(typeDir, scopedDir, fileName)
        test(testName, function () {
            const fixtureFile = path.join(FIXTURES_ROOT, scopedDir, fileName.replace(CONFLUENCE_FILENAME_EXTENSION, HTML_FILENAME_EXTENSION));

            let project_root_dir = PROJECT_ROOT_DIR;

            if (process.platform === 'win32') {
                project_root_dir = `/${project_root_dir.split(path.sep).join(path.posix.sep).replace(':', '%3A')}`;
            }

            const fixtureContent = HTML_FORMATTER.render(
                fs.readFileSync(fixtureFile, FILE_ENCODING).replace(new RegExp(TEST_EXTENSION_PATH_PLACEHOLDER, 'g'), project_root_dir)
            );

            const testFileUri = vscode.Uri.file(fullFilePath);
            const confluenceContent = fs.readFileSync(testFileUri.fsPath, FILE_ENCODING);

            const parsedMarkup = HTML_FORMATTER.render(
                parseMarkup(testFileUri, confluenceContent)
            );
            assert.strictEqual(parsedMarkup, fixtureContent);
        });
    });
});