#!/bin/bash

# Development Helper Script
# Ensures you're always working with the right server

case "$1" in
    "clean")
        echo "🧹 Killing all Next.js servers..."
        pkill -f "next dev" 2>/dev/null || true
        sleep 2
        echo "✅ Clean! Now run: yarn dev"
        ;;
    "status")
        echo "📊 Current Next.js servers:"
        ps aux | grep "next dev" | grep -v grep || echo "❌ No servers running"
        ;;
    "ports")
        echo "🔌 Port usage:"
        lsof -i :3000 -i :3001 | grep LISTEN || echo "❌ No ports 3000/3001 in use"
        ;;
    "start")
        echo "🚀 Starting clean dev server..."
        pkill -f "next dev" 2>/dev/null || true
        sleep 2
        echo "📍 Starting on port 3000..."
        yarn dev
        ;;
    *)
        echo "🛠️  Chart-Reuse Dev Helper"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  clean   - Kill all Next.js servers"
        echo "  status  - Show running servers"
        echo "  ports   - Show port usage"
        echo "  start   - Clean start dev server"
        echo ""
        echo "Examples:"
        echo "  $0 clean    # Kill all servers"
        echo "  $0 status   # Check what's running"
        echo "  $0 start    # Fresh start"
        ;;
esac
