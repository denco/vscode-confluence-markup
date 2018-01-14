'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { open } from 'fs';

const EXTENTION_ID = 'denco.confluence-markup';
const EMOTICON_PATH = '/resources/emoticons/';

function emoticonUri(emoticonFile: string) {
	let extPath = vscode.extensions.getExtension(EXTENTION_ID).extensionPath;
	let emoticonUri = vscode.Uri.file(path.join(extPath, EMOTICON_PATH, emoticonFile));
	return emoticonUri;
}

export async function parseMarkup(sourceText: string, sourceUri: vscode.Uri) {
	var result = '';

	let openTag = '';
	for (let entry of sourceText.split(/\n/gi)) {
		let tag = entry.replace(/h(\d+)\.\s([^\n]+)/g, "<h$1>$2</h$1>");
		tag = tag.replace(/-{4,}/gi, '<hr />');
		tag = tag.replace(/-{3}/gi, '&mdash;');
		tag = tag.replace(/-{2}/gi, '&ndash;');
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

		tag = tag.replace(/\[([^|]*)?\|?([^|]*)\]/, "<a href='$2'>$1</a>");

		let re = /^([-|\*|#]+)\s(.*)/;
		let match = tag.match(re);
		if (match) {
			if (openTag.length == 0) {
				if (match[1] == '#') {
					openTag = 'ol';
				} else {
					openTag = 'ul'
				}
				tag = '<' + openTag + '>';
			} else {
				tag = '';
			}
			tag += "<li>" + match[2] + "</li>";
		}

		if ((tag.length == 0) && (openTag.length != 0)) {
			tag += '</' + openTag + '>';
			openTag = '';
		}

		console.log("PARSED:" + tag);
		result += tag + '<br />';
	}

	return result;
}