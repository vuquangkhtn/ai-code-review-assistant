# 🤖 AI Code Review Assistant

*Work with any AI provider - no API keys required!*

**🌐 Homepage:** https://vuquangkhtn.github.io/ai-code-review-assistant/

This VS Code extension generates structured prompts for AI code reviews, with two ways to run the review: copy the generated prompt into **any AI provider** of your choice (ChatGPT, Claude, Gemini, Copilot, etc.), or run **CLI Review** through an AI CLI you already have installed (Codex, Claude Code, Copilot CLI, zcode) and get the structured feedback directly in VS Code.

## ✨ Key Features

- 🔄 **No API Keys Required** - Manual copy-paste works with any AI provider; CLI mode uses the CLI's own login
- 🤖 **One-Click CLI Review** - Detected presets for Codex, Claude Code, Copilot CLI and zcode, a provider switcher, and `aiCodeReview.cli.defaultProvider` to pin one up front
- 🎯 **Smart Prompt Generation** - Creates detailed prompts with code context
- 🔍 **Multiple Review Types** - Local changes, commits, or branch comparisons, in both manual and CLI mode
- ⚡ **Live Progress & Fail-Fast** - Per-file progress while the CLI runs; a stuck CLI fails fast with a **Switch CLI Provider** recovery action
- 📊 **Structured Results** - Issues panel with severity indicators and navigation, optional confidence and evidence on each finding, and policy-based `Blocking` flags (`aiCodeReview.policy.blockOn`)

## 🎬 Demo

![AI Code Review Assistant Demo](docs/sample.gif)

*See the extension in action: generating prompts, reviewing code, and displaying structured feedback*

## 🛠️ Installation

1. Install the extension from the VS Code marketplace
2. That's it! Manual copy-paste mode needs no API keys or additional setup
3. Optional: for one-click **CLI Review**, have one provider CLI (`codex`, `claude`, `copilot`, or `zcode`) installed and authenticated on your PATH

## 🚀 Simple Usage

### Manual mode: 3-step process
1. **Generate Prompt**: Use `Cmd+K Cmd+G` or run the "Manual Review" command
2. **Copy to AI**: Use **Paste to AI Chat…** on the completion alert for paste instructions, and paste the prompt into your favorite AI (ChatGPT, Claude, etc.)
3. **View Results**: Save the AI response as JSON and see organized feedback in VS Code

### CLI mode: one-click review
1. Run **AI Code Review: CLI Review** in a trusted workspace
2. With no custom command configured, the extension detects Codex, Claude Code, Copilot CLI and zcode on PATH; one detected provider runs silently, or you pick once and the choice persists across sessions
3. Watch live per-file progress on the review tree row; clicking the running row (or **Cancel CLI Review**) asks "Stop the running review?" before it aborts
4. If the CLI stalls, the run fails fast instead of hanging; when another provider is detected, the failure message names the alternatives and offers a **Switch CLI Provider** action to recover immediately

To fix the provider up front, set `aiCodeReview.cli.defaultProvider` (`auto` keeps the detect-once behavior), or run **AI Code Review: Select CLI Provider** to switch anytime. A custom command (`aiCodeReview.cli.customCommand`) always overrides the presets. The provider CLIs must already be installed and authenticated; on Windows, detection covers native executables and `.cmd`/`.bat` wrappers. Branch comparison works here too: select **Compare Branches** and the CLI receives the branch-diff prompt.

### Quick Commands
- **`Cmd+K Cmd+G`** - Manual Review (most common)
- **`AI Code Review: CLI Review`** - Run the review through your installed CLI
- **`AI Code Review: Select CLI Provider`** - Switch CLI providers from the palette
- **`AI Code Review: Local Changes`** - Review uncommitted changes
- **`AI Code Review: Compare Branches`** - Compare between branches

📖 **For detailed usage instructions and all features, see our [Complete Features Guide](FEATURES.md)**

### How It Works
1. **Choose what to review**: Local changes, specific commits, or branch comparisons
2. **Run the review**: copy the generated prompt into ChatGPT, Claude, Gemini, or any AI tool, or let CLI mode run it through your installed provider
3. **See organized results**: Save the AI response as JSON and get structured feedback in VS Code

## 🤖 Works with Any AI Provider

This extension is designed to work with **any AI provider** you prefer:

### Popular AI Tools
- **ChatGPT** (OpenAI)
- **Claude** (Anthropic) 
- **Gemini** (Google)
- **GitHub Copilot Chat**
- **Cursor AI**
- **Amazon Q**
- **Any other AI that accepts text prompts**

### Why No API Keys?
- **Privacy**: Manual copy-paste mode makes no outbound AI calls. CLI mode sends code through the CLI’s own backend only when you explicitly run **CLI Review**
- **Flexibility**: Use any AI provider, switch anytime
- **Cost Control**: Use your existing AI subscriptions
- **Reliability**: Manual copy-paste mode has no extension-managed API limits; CLI mode uses the CLI’s account and service limits

## 🎯 Supported Languages

Works with all major programming languages:
- JavaScript, TypeScript, Python, Java, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, and more

## 🚢 Releases

Releases are automated by `semantic-release` on `main`:

- Bare conventional-commit titles trigger a release — `feat: …` → minor, `fix: …` → patch, `BREAKING CHANGE` → major.
- Emoji-prefixed squash titles (e.g. `✨ [feat] …`) intentionally do not trigger a release; land a bare `feat:`/`fix:` commit on `main` to ship pending changes.
- The Complete CI/CD Pipeline's manual dispatch offers only *Skip marketplace publishing* — it cannot force a release or override the bump type.

See [FEATURES.md → Release automation](FEATURES.md#release-automation) for details.

## 🤝 Contributing

We welcome contributions! See our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 📖 Documentation

- **[Complete Features Guide](FEATURES.md)** - Comprehensive documentation of all features and usage instructions
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to the project

## 📞 Support

Need help? Check out our [GitHub Issues](https://github.com/vuquangkhtn/ai-code-review-assistant/issues) or [Discussions](https://github.com/vuquangkhtn/ai-code-review-assistant/discussions).

## 🌟 Love This Extension?

If this extension has made your code review process easier and more efficient, we'd be thrilled to hear from you! Your feedback and support mean the world to us and help us continue improving.

### Ways to Show Your Support:
- ⭐ **Star this repository** - It helps others discover this tool
- 💬 **Leave a review** on the VS Code Marketplace - Share your experience
- 🐛 **Report issues or suggest features** - Help us make it even better
- 📢 **Share with your team** - Spread the word about AI-powered code reviews
- 🤝 **Contribute** - Check out our [Contributing Guidelines](CONTRIBUTING.md)

Every star, review, and piece of feedback motivates us to keep building awesome tools for the developer community. Thank you for being part of our journey! 🚀

---

*Built with ❤️ for developers who want AI-powered code reviews without the complexity*
