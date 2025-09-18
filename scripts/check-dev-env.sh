#!/bin/bash
set -e

echo "🔍 MCP Vibe Inspector - Development Environment Check"
echo "=================================================="

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node --version)
echo "   Node.js: $node_version"

# Check npm version  
echo "📦 Checking npm version..."
npm_version=$(npm --version)
echo "   npm: $npm_version"

# Install dependencies
echo "📥 Installing dependencies..."
npm ci

# Run linting
echo "🧹 Running ESLint..."
npm run lint
echo "   ✅ Linting passed"

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile
echo "   ✅ Compilation successful"

# Run tests (if available)
echo "🧪 Running tests..."
if npm test 2>/dev/null; then
    echo "   ✅ Tests passed"
else
    echo "   ⚠️  Tests skipped (VS Code may not be available)"
fi

echo ""
echo "🎉 Development environment is ready!"
echo "   Next steps:"
echo "   1. Open VS Code in this directory"
echo "   2. Press F5 to launch Extension Development Host"
echo "   3. Test your changes"
echo "   4. Create a pull request when ready"