import * as vscode from 'vscode';

export class McpInspectorSidebarProvider implements vscode.WebviewViewProvider {
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log('McpInspectorSidebarProvider.resolveWebviewView called');

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };
    const config = vscode.workspace.getConfiguration('mcpDebugger');
    const inspectorUrl = (config.get<string>('inspectorUrl') || '').toString();
    webviewView.webview.html = this._getRenderer(inspectorUrl);
    console.log('Webview HTML set successfully');
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

  private _getRenderer(inspectorUrl: string) {
    const safeUrl = inspectorUrl ? inspectorUrl.replace(/"/g, '&quot;') : '';
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>MCP Vibe Inspector Sidebar</title>
                <style>
                  :root { --padding: 12px; --gap: 10px; }
                  body { color: var(--vscode-editor-foreground); background: transparent; font-family: var(--vscode-font-family); margin:0; }
                  .container { padding: var(--padding); box-sizing:border-box; }
                  .section { margin-bottom: var(--gap); padding-bottom: var(--gap); border-bottom: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.06)); }
                  .title { display:flex; align-items:center; gap:8px; font-weight:600; font-size:13px; margin-bottom:6px }
                  .title .icon { width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center }
                  .lead { font-size:12px; color:var(--vscode-descriptionForeground); margin:0 0 8px 0 }
                  .steps { font-size:12px; margin:0; padding-left:18px; }
                  .steps li { margin:6px 0 }
                  .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Segoe UI Mono', monospace; font-size:12px; color:var(--vscode-editor-foreground); background:transparent; padding:0; border-radius:0; display:inline }
                  /* nested <code> inside .code: accent color and better wrapping for long tokens */
                  .code code { font-family: inherit; font-size: inherit; color: var(--vscode-textLink-foreground); background: transparent; padding: 0; border-radius: 0; overflow-wrap: anywhere; word-break: break-word; }
                  .copy-btn { margin-left:6px; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; font-size:14px; border-radius:4px; border:none; background:transparent; color:var(--vscode-descriptionForeground); cursor:pointer; opacity:0.55; transition: opacity .15s ease, background-color .15s ease, color .15s ease }
                  .code:hover + .copy-btn, .copy-btn:hover, .copy-btn:focus { opacity:1; background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-foreground); }
                  .input-row { display:flex; gap:8px; margin-top:8px }
                  input.url-input { flex:1; padding:8px; border-radius:4px; border:1px solid var(--vscode-input-border); background:var(--vscode-input-background); color:var(--vscode-input-foreground); font-size:13px }
                  input.url-input.invalid { border-color: var(--vscode-inputValidation-errorBorder); }
                  button.primary { padding:8px 10px; border-radius:4px; border:none; background:var(--vscode-button-background); color:var(--vscode-button-foreground); cursor:pointer; font-weight:600 }
                  .tip { font-size:11px; color:var(--vscode-descriptionForeground); margin-top:8px }
                  @media (max-width:360px) {
                    .title { font-size:12px }
                    input.url-input { font-size:12px }
                    .copy-btn { width:20px; height:20px; font-size:12px }
                  }
                </style>
            </head>
            <body>
                <div class="container">
                  <div class="section">
                    <div class="title"><span class="icon">🚀</span> <div>MCP Vibe Inspector</div></div>
                    <p class="lead">Quickly open the MCP Vibe Inspector (use the tokened URL from your terminal).</p>
                  </div>

                  <div class="section">
                    <div class="title"><span class="icon">🪪</span> <div>Steps</div></div>
                    <ol class="steps">
                      <li>Run your MCP server locally.</li>
                      <li>Start the inspector: <span class="code" data-code="npx @modelcontextprotocol/inspector"><code>npx @modelcontextprotocol/inspector</code></span></li>
                      <li>Copy the full URL printed in terminal e.g. <span class="code" data-code="http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=TokenData"><code>http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=TokenData</code></span>.</li>
                      <li>Paste the URL below and click <strong>Open Inspector</strong>.</li>
                    </ol>
                  </div>

                  <div class="section">
                    <div class="title"><span class="icon">🔗</span> <div>Inspector URL</div></div>
                    <div class="input-row">
                      <input id="inspectorUrl" class="url-input" type="text" placeholder="Paste MCP Vibe Inspector URL here (with token)" value="${safeUrl}" />
                    </div>
                    <div style="margin-top:8px; display:flex; gap:8px;"><button id="openBtn" class="primary" title="Open Inspector (Enter)">Open Inspector</button></div>
                    <div class="tip">Tip: URL looks like <code>http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=…</code></div>
                  </div>

                  <!-- MCP Server configuration (transport + server URL) -->
                  <div class="section">
                    <div class="title"><span class="icon">🧭</span> <div>MCP Server</div></div>
                    <p class="lead">Provide your MCP server transport and URL to connect from the inspector.</p>
                    <div style="margin-top:8px">
                      <ol style="padding-left:18px; margin:0; font-size:13px; line-height:1.4">
                        <li><strong>Select transport</strong> — choose one in the Inspector panel: <ul style="margin:6px 0 0 18px"><li><span class="code" data-code="stdio"><code>stdio</code></span></li><li><span class="code" data-code="streamable-http"><code>streamable-http</code></span></li><li><span class="code" data-code="sse"><code>sse</code></span></li></ul></li>
                        <li style="margin-top:8px"><strong>Provide URL</strong> — paste your MCP server URL inside the Inspector (example shown): <div style="margin-top:6px"><span class="code" data-code="https://abcstark-server.fastmcp.app/mcp"><code>https://abcstark-server.fastmcp.app/mcp</code></span></div></li>
                        <li style="margin-top:8px"><strong>Click Connect</strong> — the Inspector will use the chosen transport and URL to connect.</li>
                      </ol>
                    </div>
                  </div>
                </div>
        <script>
                    const vscode = acquireVsCodeApi();
                    const openBtn = document.getElementById('openBtn');
                    const urlInput = document.getElementById('inspectorUrl');

                    function showMessage(text, type = 'info') {
                      let el = document.getElementById('msg');
                      if (!el) {
                        el = document.createElement('div');
                        el.id = 'msg';
                        el.style.marginTop = '8px';
                        el.style.fontSize = '12px';
                        el.style.padding = '6px 8px';
                        el.style.borderRadius = '4px';
                        el.style.transition = 'opacity 0.25s ease';
                        el.style.opacity = '1';
                        el.setAttribute('role', 'status');
                        el.setAttribute('aria-live', 'polite');
                        urlInput.parentElement.appendChild(el);
                      }
                      el.textContent = text;
                      el.style.color = type === 'error' ? 'var(--vscode-errorForeground)' : 'var(--vscode-foreground)';
                      if (type === 'error') {
                        el.setAttribute('role', 'alert');
                        el.setAttribute('aria-live', 'assertive');
                      } else {
                        el.setAttribute('role', 'status');
                        el.setAttribute('aria-live', 'polite');
                      }
                      // auto-hide after 2s for info messages
                      if (type === 'info') {
                        setTimeout(() => { if (el) el.style.opacity = '0'; }, 2000);
                        setTimeout(() => { if (el && el.parentElement) el.parentElement.removeChild(el); }, 2600);
                      }
                    }

                    function validateInspectorUrl(v) {
                      if (!v) return { ok: false, message: 'Please paste the inspector URL.' };
                      try {
                        const parsed = new URL(v);
                        // ensure protocol is http(s)
                        if (!/^https?:$/.test(parsed.protocol)) {
                          return { ok: false, message: 'URL must start with http:// or https://.' };
                        }
                        // check for token param
                        if (!parsed.searchParams.has('MCP_PROXY_AUTH_TOKEN')) {
                          return { ok: false, message: 'URL is missing MCP_PROXY_AUTH_TOKEN query parameter.' };
                        }
                        return { ok: true };
                      } catch (e) {
                        return { ok: false, message: 'Invalid URL format.' };
                      }
                    }

                    openBtn.addEventListener('click', () => {
                      const url = urlInput.value.trim();
                      const res = validateInspectorUrl(url);
                      if (!res.ok) {
                        urlInput.classList.add('invalid');
                        urlInput.setAttribute('aria-invalid', 'true');
                        urlInput.setAttribute('aria-describedby', 'msg');
                        showMessage(res.message, 'error');
                        return;
                      }
                      urlInput.classList.remove('invalid');
                      urlInput.removeAttribute('aria-invalid');
                      urlInput.removeAttribute('aria-describedby');
                      // send to extension
                      vscode.postMessage({ command: 'openInspector', url });
                      // show ephemeral confirmation
                      showMessage('Saved and opened', 'info');
                    });

                    // allow Enter key to trigger open
                    urlInput.addEventListener('keydown', (ev) => {
                      if (ev.key === 'Enter') { openBtn.click(); }
                    });

                    // add copy controls to code spans
                    function addCopyButtons() {
                      const codes = document.querySelectorAll('.code[data-code]');
                      codes.forEach(c => {
                        // avoid duplicating buttons
                        if (c.nextSibling && c.nextSibling.classList && c.nextSibling.classList.contains('copy-btn')) return;
                        const btn = document.createElement('button');
                        btn.className = 'copy-btn';
                        btn.setAttribute('aria-label', 'Copy to clipboard');
                        btn.title = 'Copy to clipboard';
                        btn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" focusable="false"><path d="M6 2h7a1 1 0 0 1 1 1v7h-2V4H6V2z" fill="currentColor" opacity=".45"/><rect x="2" y="4" width="9" height="9" rx="1.5" fill="currentColor"/></svg>';
                        btn.addEventListener('click', () => {
                          const text = c.getAttribute('data-code') || c.textContent || '';
                          navigator.clipboard.writeText(text).catch(() => { showMessage('Copy failed', 'error'); });
                        });
                        c.parentElement.insertBefore(btn, c.nextSibling);
                      });
                    }

                    addCopyButtons();

                    // Connect/Open button removed — sidebar now only guides the user. Copy buttons still work.
                </script>
            </body>
            </html>
        `;
  }
}
