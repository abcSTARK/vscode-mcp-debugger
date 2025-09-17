// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mcp-debugger" is now active!');

	// Register the command to open MCP Inspector
	const disposable = vscode.commands.registerCommand('mcp-debugger.openInspector', () => {
		MCPInspectorPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(disposable);
}

/**
 * Manages MCP Inspector webview panels
 */
class MCPInspectorPanel {
	/**
	 * Track the currently active panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: MCPInspectorPanel | undefined;

	public static readonly viewType = 'mcpInspector';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (MCPInspectorPanel.currentPanel) {
			MCPInspectorPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			MCPInspectorPanel.viewType,
			'MCP Inspector',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
			}
		);

		MCPInspectorPanel.currentPanel = new MCPInspectorPanel(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		MCPInspectorPanel.currentPanel = new MCPInspectorPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
					case 'updateUrl':
						// Update the configuration with the new URL
						const config = vscode.workspace.getConfiguration('mcpDebugger');
						config.update('inspectorUrl', message.url, vscode.ConfigurationTarget.Global);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		MCPInspectorPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;

		this._panel.title = 'MCP Inspector';
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the configuration for the inspector URL
		const config = vscode.workspace.getConfiguration('mcpDebugger');
		const inspectorUrl = config.get('inspectorUrl', 'http://localhost:3000');

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Inspector</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100vh;
            overflow: hidden;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        .header {
            padding: 10px;
            background-color: var(--vscode-titleBar-activeBackground);
            color: var(--vscode-titleBar-activeForeground);
            border-bottom: 1px solid var(--vscode-widget-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .url-input {
            padding: 5px 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            margin: 0 10px;
            flex: 1;
            max-width: 400px;
        }
        
        .reload-btn {
            padding: 5px 15px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 3px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            margin-left: 10px;
        }
        
        .reload-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .inspector-frame {
            flex: 1;
            border: none;
            width: 100%;
            background-color: white;
        }
        
        .error-message {
            padding: 20px;
            text-align: center;
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            margin: 20px;
            border-radius: 3px;
        }
        
        .info-message {
            padding: 20px;
            margin: 20px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            border-radius: 3px;
        }
        
        .info-message h3 {
            margin-top: 0;
            color: var(--vscode-textPreformat-foreground);
        }
        
        .info-message code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <label for="urlInput">MCP Inspector URL:</label>
            <input type="text" id="urlInput" class="url-input" value="${inspectorUrl}" placeholder="http://localhost:3000">
            <button class="reload-btn" onclick="reloadInspector()">Reload</button>
        </div>
        
        <div id="content">
            <div class="info-message">
                <h3>Welcome to MCP Inspector</h3>
                <p>This panel displays the MCP (Model Context Protocol) Inspector interface for debugging your local MCP servers.</p>
                <p><strong>To get started:</strong></p>
                <ol>
                    <li>Run your MCP server locally</li>
                    <li>Start the MCP inspector with: <code>npx @modelcontextprotocol/inspector</code></li>
                    <li>The inspector typically runs on <code>http://localhost:3000</code></li>
                    <li>Update the URL above if your inspector runs on a different port</li>
                    <li>Click "Reload" to load the inspector interface</li>
                </ol>
                <p>The inspector allows you to test and debug your MCP server by examining available tools, resources, and prompts.</p>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function reloadInspector() {
            const urlInput = document.getElementById('urlInput');
            const url = urlInput.value.trim();
            
            if (!url) {
                showError('Please enter a valid URL');
                return;
            }
            
            loadInspector(url);
        }
        
        function loadInspector(url) {
            const contentDiv = document.getElementById('content');
            
            // Create iframe for the inspector
            const iframe = document.createElement('iframe');
            iframe.className = 'inspector-frame';
            iframe.src = url;
            iframe.onload = function() {
                console.log('MCP Inspector loaded successfully');
            };
            iframe.onerror = function() {
                showError('Failed to load MCP Inspector. Please ensure the inspector is running and accessible.');
            };
            
            contentDiv.innerHTML = '';
            contentDiv.appendChild(iframe);
        }
        
        function showError(message) {
            const contentDiv = document.getElementById('content');
            contentDiv.innerHTML = \`
                <div class="error-message">
                    <h3>Error</h3>
                    <p>\${message}</p>
                    <p>Make sure you have started the MCP inspector with:</p>
                    <p><code>npx @modelcontextprotocol/inspector</code></p>
                </div>
            \`;
        }
        
        // Save URL changes to VSCode settings
        document.getElementById('urlInput').addEventListener('change', function(e) {
            vscode.postMessage({
                command: 'updateUrl',
                url: e.target.value
            });
        });
        
        // Load inspector automatically if URL looks valid
        const urlInput = document.getElementById('urlInput');
        if (urlInput.value && urlInput.value !== 'http://localhost:3000') {
            loadInspector(urlInput.value);
        }
    </script>
</body>
</html>`;
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
