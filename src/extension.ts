import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { join } from 'path';
import { McpInspectorSidebarProvider } from './mcpInspectorSidebarProvider';

/**
 * Activate the extension.
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('MCP Debugger extension activated');

  // Register the new sidebar provider
  try {
    const provider = new McpInspectorSidebarProvider();
    const registration = vscode.window.registerWebviewViewProvider(
      'mcpInspectorSidebarView',
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    );
    context.subscriptions.push(registration);
    console.log(
      'Sidebar provider registered successfully for view: mcpInspectorSidebarView'
    );
  } catch (error) {
    console.error('Failed to register sidebar provider:', error);
    vscode.window.showErrorMessage(
      'Failed to register MCP sidebar provider: ' + error
    );
  }

  // Command to open the inspector in a standalone webview panel
  const openCmd = vscode.commands.registerCommand(
    'mcp-debugger.openInspector',
    () => MCPInspectorPanel.createOrShow(context.extensionUri, context)
  );

  // Command to reveal the activity-bar view
  const openInViewCmd = vscode.commands.registerCommand(
    'mcp-debugger.openInspectorInView',
    async () => {
      // Try to open the activity bar container for our extension
      try {
        await vscode.commands.executeCommand(
          'workbench.view.extension.mcpDebugger'
        );
      } catch (err) {
        // Fallback: show the panel instead
        MCPInspectorPanel.createOrShow(context.extensionUri, context);
      }
    }
  );

  context.subscriptions.push(openCmd, openInViewCmd);

  // Register a serializer so the webview panel can be restored across reloads
  if (vscode.window.registerWebviewPanelSerializer) {
    context.subscriptions.push(
      vscode.window.registerWebviewPanelSerializer(MCPInspectorPanel.viewType, {
        async deserializeWebviewPanel(webviewPanel, state) {
          // Recreate our panel and forward the saved webview state so the
          // webview can restore things like the last loaded URL.
          MCPInspectorPanel.revive(
            webviewPanel,
            context.extensionUri,
            context,
            state as any
          );
        },
      })
    );
  }
}

/**
 * Deactivate the extension.
 */
export function deactivate() {
  // noop
}

/**
 * Manages the MCP Inspector webview panel.
 * Single-panel (singleton) implementation to keep things simple.
 */
class MCPInspectorPanel {
  public static currentPanel: MCPInspectorPanel | undefined;
  public static readonly viewType = 'mcpInspector';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];
  private context: vscode.ExtensionContext;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.context = context;

    // Set an initial HTML content
    this.update();

    // Handle disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Update when view becomes visible
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.visible) {
          this.update();
        }
      },
      null,
      this.disposables
    );

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => this.onMessage(message),
      null,
      this.disposables
    );
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (MCPInspectorPanel.currentPanel) {
      MCPInspectorPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      MCPInspectorPanel.viewType,
      'MCP Inspector',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        // Preserve the webview state when it becomes hidden. This prevents the
        // iframe/content from being destroyed when the user switches tabs.
        retainContextWhenHidden: true,
        // Allow loading local resources from extension
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src'),
          vscode.Uri.joinPath(extensionUri, 'media'),
        ],
      }
    );

    MCPInspectorPanel.currentPanel = new MCPInspectorPanel(
      panel,
      extensionUri,
      context
    );
  }

  /**
   * Revive an existing webview panel (used by the serializer).
   */
  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    state?: any
  ) {
    MCPInspectorPanel.currentPanel = new MCPInspectorPanel(
      panel,
      extensionUri,
      context
    );

    // If there is saved webview state (set via acquireVsCodeApi().setState),
    // forward it to the restored webview so it can rehydrate UI (e.g. lastUrl).
    if (state) {
      try {
        MCPInspectorPanel.currentPanel.panel.webview.postMessage({
          command: 'restoreState',
          state,
          restored: true,
          restoredAt: Date.now(),
        });
      } catch (e) {
        // ignore
      }
    }
  }

  public dispose() {
    MCPInspectorPanel.currentPanel = undefined;

    // dispose panel
    this.panel.dispose();

    // dispose subscriptions
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }

  /**
   * Read the HTML template and replace placeholders.
   */
  private getWebviewContent(): string {
    const config = vscode.workspace.getConfiguration('mcpDebugger');
    const inspectorUrl = config.get<string>(
      'inspectorUrl',
      'http://localhost:3000'
    );

    // Read the HTML file shipped with the extension
    const htmlPath = join(
      this.context.extensionPath,
      'src',
      'inspectorWebview.html'
    );
    let html = '';
    try {
      html = readFileSync(htmlPath, { encoding: 'utf8' });
    } catch (err) {
      return `<!doctype html><html><body><h2>Failed to load webview template</h2><pre>${err}</pre></body></html>`;
    }

    // Replace placeholders
    html = html.replace(/{{INSPECTOR_URL}}/g, inspectorUrl);

    return html;
  }

  private update() {
    this.panel.title = 'MCP Inspector';
    this.panel.webview.html = this.getWebviewContent();
  }

  public onMessage(message: any) {
    switch (message?.command) {
      case 'updateUrl': {
        const url = message.url;
        if (typeof url === 'string') {
          if (!MCPInspectorPanel.isValidUrl(url)) {
            // send back an error message to the webview
            this.panel.webview.postMessage({
              command: 'urlError',
              text: 'Invalid URL. Must start with http:// or https://',
            });
            return;
          }
          vscode.workspace
            .getConfiguration('mcpDebugger')
            .update('inspectorUrl', url, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage('MCP Inspector URL saved.');
          return;
        }
        break;
      }
      case 'alert': {
        if (message.text) {
          vscode.window.showErrorMessage(message.text);
        }
        break;
      }
      default:
        console.warn('Unknown message from webview', message);
    }
  }

  private static isValidUrl(url: string) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (err) {
      return false;
    }
  }
}
