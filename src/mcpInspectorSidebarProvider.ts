import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class McpInspectorSidebarProvider implements vscode.WebviewViewProvider {
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log('McpInspectorSidebarProvider.resolveWebviewView called');

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(__dirname, '../media'))],
    };
    const config = vscode.workspace.getConfiguration('mcpDebugger');
    const inspectorUrl = (config.get<string>('inspectorUrl') || '').toString();
    webviewView.webview.html = this._getSidebarHtml(
      webviewView.webview,
      inspectorUrl
    );
    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        try {
          switch (message?.command) {
            case 'openInspector': {
              const url = message.url;
              if (url && typeof url === 'string') {
                await vscode.workspace
                  .getConfiguration('mcpDebugger')
                  .update(
                    'inspectorUrl',
                    url,
                    vscode.ConfigurationTarget.Global
                  );
              }
              vscode.commands.executeCommand('mcp-debugger.openInspector');
              break;
            }
            case 'connectMcp': {
              const url = message.url;
              const transport = message.transport;
              if (url && typeof url === 'string') {
                await vscode.workspace
                  .getConfiguration('mcpDebugger')
                  .update('serverUrl', url, vscode.ConfigurationTarget.Global);
              }
              if (transport && typeof transport === 'string') {
                await vscode.workspace
                  .getConfiguration('mcpDebugger')
                  .update(
                    'serverTransport',
                    transport,
                    vscode.ConfigurationTarget.Global
                  );
              }
              // optional: notify any command that handles connection
              vscode.commands.executeCommand('mcp-debugger.connectMcp');
              break;
            }
            default:
              console.warn('Unknown message from sidebar webview', message);
          }
        } catch (e) {
          console.error('Error handling message from sidebar webview', e);
        }
      },
      undefined,
      []
    );
  }

  private _getSidebarHtml(
    webview: vscode.Webview,
    inspectorUrl: string
  ): string {
    // Read the sidebar HTML template from the media folder
    const htmlPath = path.join(__dirname, '../media/sidebarWebview.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    // Replace the placeholder with the inspectorUrl (escaped)
    const safeUrl = inspectorUrl ? inspectorUrl.replace(/"/g, '&quot;') : '';
    html = html.replace(/\$\{inspectorUrl\}/g, safeUrl);
    return html;
  }
}
