'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { parseMarkup, cssUri } from '../markupParser';
import * as fs from 'fs';

const HTML_FORMATTER = require('html-formatter');

const TEST_FILES_ROOT = path.join(__dirname, "../../src/test/testfiles");
const FIXTURES_ROOT = path.join(__dirname, "../../src/test/resources/fixtures");

function walkdirSync(dir: string): string[] {
    return fs.readdirSync(dir).reduce(function (result: string[], file) {
        let name = path.join(dir, file);
        let isDir = fs.statSync(name).isDirectory();
        return result.concat(isDir ? walkdirSync(name) : [name]);
    }, []);
}

function isConfluence(element: string, index: number, array: string[]): boolean {
    return (element.endsWith(".confluence"));
}

// Defines a Mocha test suite to group tests of similar kind together
suite("markupParser Tests", function () {

    // Defines a Mocha unit test
    test("Test CSS Uri", function () {
        const expected = vscode.Uri.file(path.join(__dirname, "../../media/css/dummy.css")).with({ "scheme": 'vscode-resource' });
        const css = cssUri("dummy.css");
        assert.notEqual(css, undefined);
        if (css) {
            assert.equal(css.fsPath, expected.fsPath);
            assert.equal(css.scheme, expected.scheme);
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
            const fixtureFile = path.join(FIXTURES_ROOT, scopedDir, fileName.replace('confluence', 'html'));
            const fixtureContent = fs.readFileSync(fixtureFile, 'utf8');

            const testFileUri = vscode.Uri.file(fullFilePath);
            const confluenceContent = fs.readFileSync(testFileUri.fsPath, 'utf8');

            const parsedMarkup = HTML_FORMATTER.render(parseMarkup(testFileUri, confluenceContent))
            assert.equal(parsedMarkup, fixtureContent);
        });
    });
});