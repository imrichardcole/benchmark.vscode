import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('benchmark-vscode.success', () => {
		vscode.window.showInformationMessage('You have successfully installed the benchmark extension');
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {}
