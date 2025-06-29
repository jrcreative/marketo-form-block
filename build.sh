#!/bin/bash

# Marketo Form Block - Build Script
# This script helps with building and deploying the plugin

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[Marketo Form Block]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[Warning]${NC} $1"
}

print_error() {
    echo -e "${RED}[Error]${NC} $1"
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Function to install dependencies
install_dependencies() {
    print_message "Installing dependencies..."
    npm install
}

# Function to build the plugin
build_plugin() {
    print_message "Building plugin..."
    npm run build
}

# Function to create a distribution zip file
create_zip() {
    print_message "Creating distribution zip file..."
    
    # Create a temporary directory for the distribution
    mkdir -p dist
    
    # Create a zip file
    zip_file="dist/marketo-form-block.zip"
    
    # Remove existing zip file if it exists
    if [ -f "$zip_file" ]; then
        rm "$zip_file"
    fi
    
    # Create the zip file
    zip -r "$zip_file" \
        marketo-form-block.php \
        index.php \
        uninstall.php \
        README.md \
        build/ \
        includes/ \
        languages/ \
        -x "*.DS_Store" \
        -x "*/.git/*" \
        -x "*/node_modules/*"
    
    print_message "Distribution zip file created: $zip_file"
}

# Function to clean up build files
clean() {
    print_message "Cleaning up build files..."
    rm -rf build/*.js build/*.css build/*.map build/*.asset.php
    rm -rf node_modules
    rm -rf dist
}

# Parse command line arguments
case "$1" in
    install)
        install_dependencies
        ;;
    build)
        build_plugin
        ;;
    zip)
        create_zip
        ;;
    clean)
        clean
        ;;
    all)
        install_dependencies
        build_plugin
        create_zip
        ;;
    *)
        print_message "Usage: $0 {install|build|zip|clean|all}"
        print_message "  install - Install dependencies"
        print_message "  build   - Build the plugin"
        print_message "  zip     - Create a distribution zip file"
        print_message "  clean   - Clean up build files"
        print_message "  all     - Run all steps (install, build, zip)"
        exit 1
        ;;
esac

print_message "Done!"