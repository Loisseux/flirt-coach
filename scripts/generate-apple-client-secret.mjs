#!/usr/bin/env node
/**
 * Generate an Apple Sign In client_secret JWT for Supabase OAuth.
 *
 * Apple docs: https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret
 * Supabase: paste the JWT into Authentication → Providers → Apple → Secret Key
 *
 * Usage:
 *   node scripts/generate-apple-client-secret.mjs \
 *     --team-id YOUR_TEAM_ID \
 *     --key-id YOUR_KEY_ID \
 *     --client-id com.quippr.app.web \
 *     --key-file ./AuthKey_XXXXXXXXXX.p8
 *
 * Or set env vars: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY_PATH
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const APPLE_AUDIENCE = "https://appleid.apple.com";
/** Apple allows at most ~6 months; 180 days stays safely under the limit. */
const DEFAULT_EXPIRY_SECONDS = 86400 * 180;

function parseArgs(argv) {
  const args = {
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    clientId: process.env.APPLE_CLIENT_ID ?? "com.quippr.app.web",
    keyFile: process.env.APPLE_PRIVATE_KEY_PATH,
    expirySeconds: Number(process.env.APPLE_JWT_EXPIRY_SECONDS ?? DEFAULT_EXPIRY_SECONDS),
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--team-id":
        args.teamId = next;
        i++;
        break;
      case "--key-id":
        args.keyId = next;
        i++;
        break;
      case "--client-id":
        args.clientId = next;
        i++;
        break;
      case "--key-file":
        args.keyFile = next;
        i++;
        break;
      case "--expiry-days":
        args.expirySeconds = Number(next) * 86400;
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

  return args;
}

function printHelp() {
  console.log(`Generate Apple Sign In client_secret JWT for Supabase

Usage:
  node scripts/generate-apple-client-secret.mjs [options]

Options:
  --team-id <id>       Apple Team ID (10 characters)
  --key-id <id>        Key ID from your Sign in with Apple .p8 key
  --client-id <id>     Services ID (default: com.quippr.app.web)
  --key-file <path>    Path to AuthKey_XXXXXXXXXX.p8
  --expiry-days <n>    JWT lifetime in days (default: 180, max ~182)
  -h, --help           Show this help

Environment variables (alternative to flags):
  APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY_PATH

Example:
  node scripts/generate-apple-client-secret.mjs \\
    --team-id ABCDE12345 \\
    --key-id XYZ9876543 \\
    --client-id com.quippr.app.web \\
    --key-file ./AuthKey_XYZ9876543.p8
`);
}

function base64UrlEncode(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buffer.toString("base64url");
}

function createAppleClientSecret({ teamId, keyId, clientId, privateKey, expirySeconds }) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expirySeconds;

  const header = {
    alg: "ES256",
    kid: keyId,
  };

  const payload = {
    iss: teamId,
    iat,
    exp,
    aud: APPLE_AUDIENCE,
    sub: clientId,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function validateArgs(args) {
  const missing = [];
  if (!args.teamId) missing.push("--team-id / APPLE_TEAM_ID");
  if (!args.keyId) missing.push("--key-id / APPLE_KEY_ID");
  if (!args.clientId) missing.push("--client-id / APPLE_CLIENT_ID");
  if (!args.keyFile) missing.push("--key-file / APPLE_PRIVATE_KEY_PATH");

  if (missing.length > 0) {
    console.error("Missing required arguments:\n  " + missing.join("\n  "));
    printHelp();
    process.exit(1);
  }

  const resolvedKeyFile = path.resolve(args.keyFile);
  if (!fs.existsSync(resolvedKeyFile)) {
    console.error(`Private key file not found: ${resolvedKeyFile}`);
    process.exit(1);
  }

  if (!Number.isFinite(args.expirySeconds) || args.expirySeconds <= 0) {
    console.error("Invalid expiry duration.");
    process.exit(1);
  }

  const maxExpirySeconds = 86400 * 182;
  if (args.expirySeconds > maxExpirySeconds) {
    console.error(`Expiry exceeds Apple's ~6 month maximum (${maxExpirySeconds} seconds).`);
    process.exit(1);
  }

  return { ...args, keyFile: resolvedKeyFile };
}

function main() {
  const args = validateArgs(parseArgs(process.argv));
  const privateKey = fs.readFileSync(args.keyFile, "utf8");

  const jwt = createAppleClientSecret({
    teamId: args.teamId,
    keyId: args.keyId,
    clientId: args.clientId,
    privateKey,
    expirySeconds: args.expirySeconds,
  });

  const expiresAt = new Date((Math.floor(Date.now() / 1000) + args.expirySeconds) * 1000);

  console.log(jwt);
  console.error("");
  console.error("Paste the JWT above into Supabase → Authentication → Providers → Apple → Secret Key");
  console.error(`Client ID (Services ID): ${args.clientId}`);
  console.error(`Expires: ${expiresAt.toISOString()} (${args.expirySeconds / 86400} days)`);
  console.error("Regenerate before expiry — Apple JWTs cannot be renewed automatically.");
}

main();
