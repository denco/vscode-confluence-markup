'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { parseMarkup, cssUri } from '../markupParser';
import * as fs from 'fs';

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

    test("Test render headers", function () {
        const testFile = vscode.Uri.file(path.join(__dirname, "../../src/test/testfiles/nix/scoped/headings.confluence"));
        const expected = '<p><h1>Heading 1</h1></p><p><h2>Heading 2</h2></p><p><h3>Heading 3</h3></p><p><h4>Heading 4</h4></p><p><h5>Heading 5</h5></p><p><h6>Heading 6</h6></p>'
        const content = fs.readFileSync(testFile.fsPath, 'utf8');
        assert.equal(parseMarkup(testFile, content), expected);
    });
});