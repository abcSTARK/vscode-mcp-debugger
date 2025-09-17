import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('undefined_publisher.mcp-debugger'));
	});

	test('Should register mcp-debugger.openInspector command', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('mcp-debugger.openInspector'));
	});

	test('Should have configuration contribution', () => {
		const config = vscode.workspace.getConfiguration('mcpDebugger');
		assert.ok(config !== undefined);
		
		// Test default inspector URL configuration
		const inspectorUrl = config.get('inspectorUrl');
		assert.strictEqual(inspectorUrl, 'http://localhost:3000');
	});
});
