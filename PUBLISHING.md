# Publishing to VS Code Marketplace

This guide covers creating a publisher, packaging with `vsce`, and publishing the extension.

## 1) Install tooling

```bash
npm install -g @vscode/vsce
```

Optionally, also install `ovsx` to publish to Open VSX:

```bash
npm install -g ovsx
```

## 2) Create a publisher

1. Go to https://marketplace.visualstudio.com/manage
2. Create a new Publisher (e.g., `abcSTARK`)
3. Generate a Personal Access Token (PAT) with the Marketplace scope
4. Sign in to `vsce` using the token:

```bash
vsce login <publisherName>
```

## 3) Prepare the package

- Ensure `publisher`, `name`, `displayName`, `version`, and `engines.vscode` are set in `package.json`.
- Add an icon (we use `media/mcp.svg`) and README, CHANGELOG.
- Add a `.vscodeignore` to exclude dev files from the .vsix.

## 4) Package and test locally

```bash
npm run compile
vsce package
```

This creates a `.vsix` file you can install in VS Code (Extensions view → … menu → Install from VSIX...).

## 5) Publish

```bash
vsce publish patch   # or minor / major
```

Alternatively publish a specific version:

```bash
vsce publish 0.1.0
```

For Open VSX (optional):

```bash
ovsx publish mcp-debugger-0.1.0.vsix
```

## 6) CI/CD (optional)

You can automate releases using GitHub Actions. At a minimum:

- Build and run `vsce package`
- Use a repo secret for the Marketplace token
- Upload the .vsix as a release artifact

## Notes

- Update `CHANGELOG.md` for every release.
- Keep `version` in `package.json` in sync with published versions.
- The Marketplace page is generated from `README.md` + `CHANGELOG.md` + package metadata.
