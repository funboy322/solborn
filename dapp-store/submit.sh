#!/usr/bin/env bash
###############################################################################
# SolBorn dApp Store submission runner
#
# Run this when:
#   1. Internet is working (Happ VPN reachable, can `ping 8.8.8.8`)
#   2. `git push` of the assetlinks.json commit has finished deploying on Vercel
#   3. publisher-keypair.json wallet is funded with >= 0.2 SOL on mainnet
#
# Usage:
#   cd dapp-store && ./submit.sh
#
# The script is idempotent — re-run after fixing errors. Each step checks
# whether its output address is already in config.yaml and skips if so.
###############################################################################

set -e   # exit on first error
cd "$(dirname "$0")"

# Colors
R='\033[0;31m'; G='\033[0;32m'; Y='\033[0;33m'; B='\033[0;34m'; N='\033[0m'

# Paths
KEYPAIR="${SOLANA_KEYPAIR:-./publisher-keypair.json}"
RPC="${SOLANA_RPC:-https://api.mainnet-beta.solana.com}"
APK="./build/solborn-release.apk"
CLI="npx --yes @solana-mobile/dapp-store-publishing@latest"

# Ensure solana CLI is on PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${B}  SolBorn → Solana dApp Store submission runner${N}"
echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo

# ─── Pre-flight checks ──────────────────────────────────────────────────────

echo -e "${Y}[1/5] Pre-flight checks${N}"

[ -f "$KEYPAIR" ] || { echo -e "${R}✗${N} keypair not found: $KEYPAIR"; exit 1; }
[ -f "$APK" ] || { echo -e "${R}✗${N} APK not found at $APK — run 'bubblewrap build' first"; exit 1; }
[ -f "./assets/icon.png" ] || { echo -e "${R}✗${N} icon.png missing"; exit 1; }
[ -f "./assets/banner.png" ] || { echo -e "${R}✗${N} banner.png missing"; exit 1; }
for n in 1 2 3 4 5 6; do
  [ -f "./assets/screenshot-$n.png" ] || { echo -e "${R}✗${N} screenshot-$n.png missing"; exit 1; }
done
command -v solana >/dev/null || { echo -e "${R}✗${N} solana CLI not in PATH"; exit 1; }
command -v npx >/dev/null || { echo -e "${R}✗${N} npx not in PATH"; exit 1; }
echo -e "${G}✓${N} all files present"

PUBKEY=$(solana-keygen pubkey "$KEYPAIR")
echo "  publisher wallet: $PUBKEY"

# Internet check
echo -n "  testing RPC… "
BALANCE=$(solana balance "$PUBKEY" --url "$RPC" 2>&1 | head -1)
echo "$BALANCE"
SOL_AMT=$(echo "$BALANCE" | awk '{print $1}')
if [ -z "$SOL_AMT" ] || awk "BEGIN{exit !($SOL_AMT < 0.2)}"; then
  echo -e "${R}✗${N} wallet balance < 0.2 SOL on mainnet. Fund $PUBKEY before continuing."
  exit 1
fi
echo -e "${G}✓${N} wallet has $SOL_AMT SOL"

# assetlinks check
echo -n "  testing https://www.solborn.xyz/.well-known/assetlinks.json… "
HTTP=$(curl -s -o /tmp/al.json -w "%{http_code}" https://www.solborn.xyz/.well-known/assetlinks.json || echo "000")
if [ "$HTTP" != "200" ]; then
  echo -e "${R}HTTP $HTTP${N}"
  echo "  ⚠ assetlinks not deployed. Run: git push  (and wait for Vercel deploy)"
  echo "  Continue anyway? You can submit but TWA will show URL bar = review fail."
  read -p "  proceed? (y/N): " yn
  [ "$yn" = "y" ] || exit 1
else
  FP=$(grep -o '[A-F0-9:]\{95\}' /tmp/al.json | head -1)
  echo -e "${G}HTTP 200${N}"
  echo "  fingerprint on prod: ${FP:0:30}..."
fi

# ─── Step 2: Publisher NFT ──────────────────────────────────────────────────
echo
echo -e "${Y}[2/5] Publisher NFT${N}"
if grep -qE "^  address: [A-Za-z0-9]" <(grep -A 1 "^publisher:" config.yaml); then
  echo -e "${G}✓${N} publisher.address already set, skipping create"
else
  echo "  minting Publisher NFT…"
  $CLI create publisher --keypair "$KEYPAIR" --url "$RPC"
  echo -e "${G}✓${N} publisher minted (address written to config.yaml)"
fi

# ─── Step 3: App NFT ────────────────────────────────────────────────────────
echo
echo -e "${Y}[3/5] App NFT${N}"
if grep -qE "^  address: [A-Za-z0-9]" <(grep -A 1 "^app:" config.yaml); then
  echo -e "${G}✓${N} app.address already set, skipping create"
else
  echo "  minting App NFT…"
  $CLI create app --keypair "$KEYPAIR" --url "$RPC"
  echo -e "${G}✓${N} app minted"
fi

# ─── Step 4: Release NFT ────────────────────────────────────────────────────
echo
echo -e "${Y}[4/5] Release NFT (uploads APK + assets to Arweave, mints NFT)${N}"
$CLI create release --keypair "$KEYPAIR" --url "$RPC" --apk "$APK"
echo -e "${G}✓${N} release minted"

# ─── Step 5: Submit ─────────────────────────────────────────────────────────
echo
echo -e "${Y}[5/5] Submit for review${N}"
$CLI publish submit --keypair "$KEYPAIR" --url "$RPC" --requestor-is-authorized

echo
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  Submitted! Review takes 2–5 business days.${N}"
echo -e "${G}  You'll get email at landishser49@gmail.com${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
