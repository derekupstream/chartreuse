#!/bin/bash

# Clean Development Environment
# Kill all existing Next.js dev servers before starting fresh

echo "🧹 Cleaning development environment..."

# Kill all Next.js dev servers
echo "🔪 Killing existing Next.js servers..."
pkill -f "next dev" 2>/dev/null || true

# Wait a moment for processes to die
sleep 2

# Check if any are still running
REMAINING=$(ps aux | grep "next dev" | grep -v grep | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  Some servers are still running:"
    ps aux | grep "next dev" | grep -v grep
    echo "💡 You may need to kill them manually"
else
    echo "✅ All servers cleared"
fi

echo "🚀 Starting fresh dev server..."
echo "📍 Port: 3000 (unless occupied)"
echo "📍 URL: http://localhost:3000"
echo ""
echo "💡 To stop: Ctrl+C"
echo "💡 To check status: ps aux | grep 'next dev' | grep -v grep"

# Start the dev server
yarn dev
