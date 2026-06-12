#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/resources/app-icon.png"
RES="$ROOT/android/app/src/main/res"

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

resize() {
  local size=$1
  local out=$2
  sips -z "$size" "$size" "$SOURCE" --out "$out" >/dev/null
}

write_launcher_icons() {
  local folder=$1
  local size=$2
  local dir="$RES/$folder"
  mkdir -p "$dir"
  resize "$size" "$dir/ic_launcher.png"
  resize "$size" "$dir/ic_launcher_round.png"
}

write_foreground_icon() {
  local folder=$1
  local size=$2
  local dir="$RES/$folder"
  mkdir -p "$dir"
  resize "$size" "$dir/ic_launcher_foreground.png"
}

# Legacy launcher icons (48dp base).
write_launcher_icons mipmap-mdpi 48
write_launcher_icons mipmap-hdpi 72
write_launcher_icons mipmap-xhdpi 96
write_launcher_icons mipmap-xxhdpi 144
write_launcher_icons mipmap-xxxhdpi 192

# Adaptive icon foreground layers (108dp base).
write_foreground_icon mipmap-mdpi 108
write_foreground_icon mipmap-hdpi 162
write_foreground_icon mipmap-xhdpi 216
write_foreground_icon mipmap-xxhdpi 324
write_foreground_icon mipmap-xxxhdpi 432

# Match adaptive icon background to the logo gradient (deep purple).
cat > "$RES/values/ic_launcher_background.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#6B21A8</color>
</resources>
EOF

echo "Generated Android app icons in $RES/mipmap-*"
