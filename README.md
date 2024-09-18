# Commit Prefixes VSCode Extension

Enhance your Git commit workflow in Visual Studio Code by effortlessly adding prefixes and emojis to your commit messages. Customize your prefixes, include emojis, and streamline your commit process with ease.

## Features

- **Quickly Insert Commit Prefixes**: Use the `Fill Commit Message` command to select from a list of predefined prefixes and automatically insert them into your commit message.
- **Emoji Support**: Optionally include emojis with your prefixes, either at the beginning or end of your commit messages.
- **Customizable Prefixes**: Define your own set of prefixes, labels, and associated emojis through the extension settings.
- **Source Control Integration**: Access the `Fill Commit Message` command directly from the Source Control view with a convenient action button.
- **Settings Access**: Easily modify your prefix settings directly from the Quick Pick menu.

## Installation

1. Install the extension from the [VSCode Marketplace](#) or download it directly from the [GitHub repository](#).
2. Reload or restart Visual Studio Code to activate the extension.

## Usage

### 1. Configuring Prefixes

- Go to **File** > **Preferences** > **Settings** (or press `Ctrl+,`).
- Search for `Commit Message Prefixes` or navigate to **Extensions** > **Commit Prefixes**.
- Configure the `Commit Message Prefixes` setting with your desired prefixes, labels, emojis, and activation status.

  **Example Configuration:**

  ```json
  [
    {
      "label": "Feature",
      "prefix": "feat: ",
      "emoji": "✨",
      "active": true
    },
    {
      "label": "Bug Fix",
      "prefix": "fix: ",
      "emoji": "🐛",
      "active": true
    },
    {
      "label": "Documentation",
      "prefix": "docs: ",
      "emoji": "📝",
      "active": true
    }
  ]
  ```

### 2. Using the `Fill Commit Message` Command

#### Via Command Palette:

- Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
- Type `Fill Commit Message` and select the command.

#### Via Source Control View:

- Navigate to the **Source Control** view.
- Click on the action icon (📝) in the title bar.

### 3. Selecting a Prefix

- Upon running the command, a Quick Pick menu will appear.
- Choose a prefix from the list. The commit message input box will be updated with the selected prefix.
- If you wish to modify your prefixes, select the **Open prefix settings** option at the bottom of the menu.

### 4. Emoji Settings

- **Include Emojis in Commit Messages**:
  - Enable or disable including emojis in your commit messages via the `Include Emoji In Commit Message` setting.
- **Append Emoji To End**:
  - Control whether the emoji is placed at the beginning or end of your commit message with the `Append Emoji To End` setting.

## Extension Settings

The extension contributes the following settings:

- **Commit Message Prefixes** (`myExtension.commitMessagePrefixes`):
  - An array of prefix configurations, each containing:
    - `label`: A friendly name for the prefix.
    - `prefix`: The text to insert into the commit message.
    - `emoji`: An optional emoji associated with the prefix.
    - `active`: A boolean indicating if the prefix is active.
- **Include Emoji In Commit Message** (`myExtension.includeEmojiInCommitMessage`):
  - When enabled, emojis will be included in the commit messages.
- **Append Emoji To End** (`myExtension.appendEmojiToEnd`):
  - When enabled, emojis will be appended to the end of the commit messages.
- **Label Style** (`myExtension.labelStyle`):
  - Determines how labels are displayed in the Quick Pick menu (`default` or `fancy`).

## Known Limitations

- **Cannot Intercept Commit Button Click**:
  - Due to VSCode API limitations, the extension cannot intercept the commit action initiated by the commit button in the Source Control view to enforce prefix usage.
- **Alternative Solutions**:
  - The extension provides input validation to warn when commit messages lack prefixes.
  - A custom command `Commit with Prefix` is available to streamline the commit process with prefixes.

## Contribution

Contributions are welcome! If you have suggestions for new features or improvements, feel free to open an issue or submit a pull request on the [GitHub repository](#).

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- Thanks to the VSCode community for the excellent documentation and resources.
- Emoji icons provided by [Emoji Cheat Sheet](https://www.webfx.com/tools/emoji-cheat-sheet/).

## Contact

For questions or support, please contact [Finn Middleton](mailto:finnpmiddleton@gmail.com).

---

*Note: Replace placeholders like `#`, `Your Name`, and `your.email@example.com` with actual links and information relevant to your project.*