'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { packConfluenceUri, ConfluenceContentProvider } from './ConfluenceContentProvider';
import { cssUri } from './markupParser';


function getRenderedContent(contentProvider: ConfluenceContentProvider, uri: vscode.Uri, panel: vscode.WebviewPanel) {
	contentProvider.provideTextDocumentContent(packConfluenceUri(uri)).then((renderedContent) => {
		if (panel && panel.webview) {
			// Security
			// https://code.visualstudio.com/api/extension-guides/webview#security

			const cssFile = cssUri('confluence.css')
			let cssLink = ""
			if (cssFile) {
				const cssUrl = panel.webview.asWebviewUri(cssFile)
				cssLink = `<link rel="stylesheet" href="${cssUrl}">`
			}
			const title = 'Preview ' + path.basename(uri.fsPath);
			panel.webview.html = `<!DOCTYPE html>
				<html lang="und">
				<head>
					<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="Content-Security-Policy"
						content="default-src 'none';
						img-src self vscode-resource: https:;
						script-src self vscode-resource:;
						style-src 'unsafe-inline' self vscode-resource:;">
					${cssLink}
					<title>${title}</title>
				</head>
				<body>
					${renderedContent}
				</body>
				</html>`;
		}
	}, (reason) => {
		// https://code.visualstudio.com/api/references/vscode-api#window.createOutputChannel
		// ToDo: custom output channel
		// vscode.window.showErrorMessage(reason); // disable spam
	});
}

function createPanel(contentProvider: ConfluenceContentProvider, editor: vscode.TextEditor, viewColumn: vscode.ViewColumn) {

	const title = 'Preview ' + path.basename(editor.document.uri.fsPath);

	// Create and show panel
	const panel = vscode.window.createWebviewPanel(
		'confluencePreview',
		title,
		viewColumn,
		{
			retainContextWhenHidden: true
		}
	);
	getRenderedContent(contentProvider, editor.document.uri, panel)

	return panel;
}

function setDispose(panel: vscode.WebviewPanel, subscriptions: { dispose(): vscode.Disposable; }[] | undefined) {
	// Reset when the current panel is closed
	panel.onDidDispose(
		() => { },
		null,
		subscriptions
	);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const contentProvider = new ConfluenceContentProvider();
	const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(ConfluenceContentProvider.confluenceURI.scheme, contentProvider);
	let currentPanel: vscode.WebviewPanel;

	// Show confluence
	const previewDisposable = vscode.commands.registerCommand('confluence.showPreview', () => {
		const editor = vscode.window.activeTextEditor;
		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a confluence file');
			return;
		} else {
			currentPanel = createPanel(contentProvider, editor, vscode.ViewColumn.Active);
			setDispose(currentPanel, context.subscriptions);
			return currentPanel;
		}
	});

	// Show confluence to the side
	const sidePreviewDisposable = vscode.commands.registerCommand('confluence.showPreviewToSide', () => {
		const editor = vscode.window.activeTextEditor;
		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a confluence file');
			return;
		} else {
			currentPanel = createPanel(contentProvider, editor, vscode.ViewColumn.Two);
			setDispose(currentPanel, context.subscriptions);
			return currentPanel;
		}
	});



	vscode.workspace.onDidChangeTextDocument(e => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			if (e.document === editor.document) {
				contentProvider.update(packConfluenceUri(e.document.uri));
				getRenderedContent(contentProvider, e.document.uri, currentPanel)
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
