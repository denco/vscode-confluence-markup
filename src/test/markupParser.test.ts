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
        const expected = '<h1>Heading 1</h1><br /><h2>Heading 2</h2><br /><h3>Heading 3</h3><br /><h4>Heading 4</h4><br /><h5>Heading 5</h5><br /><h6>Heading 6</h6><br />'
        const content = fs.readFileSync(testFile.fsPath, 'utf8');
        assert.equal(parseMarkup(testFile, content), expected);
    });
});