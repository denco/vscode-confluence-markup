# Confluence® markup language support for Visual Studio Code

[![The MIT License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://github.com/denco/vscode-confluence-markup/blob/master/LICENSE)
[![Version](https://vsmarketplacebadge.apphb.com/version/denco.confluence-markup.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=denco.confluence-markup)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/denco.confluence-markup.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=denco.confluence-markup)
[![Ratings](https://vsmarketplacebadge.apphb.com/rating/denco.confluence-markdown.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=denco.confluence-markup)

Adds syntax highlighting, snippets and preview for Confluence® Wiki files in Visual Studio Code.

Adds Preview for Confluence Markup while editing them in VSCode

The extension can be activated in two ways

* Toggle Preview
  * Linux & Windows: `ctrl+shift+v`
  * MAC: `cmd+shift+v` or `ctrl+shift+v`
* Open|Close Preview to the Side
  * Linux & Windows: `ctrl+k v`
  * MAC: `cmd+k v` or `ctrl+k v`

Confluence Documentation

* [Wiki MarkUp](https://confluence.atlassian.com/doc/confluence-wiki-markup-251003035.html)
* [Storage Format](https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html)

Language Identifier (for use in VSCode settings)

* `confluence`
* **Example** usages:
```json
"files.associations": {
  "*.confluence": "confluence"
}
```
```json
"files.associations": {
  "*.wiki": "confluence"
}
```
```json
"files.associations": {
  "*.markup": "confluence"
}
```
```json
"files.associations": {
  "*.mu": "confluence"
}
```
 * This uage will ensure any files saved with any of the above file extensions are saved with Confluence Markup formatting.

Originally syntax from the [Confluence® Textmate Bundle](https://github.com/alkemist/Confluence.tmbundle).

----

> Confluence® is registered trademark owned by [Atlassian](https://www.atlassian.com/)
