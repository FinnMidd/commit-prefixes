// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitExtension, API as GitAPI, Repository } from './typings/git';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Register the command
	let disposable = vscode.commands.registerCommand('extension.fillCommitMessage', async () => {
        // Access the Git extension
        const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
        if (!gitExtension) {
            vscode.window.showErrorMessage('Unable to load Git Extension');
            return;
        }

        // Get the Git API
        const git: GitAPI = gitExtension.getAPI(1);

        if (!git.repositories || git.repositories.length === 0) {
            vscode.window.showErrorMessage('No Git repositories found');
            return;
        }

        // Use the first repository (or modify to select a specific one)
        const repository: Repository = git.repositories[0];

        // Set the commit message
        repository.inputBox.value = 'Update: ' + repository.inputBox.value;
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
