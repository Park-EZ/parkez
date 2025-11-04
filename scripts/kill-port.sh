#!/bin/bash

# Kill process on a specific port
# Usage: ./scripts/kill-port.sh <port>

PORT=${1:-3000}

echo "🔍 Checking for processes on port $PORT..."

# Find process using the port
PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
  echo "✅ No process found on port $PORT"
  exit 0
fi

echo "📋 Found process(es) on port $PORT:"
lsof -i:$PORT

echo ""
read -p "⚠️  Kill process(es) on port $PORT? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  kill -9 $PID
  echo "✅ Killed process(es) on port $PORT"
else
  echo "❌ Cancelled"
  exit 1
fi

