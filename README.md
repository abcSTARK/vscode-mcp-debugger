# MCP Debugger

A Visual Studio Code extension for debugging MCP (Model Context Protocol) servers. This extension provides an integrated webview panel that displays the MCP Inspector interface, making it easy to test and debug your local MCP servers without leaving your development environment.

## Features

- **Integrated MCP Inspector**: Open the MCP Inspector directly within VS Code
- **Configurable URL**: Set custom URL for your MCP Inspector instance
- **Easy Access**: Access via Command Palette with "Open MCP Inspector"
- **Embedded Interface**: Full inspector functionality within a VS Code webview panel

## Usage

### Prerequisites

1. Have a local MCP server running
2. Install and run the MCP Inspector:
   ```bash
   npx @modelcontextprotocol/inspector
   ```

### Opening the Inspector

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Search for and run "Open MCP Inspector"
3. A new panel will open showing the MCP Inspector interface
4. If your inspector runs on a different port, update the URL in the panel header

### Configuration

You can configure the default inspector URL in VS Code settings:

1. Open Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "MCP Debugger"
3. Set "Inspector Url" to your preferred URL (default: `http://localhost:3000`)

Alternatively, you can update `settings.json`:

```json
{
  "mcpDebugger.inspectorUrl": "http://localhost:3000"
}
```

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. The MCP Inspector is a debugging tool that helps you test and validate your MCP server implementations.

## Development

To work on this extension:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Open in VS Code and press `F5` to launch a new Extension Development Host
4. Test the extension in the new VS Code window

### Building

```bash
npm run compile
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm test
```

## Extension Settings

This extension contributes the following settings:

* `mcpDebugger.inspectorUrl`: URL where the MCP Inspector is running (default: `http://localhost:3000`)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is released under the MIT License.
