# Confluence® markup language support for Visual Studio Code

[![The MIT License](https://img.shields.io/badge/license-MIT-brightgreen.svg?label=License&style=flat-square)](https://github.com/denco/vscode-confluence-markup/blob/master/LICENSE)

[![Version](https://img.shields.io/visual-studio-marketplace/v/denco.confluence-markup?color=%230066B8&label=VS%20Marketplace&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=denco.confluence-markup)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/denco.confluence-markup?color=%230066B8&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=denco.confluence-markup)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/denco.confluence-markup?color=%230066B8&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=denco.confluence-markup)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/denco.confluence-markup?color=0066B8&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=denco.confluence-markup)

[![Version](https://img.shields.io/open-vsx/v/denco/confluence-markup?color=%23a60ee5&label=Open%20VSX&style=flat-square)](https://open-vsx.org/extension/denco/confluence-markup)
[![Downloads](https://img.shields.io/open-vsx/dt/denco/confluence-markup?color=%23a60ee5&style=flat-square)](https://open-vsx.org/extension/denco/confluence-markup)
[![Rating](https://img.shields.io/open-vsx/rating/denco/confluence-markup?color=%23a60ee5&style=flat-square)](https://open-vsx.org/extension/denco/confluence-markup)


## Description

Provide preview for Confluence® and Jira® Markup while editing them in Visual Studio Code.

Provide syntax highlighting and snippets.

## Supported file extentions

LanguageID: `confluence`

Default supported file extentions:

- `.confluence`
- `.wiki`
- `.jira`
- `.markup`

The extension can be activated in two ways

- Toggle Preview
  - Linux & Windows: `ctrl+shift+v`
  - MAC: `cmd+shift+v` or `ctrl+shift+v`
- Open|Close Preview to the Side
  - Linux & Windows: `ctrl+k v`
  - MAC: `cmd+k v` or `ctrl+k v`

## Configuration properties

- `confluenceMarkup.monospaceFont` = `Menlo, Monaco, Consolas, monospace`

## Confluence documentation

- [MarkUp](https://confluence.atlassian.com/doc/confluence-wiki-markup-251003035.html)
- [Storage Format](https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html)

Originally syntax from the [Confluence® Textmate Bundle](https://github.com/alkemist/Confluence.tmbundle).

## Development
- Fork and clone the repository.
- cd into the repository folder.
- Run `npm i` to install dependencies.
- Run `npm run watch` to start compilation in watch mode.
- Open the repository folder in VS Code and press `F5` to compile and run in a new Extension Development Host Window.
- Local Install
	- Run `vcse package` to create a .vsix file

----

> Confluence® and Jira® is registered trademark owned by [Atlassian](https://www.atlassian.com/)
