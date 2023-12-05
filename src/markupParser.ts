'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import * as fs from 'fs';
import * as vsctm from 'vscode-textmate';
import * as oniguruma from 'vscode-oniguruma';

import { DivTag, SpanTag, ImgTag, Tag, DomElement } from './DomElements';

const EXTENTION_ID = 'denco.confluence-markup';
const EMOTICON_PATH = '/media/emoticons/';
const CSS_PATH = '/media/css/';
const MONOSPACE_FONT_FAMILY = vscode.workspace.getConfiguration("confluenceMarkup").monospaceFont;
const LOCAL_FILE_OPTS = { scheme: 'https', authority: 'file+.vscode-resource.vscode-cdn.net' };

const GRAMMAR_FILE = getUri("/syntaxes", "confluence-markup.tmLanguage").fsPath;
const GRAMMER_SCOPE_NAME = 'text.html.confluence';
const WASP_FILE = getUri("/node_modules/vscode-oniguruma/release", "onig.wasm").fsPath;

// s. https://github.com/Microsoft/vscode-textmate
// Create a registry that can create a grammar from a scope name.
const TOKEN_REGISTRY = new vsctm.Registry({
	onigLib: oniguruma.loadWASM(fs.readFileSync(WASP_FILE)).then(() => {
		return {
			createOnigScanner: (patterns: string[]) => new oniguruma.OnigScanner(patterns),
			createOnigString: (s: string) => new oniguruma.OnigString(s)
		};
	}),
	loadGrammar: () => {
		return readFile(GRAMMAR_FILE)
			.then(data => {
				return vsctm.parseRawGrammar(data.toString())
			})
	}
});

const EMOTICONS: Map<string, { alt: string, filename: string }> = new Map([
	[':)', { alt: 'smile', filename: 'smile.png' }],
	[':(', { alt: 'sad', filename: 'sad.png' }],
	[':P', { alt: 'cheeky', filename: 'cheeky.png' }],
	[':D', { alt: 'laugh', filename: 'biggrin.png' }],
	[';)', { alt: 'wink', filename: 'wink.png' }],
	['(y)', { alt: 'thumbs-up', filename: 'thumbs-up.png' }],
	['(n)', { alt: 'thumbs-down', filename: 'thumbs-down.png' }],
	['(i)', { alt: 'information', filename: 'information.png' }],
	['(/)', { alt: 'tick', filename: 'tick.png' }],
	['(x)', { alt: 'cross', filename: 'cross.png' }],
	['(!)', { alt: 'warning', filename: 'warning.png' }],
]);

function imageUri(searchUri: vscode.Uri, imageLink: string) {
	let imageUri
	if (imageLink.match(/^(ht)|(f)tps?:\/\//)) {
		imageUri = vscode.Uri.parse(imageLink);
	} else {
		if (path.isAbsolute(imageLink)) {
			imageUri = vscode.Uri.file(imageLink).with(LOCAL_FILE_OPTS);
		} else {
			imageUri = vscode.Uri.file(path.join(path.dirname(searchUri.fsPath), imageLink)).with(LOCAL_FILE_OPTS);
		}
	}
	return imageUri;
}

function getUri(filepath: string, filename: string) {
	const extension = vscode.extensions.getExtension(EXTENTION_ID);
	if (extension) {
		const extPath = extension.extensionPath;

		// set special chema for resource:
		// https://code.visualstudio.com/api/extension-guides/webview#loading-local-content
		const uri = vscode.Uri.file(path.join(extPath, filepath, filename))
		return uri
	}
	return vscode.Uri.prototype;
}

function emoticonUri(emoticonFile: string) {
	const emoticonUrl = getUri(EMOTICON_PATH, emoticonFile)
	if (emoticonUrl) {
		return emoticonUrl.with(LOCAL_FILE_OPTS);
	}
	return vscode.Uri.prototype;
}

export function cssUri(cssFile: string) {
	return getUri(CSS_PATH, cssFile);
}

/**
 * Utility to read a file as a promise
 */
function readFile(path: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		fs.readFile(path, (error, data) => error ? reject(error) : resolve(data));
	})
}

