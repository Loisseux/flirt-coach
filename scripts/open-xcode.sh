#!/usr/bin/env bash
# Open Quippr in Xcode for the iOS Simulator — does NOT run a build (avoids Cursor focusing .env).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="$ROOT/ios/App/App.xcodeproj"

if [[ ! -d "$PROJECT" ]]; then
  echo "Xcode project not found. Run: npm run cap:sync:ios"
  exit 1
fi

# Prefer Xcode CLI; fall back to open.
if command -v xed >/dev/null 2>&1; then
  xed "$PROJECT"
else
  /usr/bin/open -a Xcode "$PROJECT"
fi

osascript <<'EOF'
tell application "Xcode"
  activate
end tell
EOF

echo ""
echo "✓ Xcode is in front with ios/App/App.xcodeproj"
echo "  1. Choose an iPhone simulator (top toolbar)"
echo "  2. Press Cmd+R to run"
echo ""
echo "Need a fresh web build first? Run in Terminal.app:"
echo "  cd $ROOT && npm run cap:sync:ios"
echo ""
