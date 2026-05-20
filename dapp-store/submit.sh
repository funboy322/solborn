#!/usr/bin/env bash
###############################################################################
# SolBorn dApp Store submission runner (portal-backed CLI, v1.0+)
#
# Solana Mobile changed the publishing flow in early 2026:
#   1. App registration + App NFT now happen on https://publish.solanamobile.com
#   2. CLI uploads APK + metadata against a portal API key, portal handles
#      Arweave + Release NFT mint + review queue
#
# Run this AFTER you have:
#   1. Created the SolBorn app in https://publish.solanamobile.com
#      (importing dapp-store/publisher-keypair.json into Phantom first so
#       portal recognizes the same publisher identity)
#   2. Generated an API key at
#      https://publish.solanamobile.com/dashboard/settings/api-keys
#   3. Saved the key in env:  export DAPP_STORE_API_KEY=<key>
#
# Usage:
#   cd dapp-store && ./submit.sh
###############################################################################

set -e
cd "$(dirname "$0")"

# Colors
R='\033[0;31m'; G='\033[0;32m'; Y='\033[0;33m'; B='\033[0;34m'; N='\033[0m'

KEYPAIR="${SOLANA_KEYPAIR:-./publisher-keypair.json}"
APK="./build/solborn-release.apk"
WHATS_NEW="${WHATS_NEW:-First Solana dApp Store release. PWA wrapped as TWA. Devnet flows for Passport + Launch Certificate NFTs.}"

# CLI: pin to 1.0.0 (verified compatible with this script's flags)
CLI="npx --yes @solana-mobile/dapp-store-cli@1.0.0"

# Ensure solana CLI on PATH (for balance check)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${B}  SolBorn → Solana dApp Store submission runner${N}"
echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo

# ─── Pre-flight checks ─────────────────────────────────────────────────────

echo -e "${Y}[1/3] Pre-flight checks${N}"

[ -f "$KEYPAIR" ] || { echo -e "${R}✗${N} keypair not found: $KEYPAIR"; exit 1; }
[ -f "$APK" ] || { echo -e "${R}✗${N} APK not found at $APK — run 'bubblewrap build' first"; exit 1; }
command -v npx >/dev/null || { echo -e "${R}✗${N} npx not in PATH"; exit 1; }
echo -e "${G}✓${N} keypair + APK present"

# API key
if [ -z "$DAPP_STORE_API_KEY" ]; then
  echo -e "${R}✗${N} DAPP_STORE_API_KEY not set"
  echo "   1. Sign in at https://publish.solanamobile.com (use Phantom with publisher keypair)"
  echo "   2. Create the app entry (uses ~0.05 SOL for App NFT mint)"
  echo "   3. Generate key at https://publish.solanamobile.com/dashboard/settings/api-keys"
  echo "   4. export DAPP_STORE_API_KEY=<your_key>"
  exit 1
fi
echo -e "${G}✓${N} DAPP_STORE_API_KEY is set (${#DAPP_STORE_API_KEY} chars)"

# Wallet balance (informational — portal handles RPC, but Release NFT mint
# may still draw from publisher wallet; keep 0.05+ SOL as buffer)
PUBKEY=$(solana-keygen pubkey "$KEYPAIR")
BAL=$(solana balance "$PUBKEY" --url https://api.mainnet-beta.solana.com 2>/dev/null | awk '{print $1}')
echo -e "${G}✓${N} publisher $PUBKEY has $BAL SOL"

# Assetlinks deployed
echo -n "  testing https://www.solborn.xyz/.well-known/assetlinks.json… "
HTTP=$(curl -s -o /tmp/al.json -w "%{http_code}" -m 5 https://www.solborn.xyz/.well-known/assetlinks.json || echo "000")
if [ "$HTTP" = "200" ]; then
  echo -e "${G}HTTP 200${N}"
else
  echo -e "${R}HTTP $HTTP — TWA verification will fail review${N}"
  read -p "  continue anyway? (y/N): " yn
  [ "$yn" = "y" ] || exit 1
fi

# ─── Publish via portal ─────────────────────────────────────────────────────

echo
echo -e "${Y}[2/3] Uploading APK + metadata to portal${N}"
echo "  whats-new: ${WHATS_NEW}"
echo

# Portal infers app from APK package name (xyz.solborn.app), uploads to Arweave,
# mints Release NFT against publisher wallet, queues for review.
$CLI --apk-file "$APK" --whats-new "$WHATS_NEW" --keypair "$KEYPAIR"

echo
echo -e "${Y}[3/3] Done${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  Release queued for review. Check status at${N}"
echo -e "${G}  https://publish.solanamobile.com/dashboard${N}"
echo -e "${G}  Email: landishser49@gmail.com (2-5 business days)${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
