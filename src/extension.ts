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
        const appendEmojiToEnd = config.get<boolean>('appendEmojiToEnd', false);

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
                description: p.prefix,
            };
        });

        // Add a separator before the settings item
        items.push({ kind: vscode.QuickPickItemKind.Separator });

        // Add the "Open prefix settings" item
        items.push({
            label: 'Open prefix settings',
            description: '$(gear)'
        });

        // Add a title to the Quick Pick dialog
        const quickPickTitle = 'Select Commit Prefix';

        const selectedItem = await vscode.window.showQuickPick(items, {
            title: quickPickTitle,
            placeHolder: 'Select a commit message prefix'
        });

        if (!selectedItem) {
            // User cancelled the quick pick
            return;
        }

        // Check if the user selected the "Open prefix settings" option
        if (selectedItem.label === 'Open prefix settings') {
            // Open the settings editor to this extension's configuration
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:FinnMiddleton.commit-prefixes');
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

        // Get the current commit message
        let currentMessage = repository.inputBox.value;

        // Build the new prefix
        let newPrefix = selectedPrefix.prefix;
        if (includeEmojiInCommitMessage && !appendEmojiToEnd) {
            newPrefix = `${selectedPrefix.emoji} ${newPrefix}`;
        }

        // Build regex to detect existing prefixes at the start
        function escapeRegExp(string: string): string {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        const prefixPatterns = activePrefixes.map(p => {
            let prefix = p.prefix;
            if (includeEmojiInCommitMessage && !appendEmojiToEnd) {
                prefix = `${p.emoji} ${prefix}`;
            }
            return escapeRegExp(prefix);
        });

        const prefixRegex = new RegExp(`^(${prefixPatterns.join('|')})\\s*`);

        // Remove existing prefix at the start if present
        currentMessage = currentMessage.replace(prefixRegex, '').trimStart();

        // Trim leading spaces from currentMessage
        currentMessage = currentMessage.trimStart();

        // Determine if a space is needed between newPrefix and currentMessage
        let separator = '';

        if (!/\s$/.test(newPrefix) && currentMessage.length > 0) {
            separator = ' ';
        }

        // Build regex to detect existing emoji at the end
        const emojiAtEndRegex = new RegExp(`(\\s*)(${emojiRegexPattern.source})$`);

        // Remove existing emoji at the end if present
        if (appendEmojiToEnd) {
            currentMessage = currentMessage.replace(emojiAtEndRegex, '').trimEnd();
        }

        // Append emoji at the end if setting is enabled
        if (appendEmojiToEnd) {
            // Remove any trailing spaces from currentMessage
            currentMessage = currentMessage.trimEnd();

            // Ensure there is a space between the message and the emoji
            const space = currentMessage.length > 0 ? ' ' : '';
            const emoji = selectedPrefix.emoji;

            repository.inputBox.value = `${newPrefix}${separator}${currentMessage}${space}${emoji}`;
        } else {
            // Update the commit message with prefix at the start
            repository.inputBox.value = `${newPrefix}${separator}${currentMessage}`;
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
