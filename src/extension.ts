import * as vscode from 'vscode';
import { McpInspectorSidebarProvider } from './mcpInspectorSidebarProvider';
import { MCPInspectorPanel } from './MCPInspectorPanel';

export function activate(context: vscode.ExtensionContext) {
  // Register the sidebar provider
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

  // Minimal test command for debugging terminal creation
  const testTerminalCmd = vscode.commands.registerCommand(
    'mcp-debugger.testTerminal',
    () => {
      const terminal = vscode.window.createTerminal('MCP Test Terminal');
      terminal.show();
      terminal.sendText('echo "Hello from MCP Test Terminal!"');
      terminal.sendText('ls -l');
    }
  );
  context.subscriptions.push(testTerminalCmd);

  // Inspector sidebar registration for URL updates
  let sidebarWebviewPanel: vscode.WebviewView | undefined;
  (globalThis as any).__mcpSidebarWebview = (panel: vscode.WebviewView) => {
    sidebarWebviewPanel = panel;
  };

  // Start Inspector command
  const startInspectorCmd = vscode.commands.registerCommand(
    'mcp-debugger.startInspector',
    async () => {
      const terminal = vscode.window.createTerminal({
        name: 'MCP Inspector',
        hideFromUser: false,
      });
      terminal.show();
      // Use shellIntegration if available
      // @ts-ignore
      if (
        terminal.shellIntegration &&
        typeof terminal.shellIntegration.executeCommand === 'function'
      ) {
        // @ts-ignore
        terminal.shellIntegration.executeCommand(
          'npx @modelcontextprotocol/inspector'
        );
      } else {
        terminal.sendText('npx @modelcontextprotocol/inspector');
      }
    }
  );
  context.subscriptions.push(startInspectorCmd);

  // Open Inspector command
  const openCmd = vscode.commands.registerCommand(
    'mcp-debugger.openInspector',
    async (urlFromSidebar?: string) => {
      // If a URL is provided from the sidebar, use it directly
      if (urlFromSidebar && typeof urlFromSidebar === 'string') {
        const config = vscode.workspace.getConfiguration('mcpDebugger');
        await config.update('inspectorUrl', urlFromSidebar, vscode.ConfigurationTarget.Global);
        MCPInspectorPanel.createNew(context.extensionUri, context);
        return;
      }
      // Fallback: use config as before
      const config = vscode.workspace.getConfiguration('mcpDebugger');
      let url = 'http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=';
      let token = (config.get<string>('proxySessionToken') || '').toString();
      if (token) {
        url = url.replace(/MCP_PROXY_AUTH_TOKEN=([^&]*)/, `MCP_PROXY_AUTH_TOKEN=${token}`);
      }
      let customUrl = (config.get<string>('inspectorUrl') || '').toString();
      if (customUrl && customUrl.startsWith('http')) {
        url = customUrl.replace(/MCP_PROXY_AUTH_TOKEN=([^&]*)/, `MCP_PROXY_AUTH_TOKEN=${token}`);
      }
      await config.update('inspectorUrl', url, vscode.ConfigurationTarget.Global);
      MCPInspectorPanel.createNew(context.extensionUri, context);
    }
  );
  context.subscriptions.push(openCmd);

  // Open Inspector in View command
  const openInViewCmd = vscode.commands.registerCommand(
    'mcp-debugger.openInspectorInView',
    async () => {
      try {
        await vscode.commands.executeCommand(
          'workbench.view.extension.mcpDebugger'
        );
      } catch (err) {
        MCPInspectorPanel.createNew(context.extensionUri, context);
      }
    }
  );
  context.subscriptions.push(openInViewCmd);

  // Register a serializer so the webview panel can be restored across reloads
  if (vscode.window.registerWebviewPanelSerializer) {
    context.subscriptions.push(
      vscode.window.registerWebviewPanelSerializer(MCPInspectorPanel.viewType, {
        async deserializeWebviewPanel(webviewPanel, state) {
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

export function deactivate() {
  // noop
}
