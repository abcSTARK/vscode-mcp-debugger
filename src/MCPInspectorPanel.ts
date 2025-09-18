import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { join } from 'path';

export class MCPInspectorPanel {
  public static readonly viewType = 'mcpInspector';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.context = context;
    this.update();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.visible) {
          this.update();
        }
      },
      null,
      this.disposables
    );
    this.panel.webview.onDidReceiveMessage(
      (message) => this.onMessage(message),
      null,
      this.disposables
    );
  }

  public static createNew(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    const panel = vscode.window.createWebviewPanel(
      MCPInspectorPanel.viewType,
      'MCP Vibe Inspector',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src'),
          vscode.Uri.joinPath(extensionUri, 'media'),
        ],
      }
    );
    new MCPInspectorPanel(panel, extensionUri, context);
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    state?: any
  ) {
    const instance = new MCPInspectorPanel(panel, extensionUri, context);
    if (state) {
      try {
        panel.webview.postMessage({
          command: 'restoreState',
          state,
          restored: true,
          restoredAt: Date.now(),
        });
      } catch (e) {
        // ignore
      }
    }
    return instance;
  }

  public dispose() {
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }

  private getWebviewContent(): string {
    const config = vscode.workspace.getConfiguration('mcpDebugger');
    const inspectorUrl = config.get<string>(
      'inspectorUrl',
      'http://localhost:3000'
    );
    const htmlPath = join(
      this.context.extensionPath,
      'media',
      'inspectorWebview.html'
    );
    let html = '';
    try {
      html = readFileSync(htmlPath, { encoding: 'utf8' });
    } catch (err) {
      return `<!doctype html><html><body><h2>Failed to load webview template</h2><pre>${err}</pre></body></html>`;
    }
    html = html.replace(/{{INSPECTOR_URL}}/g, inspectorUrl);
    return html;
  }

  private update() {
    this.panel.title = 'MCP Vibe Inspector';
    this.panel.webview.html = this.getWebviewContent();
  }

  public onMessage(message: any) {
    switch (message?.command) {
      case 'updateUrl': {
        const url = message.url;
        if (typeof url === 'string') {
          if (!MCPInspectorPanel.isValidUrl(url)) {
            this.panel.webview.postMessage({
              command: 'urlError',
              text: 'Invalid URL. Must start with http:// or https://',
            });
            return;
          }
          vscode.workspace
            .getConfiguration('mcpDebugger')
            .update('inspectorUrl', url, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage('MCP Vibe Inspector URL saved.');
          return;
        }
        break;
      }
      case 'openExternal': {
        const url = message.url;
        if (typeof url === 'string' && MCPInspectorPanel.isValidUrl(url)) {
          try {
            vscode.env.openExternal(vscode.Uri.parse(url));
          } catch (e) {
            vscode.window.showErrorMessage('Failed to open in browser: ' + e);
          }
        } else {
          vscode.window.showErrorMessage('Cannot open: invalid URL.');
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
        if (
          message?.type === 'openExternal' &&
          typeof message?.url === 'string'
        ) {
          const url = message.url;
          if (MCPInspectorPanel.isValidUrl(url)) {
            vscode.env.openExternal(vscode.Uri.parse(url));
          } else {
            this.panel.webview.postMessage({
              command: 'urlError',
              text: 'Invalid URL for openExternal',
            });
          }
          return;
        }
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
