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
      // Poll for the URL in the config and send to sidebar when available
      let attempts = 0;
      const maxAttempts = 20;
      const poll = async () => {
        attempts++;
        const config = vscode.workspace.getConfiguration('mcpDebugger');
        let url = (config.get<string>('inspectorUrl') || '').toString();
        if (url && url.startsWith('http')) {
          if (sidebarWebviewPanel) {
            sidebarWebviewPanel.webview.postMessage({
              command: 'setInspectorUrl',
              url,
            });
          }
          vscode.window.showInformationMessage(
            'MCP Inspector started. URL auto-populated.'
          );
          return;
        }
        if (attempts < maxAttempts) {
          setTimeout(poll, 500);
        } else {
          vscode.window.showWarningMessage(
            'Inspector started, but URL was not detected. Please copy it manually from the terminal.'
          );
        }
      };
      poll();
    }
  );
  context.subscriptions.push(startInspectorCmd);

  // Open Inspector command
  const openCmd = vscode.commands.registerCommand(
    'mcp-debugger.openInspector',
    () => MCPInspectorPanel.createNew(context.extensionUri, context)
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
