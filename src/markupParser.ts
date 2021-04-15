'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

const EXTENTION_ID = 'denco.confluence-markup';
const EMOTICON_PATH = '/media/emoticons/';
const CSS_PATH = '/media/css/';
const MONOSPACE_FONT_FAMILY = vscode.workspace.getConfiguration("confluenceMarkup").monospaceFont;

function imageUri(searchUri: vscode.Uri, imageLink: string) {
	let imageUri
	if (imageLink.match(/^(ht)|(f)tps?:\/\//)) {
		imageUri = vscode.Uri.parse(imageLink);
	} else {
		imageUri = vscode.Uri.file(path.join(searchUri.fsPath, imageLink)).with({ scheme: 'vscode-resource' });
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
}

function emoticonUri(emoticonFile: string) {
	const emoticonUrl = getUri(EMOTICON_PATH, emoticonFile)
	if (emoticonUrl) {
		return emoticonUrl.with({scheme: 'vscode-resource'});
	}
}

export function cssUri(cssFile: string) {
	return getUri(CSS_PATH, cssFile);
}

export function parseMarkup(sourceUri: vscode.Uri, sourceText: string) {
	//TODO: use Tokenizer instead of line loop

	let result = '';
	let listTag = '';
	let listStyle = '';
	let codeTagFlag = false;
	let panelTagFlag = false;
	let tableFlag = false;
	let listFlag = false;
	let listArr: string[] = [];

	for (const entry of sourceText.split(/\r?\n/gi)) {
		let tag = entry;
		let html_tag = false;

		if ((tag.length === 0 )
			&& (! listFlag)
			&& (! tableFlag)
			&& (! codeTagFlag)
			) {
			continue;
		}

		if (! codeTagFlag) {
			tag = tag.replace(/h(\d+)\.\s([^\n]+)/g, "<h$1>$2</h$1>");

			// tag = tag.replace(/_([^_]*)_/g, "<em>$1</em>");
			tag = tag.replace(/\+([^+]*)\+/g, "<u>$1</u>");
			tag = tag.replace(/\^([^^]*)\^/g, "<sup>$1</sup>");
			tag = tag.replace(/~([^~]*)~/g, "<sub>$1</sub>");
			tag = tag.replace(/\\}/g, "&rbrace;").replace(/\{{2}(.*?)\}{2}/g, `<code style='font-family: ${MONOSPACE_FONT_FAMILY}'>$1</code>`);
			tag = tag.replace(/\?{2}(.*)\?{2}/g, "<cite>$1</cite>");
			tag = tag.replace(/\{color:([^}]+)\}/g, "<span style='color:$1;'>").replace(/\{color\}/g, '</span>');

			tag = tag.replace(/bq. (.*)/g, "<blockquote><p>$1</p></blockquote>");
			tag = tag.replace(/\{quote\}(.*)\{quote\}/g, "<blockquote><p>$1</p></blockquote>");


			tag = tag.replace(/:\)/g, '<img alt="(smile)" src="' + emoticonUri('smile.png') + '"/>');
			tag = tag.replace(/:\(/g, '<img alt="(sad)" src="' + emoticonUri('sad.png') + '"/>');
			tag = tag.replace(/:P/g, '<img alt="(cheeky)" src="' + emoticonUri('cheeky.png') + '"/>');
			tag = tag.replace(/:D/g, '<img alt="(laugh)" src="' + emoticonUri('biggrin.png') + '"/>');
			tag = tag.replace(/;\)/g, '<img alt="(wink)" src="' + emoticonUri('wink.png') + '"/>');
			tag = tag.replace(/\(y\)/g, '<img alt="(thumbs-up)" src="' + emoticonUri('thumbs-up.png') + '"/>');
			tag = tag.replace(/\(n\)/g, '<img alt="(thumbs-down)" src="' + emoticonUri('thumbs-down.png') + '"/>');
			tag = tag.replace(/\(i\)/g, '<img alt="(information)" src="' + emoticonUri('information.png') + '"/>');
			tag = tag.replace(/\(\/\)/g, '<img alt="(tick)" src="' + emoticonUri('tick.png') + '"/>');
			tag = tag.replace(/\(x\)/g, '<img alt="(cross)" src="' + emoticonUri('cross.png') + '"/>');
			tag = tag.replace(/\(!\)/g, '<img alt="(warning)" src="' + emoticonUri('warning.png') + '"/>');

			tag = tag.replace(/\\\\/gi, '<br/>');

			const re_href = /\[([^||\]]*)\|?([^[||]*)?\]/g
			if (tag.match(re_href)) {
				tag = tag.replace(re_href, function (m0:string, m1:string, m2:string) {
					if (m1 !== undefined && (m1.startsWith(' ') || m1.endsWith('\\'))) {
						return m0.replace(/\\/g,'').replace(/\|/g, '&vert;')
					}
					if (m2 !== undefined && m2.endsWith('\\')) {
						return m0.replace(/\\/g,'').replace(/\|/g, '&vert;')
					}
					if (m2 != undefined){
						return "<a href='" + m2 + "'>" + m1 + "</a>";
					}
					return "<a href='" + m1 + "'>" + m1 + "</a>";
				});
				html_tag = true;
			}
			//img
			const img_re = /!([^|]*)\|?.*!/;
			const img_match = tag.match(img_re);
			if (img_match) {
				tag = '<img src="' + imageUri(sourceUri, img_match[1]) + '"/>';
			}

			//Table
			const tab_th_re = /\s*[^{]*\|{2}[^}]*$/gi;
			const tab_td_re = /\s*[^{]*\|[^}]*$/gi;
			if (!html_tag && (tag.match(tab_th_re) || tag.match(tab_td_re))) {
				tag = tag.replace(/^\|{2,}/, '||');
				tag = tag.replace(/^\|{2}/, '<th>');
				tag = tag.replace(/\|{2}$/, '</th>');
				tag = tag.replace(/\|{2}/gi, '</th><th>');
				tag = tag.replace(/^\|/, '<td>');
				tag = tag.replace(/\|$/, '</td>');
				tag = tag.replace(/\|/gi, '</td><td>');
				if (tableFlag == false) {
					tag = '<table>' + tag;
				}
				tag = '<tr>' + tag + '</tr>';
				tableFlag = true;
			}
		}

		// code
		// online code tag
		tag = tag.replace(/\{(noformat|code)[^}]*\}(.*)\{(noformat|code)\}/, function (m0, m1, m2) {
			return `<pre><code style='font-family: ${MONOSPACE_FONT_FAMILY}'>${m2.replace(/</gi, '&lt;')}</code></pre>`;
		});

		const code_re = /\{(noformat|code)[^}]*\}/;
		const code_match = tag.match(code_re);
		if (code_match) {
			if (! codeTagFlag) {
				tag = `<pre><code style='font-family: ${MONOSPACE_FONT_FAMILY}'>`;
				codeTagFlag = true;
			} else {
				tag = '</pre></code>';
				codeTagFlag = false;
			}
		}

		const panel_re = /\{panel(.*)}/;
		if (! codeTagFlag && tag.match(panel_re)) {
			if (! panelTagFlag ) {
				let panelStyle = "";
				let titleStyle = "";
				tag = tag.replace(panel_re, function (m0, m1) {
					let res = '<div class="panel panel-body" $panelStyle>'
					const splits = m1.split(/[|:]/);
					splits.forEach( (el:string) => {
						const elems = el.split('=');
						if (elems[0] === "title"){
							res = `<div class="panel panel-title" $titleStyle>${elems[1]}</div>${res}`;
						}
						if (elems[0] === "titleBGColor"){
							if (titleStyle.length === 0) {
								titleStyle = `style='background-color: ${elems[1]};`;
							} else {
								titleStyle += ` background-color: ${elems[1]};`;
							}
						}
						if (elems[0] === "bgColor"){
							if (panelStyle.length === 0) {
								panelStyle = `style='background-color: ${elems[1]};`;
							} else {
								panelStyle += ` background-color: ${elems[1]};`;
							}
						}
						if (elems[0] === "borderStyle"){
							if (panelStyle.length === 0) {
								panelStyle = `style='border-style: ${elems[1]}; `;
							} else {
								panelStyle += ` border-style: ${elems[1]}; `;
							}
							if (titleStyle.length === 0) {
								titleStyle = `style='border-style: ${elems[1]}; border-bottom:none; `;
							} else {
								titleStyle += ` border-style: ${elems[1]}; border-bottom:none; `;
							}
						}
						if (elems[0] === "borderColor"){
							if (panelStyle.length === 0) {
								panelStyle = `style='border-color: ${elems[1]}; `;
							} else {
								panelStyle += ` border-color: ${elems[1]}; `;
							}
							if (titleStyle.length === 0) {
								titleStyle = `style='border-color: ${elems[1]}; `;
							} else {
								titleStyle += ` border-color: ${elems[1]}; `;
							}
						}
						if (elems[0] === "borderWidth"){
							if (panelStyle.length === 0) {
								panelStyle = `style='border-width: ${elems[1]}; `;
							} else {
								panelStyle += ` border-width: ${elems[1]}; `;
							}
							if (titleStyle.length === 0) {
								titleStyle = `style='border-width: ${elems[1]}; `;
							} else {
								titleStyle += ` border-width: ${elems[1]}; `;
							}
						}
					});
					if (titleStyle.length > 0) {
						titleStyle += `'`;
					}
					if (panelStyle.length > 0) {
						panelStyle += `'`;
					}
					res = res.replace('$panelStyle', panelStyle);
					res = res.replace('$titleStyle', titleStyle);
					return res;
				});
				panelTagFlag = true;
			} else {
				tag = '</div>';
				panelTagFlag = false;
			}
		}

		if (! codeTagFlag) {
			// lists
			const li_re = /^([-|*|#]+)\s(.*)/;
			const li_match = tag.match(li_re);
			if (li_match) {
				listFlag = true;
				listStyle = '';
				tag = '';
				if (li_match[1].match(/#$/)) {
					listTag = 'ol';
					// reset ol after 3rd level
					// add count of non-ol elements for mixed lists
					if ((li_match[1].length + (li_match[1].match(/[-|*]/g) || []).length) % 3 === 1) {
						listStyle = ' class="initial"';
					}
				}
				if (li_match[1].match(/[-|*]$/)) {
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
				tag += "<li>" + li_match[2] + "</li>";
			}


			if ((tag.length === 0) && (listArr.length > 0)) {
				tag = '';
				tag = '</' + listArr.reverse().join('></') + '>'
				listArr = [];
				listFlag = false;
			}

			// hr and dash lines
			tag = tag.replace(/-{4,}/gi, '<hr />');
			tag = tag.replace(/-{3}/gi, '&mdash;');
			tag = tag.replace(/-{2}/gi, '&ndash;');
			// strong
			tag = tag.replace(/\*([^*]*)\*/g, "<strong>$1</strong>");
			// line-through
			if ((!html_tag) && (!tag.match('<img')) && (!listFlag)) {
				// tag = tag.replace(/\B-([^-]*)-\B/g, " <span style='text-decoration: line-through;'>$1</span> ");
				// tag = tag.replace(/_([^_]*)_/g, "<i>$1</i>");
				tag = tag.replace(/\B-((\([^)]*\)|{[^}]*}|\[[^]]+\]){0,3})(\S.*?\S|\S)-\B/g," <span style='text-decoration: line-through;'>$3</span> ");
				tag = tag.replace(/(?:\b)_((\([^)]*\)|{[^}]*}|\[[^]]+\]){0,3})(\S.*?\S|\S)_(?:\b)/g, "<i>$3</i>");
			}
		} else {
			if (tag !== `<pre><code style='font-family: ${MONOSPACE_FONT_FAMILY}'>`) {
				tag = tag.replace(/</gi, '&lt;') + '<br />';
			}
		}

		//close table
		if (!tag.match(/<\/tr>$/) && tableFlag) {
			tag = '</table>' + tag;
			tableFlag = false;
		}
		result += "<p>" + tag + "</p>";
	}

	return result;
}
