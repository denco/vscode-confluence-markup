'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { parseMarkup, cssUri } from './markupParser';

export function packConfluenceUri(uri: vscode.Uri) {
	// Temporarily change the URI scheme
	// Pack the original URI in to the 'query' field
	if (uri.scheme === ConfluenceContentProvider.confluenceURI.scheme) {
		// Nothing to do
		return uri;
	}

	return ConfluenceContentProvider.confluenceURI.with({ query: uri.toString() });
}

export function unpackConfluenceUri(uri: vscode.Uri) {
	// Restore original URI scheme from the 'query' field
	if ((uri.scheme !== ConfluenceContentProvider.confluenceURI.scheme) || (!uri.query)) {
		// Not a modified textile URI, nothing to do
		return uri;
	}

	return vscode.Uri.parse(uri.query);
}

export class ConfluenceContentProvider implements vscode.TextDocumentContentProvider {
	public static readonly confluenceURI = vscode.Uri.parse('confluence:');

	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private _waiting: boolean = false;

	constructor(private context: vscode.ExtensionContext) {
	}

	dispose() {
		this._onDidChange.dispose();
	}

	public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		let document = await vscode.workspace.openTextDocument(unpackConfluenceUri(uri));
		let body = await parseMarkup(unpackConfluenceUri(uri), document.getText());
		let cssLink = cssUri("confluence.css");

		return `<!DOCTYPE html>
			<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<link rel="stylesheet" href="${cssLink}">
			</head>
			<body>
				${body}
			</body>
			</html>`;
	}

	get onDidChange(): vscode.Event<vscode.Uri> {
		return this._onDidChange.event;
	}

	public update(uri: vscode.Uri) {
		if (!this._waiting) {
			this._waiting = true;
			setTimeout(() => {
				this._waiting = false;
				this._onDidChange.fire(uri);
			}, 300);
		}
	}
}
