#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/resources/app-icon.png"
OUT="$ROOT/ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [[ ! -f "$SOURCE" ]]; then
  echo "Missing $SOURCE — add your 1024x1024 PNG as resources/app-icon.png"
  exit 1
fi

WIDTH=$(sips -g pixelWidth "$SOURCE" | awk '/pixelWidth/ {print $2}')
HEIGHT=$(sips -g pixelHeight "$SOURCE" | awk '/pixelHeight/ {print $2}')
if [[ "$WIDTH" != "1024" || "$HEIGHT" != "1024" ]]; then
  echo "resources/app-icon.png must be 1024x1024 (got ${WIDTH}x${HEIGHT})"
  exit 1
fi

mkdir -p "$OUT"

# Remove old generated icons (keep Contents.json until we rewrite it).
find "$OUT" -maxdepth 1 -name 'icon-*.png' -delete
find "$OUT" -maxdepth 1 -name 'AppIcon-*.png' -delete

resize() {
  local size=$1
  local out=$2
  sips -z "$size" "$size" "$SOURCE" --out "$OUT/$out" >/dev/null
}

# iPhone + iPad + App Store sizes (points × scale).
resize 40  "icon-20@2x.png"      # 20pt @2x
resize 60  "icon-20@3x.png"      # 20pt @3x
resize 29  "icon-29@1x.png"      # 29pt @1x (iPad)
resize 58  "icon-29@2x.png"      # 29pt @2x
resize 87  "icon-29@3x.png"      # 29pt @3x
resize 40  "icon-40@1x.png"      # 40pt @1x (iPad)
resize 80  "icon-40@2x.png"      # 40pt @2x
resize 120 "icon-40@3x.png"      # 40pt @3x
resize 120 "icon-60@2x.png"      # 60pt @2x
resize 180 "icon-60@3x.png"      # 60pt @3x
resize 20  "icon-20@1x.png"      # 20pt @1x (iPad)
resize 76  "icon-76@1x.png"      # 76pt @1x (iPad)
resize 152 "icon-76@2x.png"      # 76pt @2x (iPad)
resize 167 "icon-83.5@2x.png"    # 83.5pt @2x (iPad Pro)
resize 1024 "icon-1024.png"      # App Store / universal

cat > "$OUT/Contents.json" <<'EOF'
{
  "images": [
    { "filename": "icon-20@2x.png", "idiom": "iphone", "scale": "2x", "size": "20x20" },
    { "filename": "icon-20@3x.png", "idiom": "iphone", "scale": "3x", "size": "20x20" },
    { "filename": "icon-29@2x.png", "idiom": "iphone", "scale": "2x", "size": "29x29" },
    { "filename": "icon-29@3x.png", "idiom": "iphone", "scale": "3x", "size": "29x29" },
    { "filename": "icon-40@2x.png", "idiom": "iphone", "scale": "2x", "size": "40x40" },
    { "filename": "icon-40@3x.png", "idiom": "iphone", "scale": "3x", "size": "40x40" },
    { "filename": "icon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60" },
    { "filename": "icon-60@3x.png", "idiom": "iphone", "scale": "3x", "size": "60x60" },
    { "filename": "icon-20@1x.png", "idiom": "ipad", "scale": "1x", "size": "20x20" },
    { "filename": "icon-20@2x.png", "idiom": "ipad", "scale": "2x", "size": "20x20" },
    { "filename": "icon-29@1x.png", "idiom": "ipad", "scale": "1x", "size": "29x29" },
    { "filename": "icon-29@2x.png", "idiom": "ipad", "scale": "2x", "size": "29x29" },
    { "filename": "icon-40@1x.png", "idiom": "ipad", "scale": "1x", "size": "40x40" },
    { "filename": "icon-40@2x.png", "idiom": "ipad", "scale": "2x", "size": "40x40" },
    { "filename": "icon-76@1x.png", "idiom": "ipad", "scale": "1x", "size": "76x76" },
    { "filename": "icon-76@2x.png", "idiom": "ipad", "scale": "2x", "size": "76x76" },
    { "filename": "icon-83.5@2x.png", "idiom": "ipad", "scale": "2x", "size": "83.5x83.5" },
    { "filename": "icon-1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
EOF

echo "Generated iOS app icons in $OUT"
