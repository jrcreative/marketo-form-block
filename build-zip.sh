#!/bin/bash

# Exit on error
set -e

# Plugin name and version
PLUGIN_NAME="marketo-form-block"
VERSION=$(grep -o '"version": *"[^"]*"' package.json | grep -o '[0-9][^"]*')

# Check if npm is available
if command -v npm &> /dev/null; then
    # Create a clean build
    echo "🔨 Building plugin assets..."
    npm run build
else
    echo "⚠️ Warning: npm not found. Skipping build step."
    echo "⚠️ Make sure to run 'npm run build' manually before creating the zip file."
    echo "⚠️ Continuing without building assets..."
fi

# Create a temporary directory for the distribution files
echo "📁 Creating temporary directory..."
TMP_DIR="./dist"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR/$PLUGIN_NAME"

# Copy only the necessary files to the temporary directory
echo "📋 Copying production files..."
cp -r marketo-form-block.php "$TMP_DIR/$PLUGIN_NAME/"
cp -r uninstall.php "$TMP_DIR/$PLUGIN_NAME/"
cp -r README.md "$TMP_DIR/$PLUGIN_NAME/"
cp -r build "$TMP_DIR/$PLUGIN_NAME/"
cp -r includes "$TMP_DIR/$PLUGIN_NAME/"
cp -r languages "$TMP_DIR/$PLUGIN_NAME/"
cp -r index.php "$TMP_DIR/$PLUGIN_NAME/"

# Create a zip file from the temporary directory
echo "🗜️ Creating zip file..."
cd "$TMP_DIR"
ZIP_FILE="../$PLUGIN_NAME-$VERSION.zip"
zip -r "$ZIP_FILE" "$PLUGIN_NAME"
cd ..

# Clean up the temporary directory
echo "🧹 Cleaning up..."
rm -rf "$TMP_DIR"

echo "✅ Build complete! Plugin zip file created: $PLUGIN_NAME-$VERSION.zip"
echo "You can now install this zip file in WordPress."