# Issue #13 host verification

The Builder sandbox cannot launch VS Code. The installed app exited with `SIGABRT` before Mocha started. This is a launch failure, not a passing host test. The cached 1.146.0 app was also missing its executable (`ENOENT`).

Run from this issue branch in an owner terminal that can launch VS Code:

```sh
npm ci --silent
npm run test:cli
npm run compile
CLI_REVIEW_TEST=1 CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' npm test
```

The host suite includes `cliComparison.test.ts`. It accepts the real two-provider picker, runs both fixture CLIs, verifies identical prompts and two saved JSON files, and checks shared/unique rows plus confidence/evidence through the real VS Code TreeItem API. Existing CLI lifecycle suites run too.

Before returning this card to QA:

- Run the command above and fix any host failures.
- Commit the host transcript in this directory, identifying the tested code commit and VS Code version.
- Capture the Provider Comparison view with shared and unique fixture findings. Commit the screenshot alongside the transcript.

Builder checks: `npm run test:cli`, `npm run lint`, and `npm run compile`. Host evidence remains pending; acceptance criterion 3 is incomplete until the owner-session result is committed.
