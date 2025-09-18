
# [1.1.0] - 2025-09-18

### Added

- New feature: Support for running multiple inspection sessions/tabs simultaneously. This allows users to inspect and debug multiple Model Context Protocol servers in parallel, each in its own tab.

# [2.0.0] - 2025-09-18

### Added

- One-click Start Inspector from the sidebar. The extension now launches the Inspector in the integrated terminal using the same command as the manual workflow (`npx @modelcontextprotocol/inspector`). A fallback copyable command is shown in the sidebar if the terminal launch fails.

### Changed

- Bumped major version to 2.0.0 to reflect the integrated workflow change and UX improvements to the sidebar.

# Change Log

All notable changes to the "MCP Vibe Inspector" extension will be documented in this file.

## [1.0.0] - 2025-09-18

### Added

- First stable release: polished sidebar and inspector panel
- Robust loading/error overlay and watchdog
- Accessibility improvements and theme-aware styling

### Changed

- Renamed product to "MCP Vibe Inspector"

### Fixed

- Packaging and webview template path issues for VSIX installs

## [1.0.1] - 2025-09-18

### Added

- Screenshot(s) added for Marketplace preview and README updates

### Changed

- Minor documentation updates and package metadata bump

## [1.0.2] - 2025-09-18

### Changed

- Toolbar button renamed to "Open in Browser" for clarity
- Reload now clears any previously loaded page when URL validation fails and shows an explicit error overlay

### Removed

- Removed Paste-to-iframe button and related script

## [1.0.3] - 2025-09-18

### Changed

- Minor UI polish to header labels and tooltips
- Internal guards to prevent re-entrant loads and stale events

### Fixed

- Reload with invalid URL now clears any previously loaded page and shows an error overlay instead of leaving the old page visible

## [0.1.0] - 2025-09-18

### Added

- Responsive, minimal sidebar with URL input and validation
- Inspector panel toolbar with Reload and Collapse
- Loading/error overlay with timeout watchdog and Retry
- Icon-only copy-to-clipboard buttons with inline SVG

### Changed

- Switched to theme-aware tokens across webviews for a native look
- Improved accessibility (ARIA labels, live regions, focus handling)

### Fixed

- Resolved “There is no data provider registered…” by re-adding webview view and registering provider
- Smoothed validation and error states to avoid blank panels

## [0.0.1] - 2024-09-17

### Added

- Initial release of MCP Vibe Inspector extension
- Integrated webview panel for MCP Vibe Inspector
- Command "Open MCP Vibe Inspector" to launch the debugging interface
- Configurable inspector URL setting
- Embedded iframe displaying MCP Vibe Inspector interface from localhost
- Error handling for connection issues
- Information panel with usage instructions
- URL input field with reload functionality

### Features

- Access MCP Vibe Inspector directly within VS Code
- No need to switch between browser and editor
- Customizable inspector URL for different ports/hosts
- Persistent URL configuration saved to VS Code settings
- User-friendly interface with clear instructions

### Developer Experience

- TypeScript implementation with full type safety
- ESLint configuration for code quality
- Automated build and testing setup
- VS Code extension development environment configured
