'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { packConfluenceUri, unpackConfluenceUri, ConfluenceContentProvider } from './ConfluenceContentProvider';

const path = require('path');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const contentProvider = new ConfluenceContentProvider(context);
	const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(ConfluenceContentProvider.confluenceURI.scheme, contentProvider);

	// Show confluence
	let previewDisposable = vscode.commands.registerCommand('confluence.showPreview', () => {
		let editor = vscode.window.activeTextEditor;

		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a confluence file');
			return;
		}

		let title = 'Preview ' + path.basename(editor.document.uri.fsPath);

		return vscode.commands.executeCommand('vscode.previewHtml', packConfluenceUri(editor.document.uri), vscode.ViewColumn.One, title).then((success) => {
		}, (reason) => {
			vscode.window.showErrorMessage(reason);
		});
	});

	// Show confluence to the side
	let sidePreviewDisposable = vscode.commands.registerCommand('confluence.showPreviewToSide', () => {
		let editor = vscode.window.activeTextEditor;

		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a confluence file');
			return;
		}

		let title = 'Preview ' + path.basename(editor.document.uri.fsPath);

		return vscode.commands.executeCommand('vscode.previewHtml', packConfluenceUri(editor.document.uri), vscode.ViewColumn.Two, title).then((success) => {
		}, (reason) => {
			vscode.window.showErrorMessage(reason);
		});
	});

	vscode.workspace.onDidChangeTextDocument(e => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			if (e.document === editor.document) {
				contentProvider.update(packConfluenceUri(e.document.uri));
			}
		}
	});

	context.subscriptions.push(contentProviderRegistration,
		previewDisposable,
		sidePreviewDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
