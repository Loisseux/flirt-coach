#!/usr/bin/env node
/**
 * Center PNG screenshots on a store submission canvas.
 *
 * Usage:
 *   node scripts/generate-store-screenshots.mjs --preset ipad
 *   node scripts/generate-store-screenshots.mjs --preset android-tablet
 *   node scripts/generate-store-screenshots.mjs --preset android-tablet-10
 *   node scripts/generate-store-screenshots.mjs --width 1200 --height 1920 --output "~/Downloads/out"
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const BACKGROUND = { r: 0x0d, g: 0x0f, b: 0x1a, alpha: 1 };
const DEFAULT_INPUT = "~/Downloads/Design sans titre-2";

const PRESETS = {
  ipad: {
    width: 2064,
    height: 2752,
    outputDir: "~/Downloads/ipad-screenshots",
  },
  "android-tablet": {
    width: 1200,
    height: 1920,
    outputDir: "~/Downloads/android-tablet-screenshots",
  },
  "android-tablet-10": {
    width: 1600,
    height: 2560,
    outputDir: "~/Downloads/android-tablet-10-screenshots",
  },
};

function expandHome(inputPath) {
  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

function parseArgs(argv) {
  const args = {
    width: null,
    height: null,
    inputDir: expandHome(process.env.STORE_SCREENSHOTS_INPUT ?? DEFAULT_INPUT),
    outputDir: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--preset": {
        const preset = PRESETS[next];
        if (!preset) {
          console.error(`Unknown preset: ${next}. Available: ${Object.keys(PRESETS).join(", ")}`);
          process.exit(1);
        }
        args.width = preset.width;
        args.height = preset.height;
        args.outputDir = expandHome(preset.outputDir);
        i++;
        break;
      }
      case "--width":
        args.width = Number(next);
        i++;
        break;
      case "--height":
        args.height = Number(next);
        i++;
        break;
      case "--input":
        args.inputDir = expandHome(next);
        i++;
        break;
      case "--output":
        args.outputDir = expandHome(next);
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  if (args.width == null || args.height == null || !args.outputDir) {
    console.error("Provide --preset or both --width, --height, and --output.");
    printHelp();
    process.exit(1);
  }

  if (!Number.isFinite(args.width) || !Number.isFinite(args.height) || args.width <= 0 || args.height <= 0) {
    console.error("Invalid canvas dimensions.");
    process.exit(1);
  }

  return args;
}

function printHelp() {
  console.log(`Center PNG screenshots on a store submission canvas.

Usage:
  node scripts/generate-store-screenshots.mjs --preset <name>
  node scripts/generate-store-screenshots.mjs --width W --height H --output DIR

Presets:
  ipad              2064×2752 → ~/Downloads/ipad-screenshots
  android-tablet    1200×1920 → ~/Downloads/android-tablet-screenshots
  android-tablet-10 1600×2560 → ~/Downloads/android-tablet-10-screenshots

Options:
  --input DIR       Source folder (default: ~/Downloads/Design sans titre-2)
  --output DIR      Output folder (required unless using --preset)
  --width W         Canvas width in pixels
  --height H        Canvas height in pixels
`);
}

async function processImage(inputPath, outputPath, canvasWidth, canvasHeight) {
  const resized = await sharp(inputPath)
    .resize(canvasWidth, canvasHeight, { fit: "inside" })
    .toBuffer();

  const { width = 0, height = 0 } = await sharp(resized).metadata();
  const left = Math.round((canvasWidth - width) / 2);
  const top = Math.round((canvasHeight - height) / 2);

  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(outputPath);
}

async function main() {
  const { width, height, inputDir, outputDir } = parseArgs(process.argv);

  try {
    await fs.access(inputDir);
  } catch {
    console.error(`Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  await fs.mkdir(outputDir, { recursive: true });

  const entries = await fs.readdir(inputDir);
  const pngFiles = entries.filter((name) => name.toLowerCase().endsWith(".png")).sort();

  if (pngFiles.length === 0) {
    console.error(`No PNG files found in ${inputDir}`);
    process.exit(1);
  }

  for (const filename of pngFiles) {
    const inputPath = path.join(inputDir, filename);
    const outputPath = path.join(outputDir, filename);
    await processImage(inputPath, outputPath, width, height);
    console.log(`✓ ${filename} → ${outputPath}`);
  }

  console.log(`\nDone. ${pngFiles.length} image(s) at ${width}×${height} saved to ${outputDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
