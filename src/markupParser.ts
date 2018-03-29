'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

const EXTENTION_ID = 'denco.confluence-markup';
const EMOTICON_PATH = '/resources/emoticons/';
const CSS_PATH = '/resources/css/';

function imageUri(searchUri: vscode.Uri, imageLink: string) {
	let imageUri
	if (imageLink.match(/^(ht)|(f)tps?:\/\//)) {
		imageUri = vscode.Uri.parse(imageLink);
	} else {
		let extPath = path.dirname(searchUri.fsPath);
		imageUri = vscode.Uri.file(path.join(extPath, imageLink));
	}
	return imageUri;
}

function emoticonUri(emoticonFile: string) {
	let extPath = vscode.extensions.getExtension(EXTENTION_ID).extensionPath;
	let emoticonUri = vscode.Uri.file(path.join(extPath, EMOTICON_PATH, emoticonFile));
	return emoticonUri;
}

export function cssUri(cssFile: string) {
	let extPath = vscode.extensions.getExtension(EXTENTION_ID).extensionPath;
	let cssUri = vscode.Uri.file(path.join(extPath, CSS_PATH, cssFile));
	return cssUri;
}

export async function parseMarkup(sourceUri: vscode.Uri, sourceText: string) {
	//TODO: use Tokenazer instead of line loop

	var result = '';
	let listTag = '';
	let codeTagFlag = 0;
	let tableFlag = true;
	for (let entry of sourceText.split(/\n/gi)) {
		let tag = entry;
		let html_tag = false;

		if (codeTagFlag == 0) {
			tag = tag.replace(/h(\d+)\.\s([^\n]+)/g, "<h$1>$2</h$1>");
			tag = tag.replace(/-{4,}/gi, '<hr />');
			tag = tag.replace(/-{3}/gi, '&mdash;');
			tag = tag.replace(/-{2}/gi, '&ndash;');

			// tag = tag.replace(/_([^_]*)_/g, "<em>$1</em>");
			tag = tag.replace(/\+([^\+]*)\+/g, "<u>$1</u>");
			tag = tag.replace(/\^([^\^]*)\^/g, "<sup>$1</sup>");
			tag = tag.replace(/~([^~]*)~/g, "<sub>$1</sub>");
			tag = tag.replace(/\{{2}(.*)\}{2}/g, "<code>$1</code>");
			tag = tag.replace(/\?{2}(.*)\?{2}/g, "<cite>$1</cite>");
			tag = tag.replace(/\{color:(\w+)\}(.*)\{color\}/g, "<span style='color:$1;'>$2</span>");

			tag = tag.replace(/bq. (.*)/g, "<blockquote><p>$1</p></blockquote>");
			tag = tag.replace(/\{quote\}(.*)\{quote\}/g, "<blockquote><p>$1</p></blockquote>");


			tag = tag.replace(/:\)/g, '<img alt="(smile)" src="' + emoticonUri('smile.png') + '"/>');
			tag = tag.replace(/:\(/g, '<img alt="(sad)" src="' + emoticonUri('sad.png') + '"/>');
			tag = tag.replace(/:P/g, '<img alt="(cheeky)" src="' + emoticonUri('tongue.png') + '"/>');
			tag = tag.replace(/:D/g, '<img alt="(laugh)" src="' + emoticonUri('biggrin.png') + '"/>');
			tag = tag.replace(/;\)/g, '<img alt="(wink)" src="' + emoticonUri('wink.png') + '"/>');
			tag = tag.replace(/\(y\)/g, '<img alt="(thumbs-up)" src="' + emoticonUri('thumbs_up.png') + '"/>');
			tag = tag.replace(/\(n\)/g, '<img alt="(thumbs-down)" src="' + emoticonUri('thumbs_down.png') + '"/>');
			tag = tag.replace(/\(i\)/g, '<img alt="(information)" src="' + emoticonUri('information.png') + '"/>');
			tag = tag.replace(/\(\/\)/g, '<img alt="(tick)" src="' + emoticonUri('check.png') + '"/>');
			tag = tag.replace(/\(x\)/g, '<img alt="(cross)" src="' + emoticonUri('error.png') + '"/>');
			tag = tag.replace(/\(!\)/g, '<img alt="(warning)" src="' + emoticonUri('warning.png') + '"/>');

			tag = tag.replace(/\\\\/gi, '<br/>');

			let re = /\[([^|]*)?\|?([^|]*)\]/g
			if (tag.match(re)) {
				tag = tag.replace(re, function (m0, m1, m2) {
					if ((m1.length !== 0) && (m2.length !== 0)) {
						return "<a href='" + m2 + "'>" + m1 + "</a>";
					} else {
						return "<a href='" + m1 + "'>" + m1 + "</a>";
					}
				});
				html_tag = true;
			}
			//img
			let img = /!(.*)!/;
			let match = tag.match(img);
			if (match) {
				tag = '<img src="' + imageUri(sourceUri, match[1]) + '"/>';
			}

			//table
			let tab_th_re = /\s*\|\|.*\|\|$/gi;
			let tab_td_re = /\s*\|.*\|$/gi;
			if (tag.match(tab_th_re)) {
				tag = tag.replace(/^\|\|/, '<th>');
				tag = tag.replace(/\|\|$/, '</th>');
				tag = tag.replace(/\|\|/gi, '</th><th>');
				tag = '<table><tr>' + tag + '</tr>';
				tableFlag = true;
			} else if (tag.match(tab_td_re)) {
				tag = tag.replace(/^\|/, '<td>');
				tag = tag.replace(/\|$/, '</td>');
				tag = tag.replace(/\|/gi, '</td><td>');
				tag = '<tr>' + tag + '</tr>';
				tableFlag = true;
			}
		}

		// code
		// online code tag
		tag = tag.replace(/\{(noformat|code)[^\}]*\}(.*)\{(noformat|code)\}/, function (m0, m1, m2) {
			return "<pre><code>" + m2.replace(/</gi, '&lt;') + "</code></pre>";
		});

		let re = /\{[(code)|(noformat)].*\}/;
		let match = tag.match(re);
		if (match) {
			if (codeTagFlag === 0) {
				tag = '<pre><code>';
				codeTagFlag = 1;
			} else {
				tag = '</pre></code>';
				codeTagFlag = 0;
			}
		}

		if (codeTagFlag === 0) {
			// lists
			re = /^([-|\*|#]+)\s(.*)/;
			match = tag.match(re);
			if (match) {
				if (listTag.length === 0) {
					if (match[1] == '#') {
						listTag = 'ol';
					} else {
						listTag = 'ul';
						if (match[1] == '-') {
							listTag += ' style="list-style-type: square;"'
						}
					}
					tag = '<' + listTag + '>';
				} else {
					tag = '';
				}
				tag += "<li>" + match[2] + "</li>";
			}

			if ((tag.length === 0) && (listTag.length !== 0)) {
				tag += '</' + listTag + '>';
				listTag = '';
			}

			tag = tag.replace(/\*([^\*]*)\*/g, "<strong>$1</strong>");
			if ((! html_tag) && (! tag.match('<img'))) {
				tag = tag.replace(/-([\w ]*)-/g, "<span style='text-decoration: line-through;'>$1</span>");
				tag = tag.replace(/_([\w ]*)_/g, "<i>$1</i>");
			}
		} else {
			if (tag !== '<pre><code>'){
				tag = tag.replace(/</gi, '&lt;') + '<br />';
			}
		}

		if (tag.match(/^s*$/)){
			tag = '<br />';
		}
		//close table
		if (!tag.match(/<\/tr>$/)){
			tag = '</table>' + tag;
			tableFlag = false;
		}
		result += tag;

		// console.log("PARSED:" + tag);
	}

	return result;
}