export function parseMarkup(sourceUri: vscode.Uri, sourceText: string) {

	// Load the JavaScript grammar and any other grammars included by it async.
	const start = Date.now();
	const content = TOKEN_REGISTRY.loadGrammar(GRAMMER_SCOPE_NAME).then(grammar => {
		let renderedContent = '';
		if (grammar) {
			let ruleStack = vsctm.INITIAL;
			for (const line of sourceText.split(/\r?\n|\r/gi)) {
				const lineTokens = grammar.tokenizeLine(line, ruleStack);
				ruleStack = lineTokens.ruleStack;
				renderedContent += renderDomElement(toDomElement(line, lineTokens));
				// renderedContent += toDomElementDirect(line, lineTokens);
			}
		} else {
			new Error("Grammer is undefined!");
		}
		return renderedContent;
	});

	return content.finally(() => {
		console.debug(`Render file: ${sourceUri.path.split('/').at(-1)}; took: ${Date.now() - start}ms.`);
	});
}

function toDomElement(line: string, lineTokens: vsctm.ITokenizeLineResult): DomElement {
	// let rootTag = new DomElement({ tag: 'div', attributes: new Map([["class", "paragraph"]]) });
	const rootTag = new DivTag();
	let currentTag: DomElement = rootTag;

	console.debug(`Line [${line}]:`);
	for (const token of lineTokens.tokens) {
		// console.debug(`\t- token from ${token.startIndex} to ${token.endIndex} ` +
		// 	`[${line.substring(token.startIndex, token.endIndex)}] ` +
		// 	`has scopes: ${token.scopes.join(',')}`
		// );

		const usedTokenScope = token.scopes.at(-1); // use last scope
		let tokenValue = line.substring(token.startIndex, token.endIndex); // token value
		if (!usedTokenScope) {
			continue;
		}
		const [elementAction, element] = cleanScope(usedTokenScope).split(".");
		// console.debug(`ACTION.ELEMENT: [${elementAction}.${element}]`);

		switch (elementAction) {
			case "tag":
				const tag = new Tag(element, {
					closed: true,
					parent: currentTag
				});
				if (currentTag) {
					currentTag.childs.push(tag);
				}
				currentTag = tag;
				break;
			case "close":
				if (currentTag && currentTag.parent) {
					currentTag = currentTag.parent;
				}
				break;
			case "attribute":
				if (!currentTag.value) {
					currentTag.value = tokenValue;
				}
				currentTag.attributes.set(element, tokenValue);
				break;
			case "html":
				switch (element) {
					case "emoticon":
						currentTag.childs.push(emoticonElement(tokenValue));
						break;
					case "mdash":
						currentTag.childs.push(new SpanTag({ value: `&${element};` }));
						break;
					case "ndash":
						currentTag.childs.push(new SpanTag({ value: `&${element};` }));
						break;
					case "link":
						currentTag.value = tokenValue;
						break;
					case "raw":
						currentTag.value = tokenValue;
						currentTag.attributes.set("style", `font-family: ${MONOSPACE_FONT_FAMILY};`);
						break;
					default:
						currentTag.childs.push(new SpanTag({ value: tokenValue }));
						break;
				}
				break;
			case "ignore":
				break;
			default:
				break;
		}
	}
	return rootTag;
}

function cleanScope(scope: string): string {
	return scope
		.replace('meta.', '')
		.replace("text.", "")
		.replace("image.", "")
		.replace(".element", "")
		.replace(".confluence", "");
}

function renderDomElement(element: DomElement): string {
	if (element.childs.length == 0) {
		const elementAttributs = attributeMapToString(element.attributes);
		return `<${element.tag}${elementAttributs}>${((element.value) ? element.value : '')}${((element.closed) ? `</${element.tag}>` : '')}`
	} else {
		const elementAttributs = attributeMapToString(element.attributes);
		return `<${element.tag}${elementAttributs}>` + element.childs.map(child => { return renderDomElement(child); }).join('') + ((element.closed) ? `</${element.tag}>` : '');
	}
}

function attributeMapToString(attributes: Map<string, string>): string {
	if (attributes.size > 0) {
		return ' ' + Array.from(attributes.keys()).map((key) => { return `${key}='${attributes.get(key)}'` }).join(" ");
	}
	return '';
}

