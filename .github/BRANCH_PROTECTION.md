# Branch Protection Configuration
# This file documents the recommended branch protection settings for the main branch
# These settings should be applied in the GitHub repository settings under Branches

## Main Branch Protection Rules

### Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- Required status checks:
  - `test (18.x)` - CI test with Node.js 18.x
  - `test (20.x)` - CI test with Node.js 20.x
  - `package` - Extension packaging validation

### Pull Request Requirements
- [x] Require a pull request before merging
- [x] Require approvals: **1 approval required**
- [x] Dismiss stale reviews when new commits are pushed
- [x] Require review from code owners (defined in CODEOWNERS)
- [x] Restrict pushes that create pull requests

### Additional Restrictions
- [x] Restrict pushes to matching branches
  - Only allow repository administrators and the following people or teams to push:
    - @abcSTARK (repository owner)
- [x] Allow force pushes: **Disabled**
- [x] Allow deletions: **Disabled**

### Include Administrators
- [ ] Include administrators (recommended to keep unchecked for security)

## How to Apply These Settings

1. Go to your repository on GitHub
2. Navigate to Settings > Branches
3. Click "Add rule" or edit existing rule for main branch
4. Configure the settings as described above
5. Save the rule

## Enforcement
These rules ensure that:
- All code changes go through pull requests
- CI tests must pass before merging
- Code owner (@abcSTARK) must approve all changes
- No direct pushes to main branch are allowed
- History cannot be rewritten on main branch