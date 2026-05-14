# Solana dApp Store submission

Everything needed to publish SolBorn to the Solana dApp Store via the PWA (TWA APK) path. Run these steps once. Republishing later only re-runs the `create release` + `publish submit` steps.

## Prerequisites (install once)

```bash
# 1. Java JDK 17 (Bubblewrap needs it to build APKs)
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
java -version   # should print openjdk 17

# 2. Bubblewrap CLI (wraps a PWA into an Android TWA APK)
npm install -g @bubblewrap/cli

# 3. Solana CLI (you probably already have it)
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
solana --version

# 4. dapp-publishing CLI (used inline via npx, no global install needed)
# Tested invocation: npx @solana-mobile/dapp-store-publishing@latest --help
```

## Wallets

You need a publisher keypair funded with **~0.2 SOL on Solana mainnet**. It pays for the three Metaplex Core NFT mints (Publisher / App / Release) and the Arweave uploads of assets and APK.

Option A: reuse the existing dev wallet (`6JU8mTyrmpbZJMiEYkJYmXTXtsA3AvkLektQY8DL8JAx`). Funds for fees come out of that wallet — make sure it has 0.2+ SOL on mainnet before running create commands.

Option B: dedicated publisher keypair (cleaner separation):
```bash
solana-keygen new --outfile ./dapp-store/publisher-keypair.json
# transfer 0.2 SOL to its address before continuing
```

Either way, **do not commit the keypair file**. It's already implicitly ignored if you keep it outside the repo or add `dapp-store/publisher-keypair.json` to `.gitignore`.

## Assets

The CLI reads everything from `dapp-store/`. Before submitting, generate the missing assets.

### Icon (done)

`dapp-store/assets/icon.png` — already generated, 512x512.

### Banner

Banner is served by the production site. Fetch it once after the deploy that ships the `/api/og/banner` endpoint:

```bash
curl https://solborn.xyz/api/og/banner -o dapp-store/assets/banner.png
file dapp-store/assets/banner.png   # confirm: PNG image data, 1200 x 600
```

### Screenshots

Need 4 minimum, ideally 6. Each at the resolution your test device captures (typical: 1080x2400 portrait for modern Android). Two ways:

**Real device (preferred):** put the PWA in standalone mode (Add to Home Screen on a real Android in Chrome → opens fullscreen), capture screenshots of:

1. Landing hero with Athena preview card
2. Forge page with an Adult agent + stats
3. Product page hero with the NFT artwork sidebar
4. Product page Founder Profile (trait bars + stage journey)
5. Mint success state (Passport or Launch Cert visible)
6. Phantom signing modal mid-mint (optional, shows the signing flow)

Save as `dapp-store/assets/screenshot-1.png` through `screenshot-N.png`.

**Emulator fallback:** Android Studio → AVD Manager → Pixel 7 with API 34 → install Chrome → navigate to solborn.xyz, install PWA, capture frames.

## APK build (Bubblewrap)

```bash
cd dapp-store
mkdir -p build
cd build

# Initialize from the production manifest
bubblewrap init --manifest=https://solborn.xyz/manifest.webmanifest
# Answer prompts:
#   Domain being opened in the TWA: solborn.xyz
#   Application name: SolBorn
#   Short name: SolBorn
#   Application ID: xyz.solborn.app           # MUST match config.yaml android_package
#   Starting version: 1
#   Display mode: standalone
#   Status bar color: #0a0a0f
#   Splash screen color: #0a0a0f
#   Icon URL: https://solborn.xyz/logo.png    # 512x512+
#   Maskable icon URL: https://solborn.xyz/logo.png
#   Include monochrome icon: no
#   Shortcuts: skip
#   Signing key: GENERATE NEW KEY (do NOT reuse an existing Google Play key)
#     Save the .keystore file somewhere safe. It cannot be regenerated.
#     Remember the password and key alias — Bubblewrap will ask again on `build`.
#   Notification delegation: yes (future-proof for push)

# Build a release APK
bubblewrap build
# Output: ./app-release-bundle.aab and ./app-release-signed.apk

# Verify the APK is a release build (not debug)
unzip -p app-release-signed.apk META-INF/MANIFEST.MF | grep -i "release\|debug"
```

Copy the signed APK to where `config.yaml` expects it:

```bash
cp app-release-signed.apk ../build/solborn-release.apk
cd ..   # back to dapp-store/
```

## Mint and submit (dapp-publishing CLI)

Set environment variables first so commands don't have to repeat them:

```bash
export SOLANA_KEYPAIR=./publisher-keypair.json   # or your existing wallet keypair
export SOLANA_RPC=https://api.mainnet-beta.solana.com   # or a Helius/QuickNode mainnet RPC

# Sanity check: wallet balance
solana balance --keypair $SOLANA_KEYPAIR --url $SOLANA_RPC
# Should print at least 0.2 SOL.
```

### Step 1: Mint Publisher NFT (one-time)

```bash
npx @solana-mobile/dapp-store-publishing@latest create publisher \
  --keypair $SOLANA_KEYPAIR \
  --url $SOLANA_RPC
```

The CLI mints a Publisher NFT and writes its address back into `config.yaml`. Uncomment the `publisher.address` line first if the CLI complains.

### Step 2: Mint App NFT (one-time per app)

```bash
npx @solana-mobile/dapp-store-publishing@latest create app \
  --keypair $SOLANA_KEYPAIR \
  --url $SOLANA_RPC
```

Writes `app.address` to config.

### Step 3: Mint Release NFT (every new version)

```bash
npx @solana-mobile/dapp-store-publishing@latest create release \
  --keypair $SOLANA_KEYPAIR \
  --url $SOLANA_RPC \
  --apk ./build/solborn-release.apk
```

This uploads the APK + assets to Arweave and mints the Release NFT.

### Step 4: Submit for review

```bash
npx @solana-mobile/dapp-store-publishing@latest publish submit \
  --keypair $SOLANA_KEYPAIR \
  --url $SOLANA_RPC \
  --requestor-is-authorized
```

The Solana Mobile team reviews in **2-5 business days**. You get an email at the `publisher.email` address in `config.yaml`.

## After approval

- Listing goes live at `https://dappstore.solanamobile.com/`
- Update grant application's "Existing assets" section with the listing URL
- Tweet the listing → algorithm boost while it's news

## After this commit, before submitting

1. **Replace** `REPLACE_WITH_REAL_EMAIL@solborn.xyz` in `config.yaml` with a real reachable email
2. **Generate** `assets/banner.png` from the live endpoint (after the deploy ships)
3. **Capture** at least 4 mobile screenshots into `assets/screenshot-1.png` …
4. **Fund** publisher wallet with 0.2+ SOL on mainnet
5. **Build** the APK with Bubblewrap (steps above)
6. **Run** the dapp-publishing CLI flow (steps above)

Total operational time: ~3-4 hours focused work spread over the day Bubblewrap downloads Android SDK on first run.
