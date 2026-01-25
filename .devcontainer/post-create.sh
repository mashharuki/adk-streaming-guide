#!/bin/bash

set -e

echo "🚀 Setting up ADK Streaming Guide development environment..."

# Install Google Cloud CLI
echo "☁️  Installing Google Cloud CLI..."
curl https://sdk.cloud.google.com | bash -s -- --disable-prompts
export PATH="$HOME/google-cloud-sdk/bin:$PATH"

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install MkDocs dependencies
echo "📚 Installing MkDocs dependencies..."
pip install -r requirements.txt

# Install Python linting and formatting tools
echo "🔧 Installing code quality tools..."
pip install black isort flake8

# Install workshop dependencies
echo "🎯 Installing workshop dependencies..."
cd workshops/src && pip install -e . && cd ../..

# Set up git config (optional, can be customized by user)
echo "🔐 Configuring git..."
git config --global --add safe.directory /workspaces/adk-streaming-guide

# Display Python and gcloud versions
echo ""
echo "✅ Setup complete!"
echo ""
echo "Python version:"
python --version
echo ""
echo "gcloud version:"
gcloud --version
echo ""
echo "Installed packages:"
pip list | grep -E "(google-adk|fastapi|mkdocs|black|isort|flake8)"
echo ""
echo "💡 Quick commands:"
echo "  - Run MkDocs server: mkdocs serve"
echo "  - Run workshop app: cd workshops/src && uvicorn app.main:app --reload --port 8080"
echo "  - Lint code: black . && isort . && flake8 ."
echo "  - Lint docs: .claude/skills/docs-lint/check-links.sh docs/part*.md"
echo ""
