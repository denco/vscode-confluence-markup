# Confluence Wiki Markup

## [1.0.1]

- modified code/noformat blocks so they can be used in lists to match confluence behaviour
- added support for code block macro titles and themes (only standard themes are supported, and there's no syntax highlighting)
- changed test files to accomodate above changes
- updated github workflow actions to v3

## [1.0.0](https://github.com/denco/vscode-confluence-markup/releases/tag/1.0.0)

- non preview release [1.0.0](https://github.com/denco/vscode-confluence-markup/issues/37)
- fix render links inside of table [Preview is not working using links inside a table](https://github.com/denco/vscode-confluence-markup/issues/38)
- fix render local images [Image preview](https://github.com/denco/vscode-confluence-markup/issues/39)
- render image attributes

## [0.1.12](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.12)

- fix monospace with digits [Monospaced Text does not seem to be supported](https://github.com/denco/vscode-confluence-markup/issues/34)
- add check for undefined panel and webview
- fix regex for line-through and italic formats

## [0.1.11](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.11)

- enchange color macro with support for rgb and hex colors [Support to {color:}](https://github.com/denco/vscode-confluence-markup/issues/32)
- adjust css, word breakes on space for code/noformat macros
- fix regex for code/noformat macro

## [0.1.10](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.10)

- fix [Error by display of multiply links or escaped link markup in the same line](https://github.com/denco/vscode-confluence-markup/issues/28)
- fix regex for code/noformat macro
- add dev's enhansments: linting, tests, ci

## [0.1.9](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.9)

- fix [Can't use [ and ] in string](https://github.com/denco/vscode-confluence-markup/issues/24)
- add panel macro support [panel support](https://github.com/denco/vscode-confluence-markup/issues/22)
- add bages for [Open VSX Registry](https://open-vsx.org/)
- use bages from [shilds.io](https://shields.io/)
- migrate from `vscode` dependency to `@types/vscode` and `vscode-test`, s. [Migrating from `vscode`](https://code.visualstudio.com/api/working-with-extensions/testing-extension#migrating-from-vscode)

## [0.1.8](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.8)

- fix [Multiply inline monospace macro](https://github.com/denco/vscode-confluence-markup/issues/17)
- fix [Italic with dot at the end](https://github.com/denco/vscode-confluence-markup/issues/18)
- fix rendering striked-throu markup
- adjust content security policy
- add downloads badge in [README.MD](https://github.com/denco/vscode-confluence-markup/blob/master/README.md)

## [0.1.7](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.7)

- fix skip empty lines
- extend content security policy for inline styles
- enhance testing

## [0.1.6](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.6)

- fix using css and render of emoticons rendering `Content-Security-Policy`
- skip render empty lines
- extend documentation
- merge [Improvement to CSS + Ability to Change Monospace Font for Preview](https://github.com/denco/vscode-confluence-markup/pull/14), thanks to [macintacos](https://github.com/macintacos) for contributing:
  - Add configuration property: `confluenceMarkup.monospaceFont` for monospace font, default: `Menlo, Monaco, Consolas, monospace`
  - wrap all tags with paragraf

## [0.1.5](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.5)

- use webview api for rendering in vscode 1.33.x
- refactor confluence snippets
- new logo
- preview unsaved files

## [0.1.4](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.4)

- fix [List indenting @win](https://github.com/denco/vscode-confluence-markup/issues/6)
- restructure
- win/nix test files

## [0.1.3](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.3)

- fix [nested lists](https://github.com/denco/vscode-confluence-markup/issues/7)
- fix [headless table](https://github.com/denco/vscode-confluence-markup/issues/5)
- rendering tables with row headers

## [0.1.2](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.2)

- fix rendering of tag inside of code macro
- fix [noformat issue](https://github.com/denco/vscode-confluence-markup/issues/3)
- fix strikethrough and italic text
- add table rendering

## [0.1.1](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.1)

- fix simple link
- fix keyboard shorcuts, activate only for confluence language id
- add simple css

## [0.1.0](https://github.com/denco/vscode-confluence-markup/releases/tag/0.1.0)

- add preview action
- add support for confluence emoticons
- change language id from: confluence-markup to confluence

## [0.0.1](https://github.com/denco/vscode-confluence-markup/releases/tag/0.0.1) - First Release

- convert Textmate bundle to Visual Studio Code format.
