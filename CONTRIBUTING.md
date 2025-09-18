Contributing to MCP Vibe Inspector

Thanks for your interest in contributing! We welcome issues and pull requests to improve the extension.

Getting started

- Fork the repo and clone locally
- Run npm install
- Press F5 in VS Code to launch the Extension Development Host

Development workflow

- Branch from main (e.g., feature/your-change)
- Keep PRs small and focused; include before/after notes and screenshots for UI changes
- Run npm run compile and npm run lint before pushing
- Add/update tests when changing public behavior
- All PRs require approval from a code owner (@abcSTARK) before merging
- CI tests must pass before merging (automated via GitHub Actions)
- Direct pushes to main branch are not allowed

Coding standards

- TypeScript, strict types when practical
- ESLint must pass
- Prefer VS Code theme variables for UI styling in webviews

Commit messages

- Use clear, descriptive messages (e.g., feat:, fix:, docs:, refactor:)

Release process

- Maintainers cut releases via vsce publish after updating CHANGELOG.md

Code of Conduct

- Please follow the included CODE_OF_CONDUCT.md
