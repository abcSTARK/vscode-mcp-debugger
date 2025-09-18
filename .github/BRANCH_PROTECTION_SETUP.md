# Branch Protection and CI/CD Setup

This repository includes comprehensive branch protection rules and automated CI/CD workflows to ensure code quality and security.

## Branch Protection Rules

The `main` branch is protected with the following rules:

### Required Approvals
- **1 approval required** from code owners before any PR can be merged
- Code owners are defined in `.github/CODEOWNERS`
- Stale reviews are automatically dismissed when new commits are pushed

### Required Status Checks
All PRs must pass the following automated checks:
- **Linting**: ESLint must pass with no errors
- **Compilation**: TypeScript compilation must succeed
- **Testing**: All tests must pass (Node.js 18.x and 20.x)
- **Packaging**: Extension packaging validation

### Restrictions
- **No direct pushes** to main branch allowed
- **No force pushes** allowed
- **No branch deletion** allowed
- All changes must go through pull requests

## Automated CI/CD

### Continuous Integration
The CI workflow (`.github/workflows/ci.yml`) automatically:
1. Runs on every push to main and all pull requests
2. Tests against multiple Node.js versions (18.x, 20.x)
3. Validates code quality with ESLint
4. Compiles TypeScript code
5. Runs test suite
6. Packages the VS Code extension

### Pull Request Workflow
1. Create a feature branch from main
2. Make your changes following the coding standards
3. Run `npm run compile && npm run lint` locally
4. Push your branch and open a pull request
5. Fill out the PR template with details about your changes
6. Wait for CI checks to pass
7. Request review from code owners
8. Address any feedback and get approval
9. Merge when all requirements are met

## Repository Settings

To fully enable branch protection, the following settings should be configured in GitHub repository settings:

### Branch Protection Rule for `main`
1. Navigate to Settings > Branches
2. Add rule for `main` branch with these settings:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 required)
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require review from code owners
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Restrict pushes to matching branches
   - ❌ Allow force pushes
   - ❌ Allow deletions

### Required Status Checks
Add these status checks to the branch protection rule:
- `test (18.x)`
- `test (20.x)` 
- `package`

## Security Features

- **CODEOWNERS file** ensures critical files always require owner approval
- **Pull request templates** guide contributors to provide necessary information
- **Issue templates** help users report bugs and request features consistently
- **Automated security scanning** via GitHub's dependency analysis

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contributing guidelines that align with these protection rules.