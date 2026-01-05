#!/bin/bash

# Logo Replacement Helper Script
# This script helps you add your actual logo files

LOGO_DIR="/Users/alonmiron/dad_test/frontend/public/logos"

echo "=========================================="
echo "   Logo Replacement Helper"
echo "=========================================="
echo ""

# Check if logo directory exists
if [ ! -d "$LOGO_DIR" ]; then
    echo "❌ Error: Logo directory not found: $LOGO_DIR"
    exit 1
fi

echo "📁 Logo directory: $LOGO_DIR"
echo ""
echo "Current files:"
ls -lh "$LOGO_DIR" | grep -E '\.(png|svg|jpg|jpeg)$' || echo "  (no image files found)"
echo ""
echo "=========================================="
echo ""
echo "To add your logos, use one of these methods:"
echo ""
echo "Method 1: Drag and Drop (macOS Finder)"
echo "  1. Open Finder to: $LOGO_DIR"
echo "  2. Drag your logo files into this folder"
echo "  3. Rename them to:"
echo "     - main-logo.png (Hebrew text logo)"
echo "     - secondary-logo.png (house/tree emblem)"
echo ""
echo "Method 2: Command Line"
echo "  cp /path/to/your/main-logo.png \"$LOGO_DIR/main-logo.png\""
echo "  cp /path/to/your/secondary-logo.png \"$LOGO_DIR/secondary-logo.png\""
echo ""
echo "Method 3: This Script (Interactive)"

# Ask if user wants to copy files now
echo ""
read -p "Do you want to copy logo files now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "--- Main Logo (Hebrew רעננה text) ---"
    read -e -p "Path to main logo file: " MAIN_LOGO_PATH
    
    if [ -f "$MAIN_LOGO_PATH" ]; then
        cp "$MAIN_LOGO_PATH" "$LOGO_DIR/main-logo.png"
        echo "✅ Main logo copied!"
    else
        echo "❌ File not found: $MAIN_LOGO_PATH"
    fi
    
    echo ""
    echo "--- Secondary Logo (House/Tree emblem) ---"
    read -e -p "Path to secondary logo file: " SEC_LOGO_PATH
    
    if [ -f "$SEC_LOGO_PATH" ]; then
        cp "$SEC_LOGO_PATH" "$LOGO_DIR/secondary-logo.png"
        echo "✅ Secondary logo copied!"
    else
        echo "❌ File not found: $SEC_LOGO_PATH"
    fi
    
    echo ""
    echo "=========================================="
    echo "Final logo files:"
    ls -lh "$LOGO_DIR" | grep -E '\.(png|svg)$'
    echo "=========================================="
fi

echo ""
echo "✨ Done! Start the dev server to see your logos:"
echo "   cd /Users/alonmiron/dad_test/frontend && npm run dev"
echo ""