function emoticonElement(emoticon: string): DomElement {
	const foundEmoticon = EMOTICONS.get(emoticon);
	if (foundEmoticon) {
		return new ImgTag({
			attributes: new Map([
				['alt', foundEmoticon.alt],
				['src', emoticonUri(foundEmoticon.filename).toString()]
			])
		});
	}
	return new SpanTag();
}


/**
 * alternative rendering
 *
 * @param line
 * @param lineTokens
 * @returns
 */
function toDomElementDirect(line: string, lineTokens: vsctm.ITokenizeLineResult): string {
	// console.debug(`Line [${line}]:`);
	const lineRootTag = 'div';
	let renderedLine = `<${lineRootTag}>`;
	let openTags: string[] = [lineRootTag];
	for (const token of lineTokens.tokens) {
		const lastTokenScope = token.scopes.at(-1); // use last scope

		// console.debug(`\t- token from ${token.startIndex} to ${token.endIndex} ` +
		// 	`[${line.substring(token.startIndex, token.endIndex)}] ` +
		// 	`has scopes: ${token.scopes.join(',')}`
		// );
		if (!lastTokenScope) {
			continue;
		}
		if (lastTokenScope.includes('meta.tag.')) {
			const el = lastTokenScope
				.replace('meta.tag.', '')
				.replace('.confluence', '').split('.');
			const tag = el[0];
			const tagFlag = (el.length === 2 ? el[1] : '');

			if (tagFlag === 'end') {
				renderedLine += `</${tag}>`;
			} else {
				renderedLine += `<${tag}>`;
				if (tagFlag === '') {
					openTags.push(tag);
				}
			}
			continue;
		} else if (lastTokenScope.includes('text') || lastTokenScope.includes('meta.paragraph')) {
			const tokenValue = line.substring(token.startIndex, token.endIndex);
			if (lastTokenScope.includes('emoticon')) {
				renderedLine += renderDomElement(emoticonElement(tokenValue));
			} else {
				renderedLine += tokenValue;
			}
			continue;
		}
	}
	// close open tags
	renderedLine += openTags.map((tag) => { return `</${tag}>`; }).join('');
	openTags = [];
	return renderedLine;
}

/**
 * @deprecated old method based on regex
 */
