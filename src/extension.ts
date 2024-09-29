// Import necessary modules
import * as vscode from 'vscode';
import { GitExtension, API as GitAPI, Repository } from './typings/git';
import emojiRegex from 'emoji-regex';

// Define an interface for commit prefixes
interface CommitPrefix {
    label: string;
    prefix: string;
    emoji: string;
    active: boolean;
    main: boolean;
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    // Register the command
    const disposable = vscode.commands.registerCommand('extension.fillCommitMessage', async () => {
        // Get the active Git repository
        const repository = getGitRepository();
        if (!repository) {
            return;
        }

        // Get extension configuration
        const config = getExtensionConfig();
        if (!config) {
            return;
        }

        const {
            activePrefixes,
            labelStyle,
            includeEmojiInCommitMessage,
            appendEmojiToEnd,
        } = config;

        // Prepare Quick Pick items
        const { mainItems, secondaryItems, settingsItem } = prepareQuickPickItems(
            activePrefixes,
            labelStyle
        );

        // Show the Quick Pick to the user
        showQuickPick(
            mainItems,
            secondaryItems,
            settingsItem,
            repository,
            activePrefixes,
            includeEmojiInCommitMessage,
            appendEmojiToEnd
        );
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}




// -------------- Functions -------------- //




/**
 * Retrieves the active Git repository.
 */
function getGitRepository(): Repository | null {
    const gitExtension =
        vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
    if (!gitExtension) {
        vscode.window.showErrorMessage('Unable to load Git Extension');
        return null;
    }

    const git: GitAPI = gitExtension.getAPI(1);

    if (!git.repositories || git.repositories.length === 0) {
        vscode.window.showErrorMessage('No Git repositories found');
        return null;
    }

    // Use the first repository (or modify to select a specific one)
    return git.repositories[0];
}

/**
 * Retrieves and validates the extension configuration.
 */
function getExtensionConfig() {
    const config = vscode.workspace.getConfiguration('myExtension');
    const prefixes = config.get<CommitPrefix[]>('commitMessagePrefixes', []);
    const labelStyle = config.get<string>('labelStyle', 'default');
    const includeEmojiInCommitMessage = config.get<boolean>(
        'includeEmojiInCommitMessage',
        false
    );
    const appendEmojiToEnd = config.get<boolean>('appendEmojiToEnd', false);

    // Filter active prefixes
    const activePrefixes = prefixes.filter((p) => p.active);

    if (activePrefixes.length === 0) {
        vscode.window.showErrorMessage('No active prefixes found in settings.');
        return null;
    }

    return {
        activePrefixes,
        labelStyle,
        includeEmojiInCommitMessage,
        appendEmojiToEnd,
    };
}

/**
 * Prepares the items to be displayed in the Quick Pick.
 */
function prepareQuickPickItems(
    activePrefixes: CommitPrefix[],
    labelStyle: string
) {
    // Map prefixes to Quick Pick items
    const allItems = activePrefixes.map((p) => {
        let label = p.label;
        if (labelStyle === 'fancy') {
            label = `${p.emoji} ${label}`;
        }
        return {
            label: label,
            description: p.prefix,
            alwaysShow: false,
            prefixData: p,
        } as vscode.QuickPickItem & { prefixData: CommitPrefix };
    });

    // Separate main and secondary items
    const mainItems = allItems.filter((item) => item.prefixData.main);
    const secondaryItems = allItems.filter((item) => !item.prefixData.main);

    // Add the "Open prefix settings" item
    const settingsItem = {
        label: 'Open prefix settings',
        description: '$(gear)',
        alwaysShow: true,
    } as vscode.QuickPickItem;

    return { mainItems, secondaryItems, settingsItem };
}

/**
 * Displays the Quick Pick and handles user selection.
 */
function showQuickPick(
    mainItems: vscode.QuickPickItem[],
    secondaryItems: vscode.QuickPickItem[],
    settingsItem: vscode.QuickPickItem,
    repository: Repository,
    activePrefixes: CommitPrefix[],
    includeEmojiInCommitMessage: boolean,
    appendEmojiToEnd: boolean
) {
    // Create the Quick Pick
    const quickPick = vscode.window.createQuickPick<
        vscode.QuickPickItem & { prefixData?: CommitPrefix }
    >();
    quickPick.title = 'Select Commit Prefix';
    quickPick.placeholder = 'Select a commit message prefix';
    quickPick.matchOnDescription = true;

    // Initially show only main items and settings item
    quickPick.items = [
        ...mainItems,
        { kind: vscode.QuickPickItemKind.Separator } as any,
        settingsItem,
    ];

    // Handle input changes to include secondary items when the user types
    quickPick.onDidChangeValue((value) => {
        if (value.trim() !== '') {
            // User has typed something, include secondary items
            quickPick.items = [
                ...mainItems,
                ...secondaryItems,
                { kind: vscode.QuickPickItemKind.Separator } as any,
                settingsItem,
            ];
        } else {
            // No input, show only main items
            quickPick.items = [
                ...mainItems,
                { kind: vscode.QuickPickItemKind.Separator } as any,
                settingsItem,
            ];
        }
    });

    // Handle selection
    quickPick.onDidAccept(() => {
        const selectedItem = quickPick.selectedItems[0];
        quickPick.hide();

        if (!selectedItem) {
            // User cancelled the quick pick
            return;
        }

        // Check if the user selected the "Open prefix settings" option
        if (selectedItem.label === 'Open prefix settings') {
            // Open the settings editor to this extension's configuration
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                '@ext:FinnMiddleton.commit-prefixes'
            );
            return;
        }

        // Get the selected prefix data
        const selectedPrefix = selectedItem.prefixData;

        if (!selectedPrefix) {
            vscode.window.showErrorMessage('Selected prefix not found.');
            return;
        }

        // Update the commit message with the selected prefix
        updateCommitMessage(
            repository,
            selectedPrefix,
            activePrefixes,
            includeEmojiInCommitMessage,
            appendEmojiToEnd
        );
    });

    // Ensure the Quick Pick is disposed of when hidden
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
}

/**
 * Updates the commit message in the Git repository input box.
 */
function updateCommitMessage(
    repository: Repository,
    selectedPrefix: CommitPrefix,
    activePrefixes: CommitPrefix[],
    includeEmojiInCommitMessage: boolean,
    appendEmojiToEnd: boolean
) {
    // Get the current commit message
    let currentMessage = repository.inputBox.value;

    // Build the new prefix
    let newPrefix = selectedPrefix.prefix;
    if (includeEmojiInCommitMessage && !appendEmojiToEnd) {
        newPrefix = `${selectedPrefix.emoji} ${newPrefix}`;
    }

    // Build regex to detect existing prefixes at the start
    const prefixPatterns = activePrefixes.map((p) => {
        let prefix = p.prefix;
        if (includeEmojiInCommitMessage && !appendEmojiToEnd) {
            prefix = `${p.emoji} ${prefix}`;
        }
        return escapeRegExp(prefix);
    });
    const prefixRegex = new RegExp(`^(${prefixPatterns.join('|')})\\s*`);

    // Remove existing prefix at the start if present
    currentMessage = currentMessage.replace(prefixRegex, '').trimStart();

    // Determine if a space is needed between newPrefix and currentMessage
    const separator =
        !/\s$/.test(newPrefix) && currentMessage.length > 0 ? ' ' : '';

    // Build regex to detect existing emoji at the end
    const emojiAtEndRegex = new RegExp(`(\\s*)(${emojiRegex().source})$`);

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
}

/**
 * Escapes special characters in a string for use in a regular expression.
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}