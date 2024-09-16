// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitExtension, API as GitAPI, Repository } from './typings/git';
import emojiRegex from 'emoji-regex';

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

        // Get the configuration
        const config = vscode.workspace.getConfiguration('myExtension');
        const prefixes = config.get<Array<{ label: string; prefix: string; emoji: string; active: boolean }>>('commitMessagePrefixes', []);
        const labelStyle = config.get<string>('labelStyle', 'default');
        const includeEmojiInCommitMessage = config.get<boolean>('includeEmojiInCommitMessage', false);

        // Filter active prefixes
        const activePrefixes = prefixes.filter(p => p.active);

        if (activePrefixes.length === 0) {
            vscode.window.showErrorMessage('No active prefixes found in settings.');
            return;
        }

        // Prepare items for Quick Pick
        const items = activePrefixes.map(p => {
            let label = p.label;
            if (labelStyle === 'fancy') {
                label = `${p.emoji} ${label}`;
            }
            return {
                label: label,
                description: p.prefix
            };
        });

        const selectedItem = await vscode.window.showQuickPick(items, { placeHolder: 'Select a commit message prefix' });

        if (!selectedItem) {
            // User cancelled the quick pick
            return;
        }

        // Find the selected prefix
        let selectedPrefix;
        const emojiRegexPattern = emojiRegex();

        if (labelStyle === 'fancy') {
            // Remove emoji and space
            const labelWithoutEmoji = selectedItem.label.replace(emojiRegexPattern, '').trim();
            selectedPrefix = activePrefixes.find(p => p.label === labelWithoutEmoji);
        } else {
            selectedPrefix = activePrefixes.find(p => p.label === selectedItem.label);
        }

        if (!selectedPrefix) {
            vscode.window.showErrorMessage('Selected prefix not found.');
            return;
        }

        // Build regex to detect existing prefixes
        function escapeRegExp(string: string): string {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        const prefixPatterns = activePrefixes.map(p => {
            let prefix = p.prefix;
            if (includeEmojiInCommitMessage) {
                prefix = p.emoji + ' ' + prefix;
            }
            return escapeRegExp(prefix);
        });

        const regexPattern = `^(${prefixPatterns.join('|')})\\s*`;
        const prefixRegex = new RegExp(regexPattern);

        // Get the current commit message and remove existing prefix if present
        let currentMessage = repository.inputBox.value;

        currentMessage = currentMessage.replace(prefixRegex, '').trimStart();

        // Build the new prefix
        let newPrefix = selectedPrefix.prefix;
        if (includeEmojiInCommitMessage) {
            newPrefix = `${selectedPrefix.emoji} ${newPrefix}`;
        }

        // Update the commit message
        repository.inputBox.value = `${newPrefix}${currentMessage ? ' ' + currentMessage : ''}`;
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