function parseMarkupRegEx(sourceUri: vscode.Uri, sourceText: string) {
	//TODO: use Tokenizer instead of line loop

	let result = '';
	let listTag = '';
	let listStyle = '';
	let codeTagFlag = false;
	let panelTagFlag = false;
	let tableFlag = false;
	let listFlag = false;
	let listArr: string[] = [];

	for (const entry of sourceText.split(/\r?\n|\r/gi)) {
		let tag = entry

		if (!codeTagFlag) {
			tag = tag.trim(); //remove leading and trailing spaces
		}

		let html_tag = false;

		if ((tag.length === 0)
			&& (!listFlag)
			&& (!tableFlag)
			&& (!codeTagFlag)
		) {
			// result += '<div></div>';
			continue;
		}

		if (!codeTagFlag) {
			tag = tag.replace(/h(\d+)\.\s([^\r?\n]+)/g, "<h$1>$2</h$1>");

			tag = tag.replace(/\+([^+]*)\+/g, "<u>$1</u>");
			tag = tag.replace(/\^([^^]*)\^/g, "<sup>$1</sup>");
			tag = tag.replace(/~([^~]*)~/g, "<sub>$1</sub>");
			tag = tag.replace(/\\}/g, "&rbrace;").replace(/\{{2}(.*?)\}{2}/g, `<code style='font-family: ${MONOSPACE_FONT_FAMILY}'>$1</code>`);
			tag = tag.replace(/\?{2}(.*)\?{2}/g, "<cite>$1</cite>");
			tag = tag.replace(/\{color:([^}]+)\}/g, "<span style='color:$1;'>").replace(/\{color\}/g, '</span>');

			tag = tag.replace(/bq. (.*)/g, "<blockquote><p>$1</p></blockquote>");
			tag = tag.replace(/\{quote\}(.*)\{quote\}/g, "<blockquote><p>$1</p></blockquote>");


			tag = tag.replace(/:\)/g, '<img alt="(smile)" src="' + emoticonUri('smile.png') + '">');
			tag = tag.replace(/:\(/g, '<img alt="(sad)" src="' + emoticonUri('sad.png') + '">');
			tag = tag.replace(/:P/g, '<img alt="(cheeky)" src="' + emoticonUri('cheeky.png') + '">');
			tag = tag.replace(/:D/g, '<img alt="(laugh)" src="' + emoticonUri('biggrin.png') + '">');
			tag = tag.replace(/;\)/g, '<img alt="(wink)" src="' + emoticonUri('wink.png') + '">');
			tag = tag.replace(/\(y\)/g, '<img alt="(thumbs-up)" src="' + emoticonUri('thumbs-up.png') + '">');
			tag = tag.replace(/\(n\)/g, '<img alt="(thumbs-down)" src="' + emoticonUri('thumbs-down.png') + '">');
			tag = tag.replace(/\(i\)/g, '<img alt="(information)" src="' + emoticonUri('information.png') + '">');
			tag = tag.replace(/\(\/\)/g, '<img alt="(tick)" src="' + emoticonUri('tick.png') + '">');
			tag = tag.replace(/\(x\)/g, '<img alt="(cross)" src="' + emoticonUri('cross.png') + '">');
			tag = tag.replace(/\(!\)/g, '<img alt="(warning)" src="' + emoticonUri('warning.png') + '">');

			tag = tag.replace(/\\\\/gi, '<br>');

			const re_href = /\[([^||\]]*)\|?([^[||]*)?\]/g
			if (tag.match(re_href)) {
				tag = tag.replace(re_href, function (m0: string, m1: string, m2: string) {
					if (m1 !== undefined && (m1.startsWith(' ') || m1.endsWith('\\'))) {
						return m0.replace(/\\/g, '').replace(/\|/g, '&vert;')
					}
					if (m2 !== undefined && m2.endsWith('\\')) {
						return m0.replace(/\\/g, '').replace(/\|/g, '&vert;')
					}
					if (m2 != undefined) {
						return "<a href='" + m2 + "'>" + m1 + "</a>";
					}
					return "<a href='" + m1 + "'>" + m1 + "</a>";
				});
				html_tag = true;
			}

			//img
			const img_re = /!([^|]*)\|?(.*)!/;
			const img_match = tag.match(img_re);
			if (img_match) {
				let imgAttr = ""
				if (img_match[2].length != 0) {
					imgAttr = img_match[2].replace(/=/gi, '="').replace(/,/gi, '" ') + '"'
				}
				const imageLink = imageUri(sourceUri, img_match[1])
				const imgAlt = imageLink.path.substring(imageLink.path.lastIndexOf('/') + 1);
				tag = `<img alt="${imgAlt}" src="${imageLink}" ${imgAttr}>`;
			}

			//Table
			const tab_th_re = /\s*[^{]*\|{2}[^}]*$/gi;
			const tab_td_re = /\s*[^{]*\|[^}]*$/gi;
			if ((tag.match(tab_th_re) || tag.match(tab_td_re))) {
				let closeTableCell = '';
				if (tag.match(tab_th_re)) {
					tag = tag.replace(/^\|{2,}/, '||');
					tag = tag.replace(/^\|{2}/, '<th>');
					tag = tag.replace(/\|{2}$/, '</th>');
					tag = tag.replace(/\|{2}/gi, '</th><th>');
					tag = tag.replace(/\|/, '</th><td>'); // row heading
					closeTableCell = '</th>';
				}
				if (tag.match(tab_td_re)) {
					tag = tag.replace(/^\|/, '<td>');
					tag = tag.replace(/\|$/, '</td>'); //.replace(/$/, '</td>');
					tag = tag.replace(/\|/gi, '</td><td>');
					closeTableCell = '</td>';
				}
				if (!tag.endsWith('</th>') && !tag.endsWith('</td>')) {
					tag += closeTableCell;
				}
				tag = '<tr>' + tag + '</tr>';
				if (tableFlag == false) {
					tag = '<div><table><tbody>' + tag;
				}
				tableFlag = true;
			}
		}

		// code
		// oneline code and noformat tag
		tag = tag.replace(/\{(noformat|code)[^}]*\}(.*)\{(noformat|code)\}/, function (m0, m1, m2) {
			return `<div class="code-block"><pre><code style='font-family: ${MONOSPACE_FONT_FAMILY}'>${m2.replace(/</gi, '&lt;')}</code></pre></div>`;
		});


		// code and noformat tag
		const code_re = /\{(noformat|code)([^}]*)\}/;
		const code_match = tag.match(code_re);
		if (code_match) {
			if (!codeTagFlag) {
				let codeBlockStyle = "";
				// Title style is unecessary for now. It can't be easily customized in Confluence.
				// let titleStyle = "";
				tag = tag.replace(code_re, function (m0, m1, m2) {
					let res = `<pre><code style='font-family: ${MONOSPACE_FONT_FAMILY}$codeBlockStyle'>`;
					const splits = m2.split(/[|:]/);
					splits.forEach((el: string) => {
						const elems = el.split('=');
						if (elems[0] === "title") {
							res = `<span class="code-title">${elems[1]}</span>${res}`;
							// res = `<span class="code-title" $titleStyle>${elems[1]}</span>${res}`;
						}
						// Basic theme matching.
						if (elems[0] === "theme") {
							// Predefined confluence themes.
							switch (elems[1].toLowerCase()) {
								case "django":
									codeBlockStyle = `;color:#f8f8f8;background-color:#0a2b1d;`;
									break;
								case "emacs":
									codeBlockStyle = `;color:#d3d3d3;background-color:black;`;
									break;
								case "fadetogrey":
									codeBlockStyle = `;color:white;background-color:#121212;`;
									break;
								case "midnight":
									codeBlockStyle = `;color:#d1edff;background-color:#0f192a;`;
									break;
								case "rdark":
									codeBlockStyle = `;color:#b9bdb6;background-color:#1b2426;`;
									break;
								case "eclipse":
								case "confluence":
									codeBlockStyle = `;color:white;background-color:black;`;
							}
						}
					});
					res = `<div class="code-block">${res.trim()}`;
					res = res.replace('$codeBlockStyle', codeBlockStyle);
					// res = res.replace('$titleStyle', titleStyle);
					return res;
				});
				codeTagFlag = true;
			} else {
				tag = '</code></pre></div>';
				//This pays attention to the list flag and adds the closing </li> tag if needed.
				if (listFlag) {
					tag = `${tag}</li>`;
				}
				codeTagFlag = false;
			}
		}
		if (codeTagFlag && !code_match) {
			tag = tag.replace(/</gi, '&lt;');
			// '<br />';
		}

		const panel_re = /\{(panel|tip|info|note|warning)(.*)}/;
		if (!codeTagFlag && tag.match(panel_re)) {
			if (!panelTagFlag) {
				let panelStyle = "";
				let titleStyle = "";
				let iconlessFlag = "";
				tag = tag.replace(panel_re, function (m0, m1, m2) {
					const panelClass = m1;

					let res = `<div class="${panelClass} ${panelClass}-body" $panelStyle>`
					const splits = m2.split(/[|:]/);
					splits.forEach((el: string) => {
						const elems = el.split('=');
						switch (elems[0]) {
							case "title":
								res = `<div><div class="${panelClass} ${panelClass}-title$iconlessFlag" $titleStyle>${elems[1]}</div>${res}`;
								break;
							case "titleBGColor":
								titleStyle += `background-color: ${elems[1]}; `;
								break;
							case "bgColor":
								panelStyle += `background-color: ${elems[1]}; `;
								break;
							case "borderStyle":
								panelStyle += `border-style: ${elems[1]}; `;
								titleStyle += `border-style: ${elems[1]}; border-bottom:none; `;
								break;
							case "borderColor":
								panelStyle += `border-color: ${elems[1]}; `;
								titleStyle += `border-color: ${elems[1]}; `;
								break;
							case "borderWidth":
								panelStyle += `border-width: ${elems[1]}; `;
								titleStyle += `border-width: ${elems[1]}; `;
								break;
							case "icon":
								iconlessFlag = (elems[1] === "false") ? "-iconless" : "";
								break;
						}
					});
					if (titleStyle.length > 0) {
						titleStyle = `style='${titleStyle.trim()}'`;
					}
					if (panelStyle.length > 0) {
						panelStyle = `style='${panelStyle.trim()}'`;
					}
					if (panelClass != 'panel') {
						panelStyle = "";
						titleStyle = "";
						if (!res.match(`${panelClass}-title`)) {
							res = `<div><div class="${panelClass} ${panelClass}-title$iconlessFlag"></div>${res}`;
						}
					} else {
						if (!res.match(`${panelClass}-title`)) {
							res = `<div>${res}`; // wrap titleles panel;
						}
					}

					res = res.replace('$iconlessFlag', iconlessFlag);
					res = res.replace('$titleStyle', titleStyle);
					res = res.replace('$panelStyle', panelStyle);
					return res;
				});
				panelTagFlag = true;
			} else {
				tag = '</div></div>';
				if (listFlag) {
					tag = `${tag}</li>`;
				}
				panelTagFlag = false;
			}
		}

		// lists
		const li_re = /^([-*#]+)\s(.*)/;
		const li_match = tag.match(li_re);
		if (li_match) {
			listFlag = true;
			listStyle = '';
			tag = '';
			if (li_match[1].match(/#$/)) {
				listTag = 'ol';
				// reset ol after 3rd level
				// add count of non-ol elements for mixed lists
				if ((li_match[1].length + (li_match[1].match(/[-*]/g) || []).length) % 3 === 1) {
					listStyle = ' class="initial"';
				}
			}
			if (li_match[1].match(/[-*]$/)) {
				listTag = 'ul';
			}
			if (li_match[1].match(/-$/)) {
				listStyle = ' class="alternate"';
			}
			if (li_match[1].length > listArr.length) {
				tag = '<' + listTag + listStyle + '>';
				listArr.push(listTag);
			}
			if (li_match[1].length < listArr.length) {
				tag = '</' + listArr.slice(li_match[1].length, listArr.length).reverse().join('></') + '>';
				listArr = listArr.slice(0, li_match[1].length);
			}
			// This prevents the closing </li> tag from being added too prematurely.
			// ToDo: lists are 'open', means not all tags are closed
			tag += "<li>" + li_match[2];
		}


		if ((tag.length === 0) && (listArr.length > 0)) {
			tag = '';
			tag = '</' + listArr.reverse().join('></li></') + '>'
			listArr = [];
			listFlag = false;
		}

		if (!codeTagFlag && !listFlag) {
			// hr and dash lines
			tag = tag.replace(/-{4,}/gi, '<hr>');
			tag = tag.replace(/-{3}/gi, '&mdash;');
			tag = tag.replace(/-{2}/gi, '&ndash;');
		}

		// strong
		tag = tag.replace(/\*([^*]*)\*/g, "<strong>$1</strong>");

		// line-through and italic
		if ((!html_tag) && (!tag.match('<img')) && (!listFlag)) {
			// tag = tag.replace(/\B-([^-]*)-\B/g, " <span style='text-decoration: line-through;'>$1</span> ");
			// special case: in word italic
			// s. https://confluence.atlassian.com/doc/confluence-wiki-markup-251003035.html#ConfluenceWikiMarkup-TextEffects
			tag = tag.replace(/{_}([^_]*)_/g, "<i>$1</i>");
			tag = tag.replace(/\B-((\([^)]*\)|{[^}]*}|\[[^]]+\]){0,3})(\S.*?\S|\S)-\B/g, " <span style='text-decoration: line-through;'>$3</span> ");
			tag = tag.replace(/(?:\b)_((\([^)]*\)|{[^}]*}|\[[^]]+\]){0,3})(\S.*?\S|\S)_(?:\b)/g, "<i>$3</i>");
		}

		//close table
		if (!tag.match(/<\/tr>$/) && tableFlag) {
			tag = '</tbody></table></div>' + tag;
			tableFlag = false;
		}

		if (!tag.match(/<\/?code|<\/?pre>|<\/?table>|<\/?t[r|d|h]|<\/?li|<\/?ul|<\/?ol|<\/?div/) && !codeTagFlag) {
			tag = `<div>${tag}</div>`;
		} else if (codeTagFlag && tag.indexOf('<') < 0) {
			tag = `${tag}\n`;
		}
		result += `${tag}`;
	}
	return result;
}
