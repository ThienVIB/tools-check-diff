#!/bin/bash

# VIB Tools - Quick Start with Ngrok Tunnel
# Expose localhost to internet for team access

echo "🚀 VIB Tools - Starting with Internet Access"
echo "=============================================="
echo ""

# Check ngrok
if ! command -v ngrok &> /dev/null; then
    echo "⚠️  Ngrok chưa cài đặt!"
    echo ""
    echo "📦 Cài ngrok:"
    echo "   brew install ngrok/ngrok/ngrok"
    echo ""
    echo "Hoặc tải: https://ngrok.com/download"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 Chạy thủ công:"
    echo "   Terminal 1: npm start"
    echo "   Terminal 2: ngrok http 3000"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

# Kill port 3000
if lsof -ti:3000 &> /dev/null; then
    echo "⚠️  Dừng process trên port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start server in background
echo "🔧 Starting server..."
npm start > /tmp/vib-tools.log 2>&1 &
SERVER_PID=$!

# Wait
echo "⏳ Đợi server (15s)..."
for i in {15..1}; do
    printf "\r   %2d giây... " $i
    sleep 1
done
echo ""

# Check
if ! lsof -ti:3000 &> /dev/null; then
    echo "❌ Server failed!"
    echo ""
    tail -20 /tmp/vib-tools.log
    exit 1
fi

echo "✅ Server ready: http://localhost:3000"
echo ""
echo "🌐 Creating public tunnel..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPY URL BÊN DƯỚI CHO TEAM:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start ngrok
ngrok http 3000

# Cleanup
echo ""
echo "🛑 Stopping..."
kill $SERVER_PID 2>/dev/null
echo "✅ Done!"
