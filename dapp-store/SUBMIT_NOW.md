# Submit SolBorn to Solana dApp Store — final steps

> **Note:** Solana Mobile changed the publishing flow in early 2026. The old
> "mint Publisher + App + Release NFTs from CLI" workflow is gone. Now apps
> are registered via the **portal** at https://publish.solanamobile.com,
> and the CLI only uploads new releases against a portal API key.

Everything is built and TWA-verified. Three steps remain.

## Step 1 — Import publisher keypair into Phantom (for portal sign-in)

The portal at publish.solanamobile.com signs you in with a Solana wallet. The
publisher identity should match the keypair the CLI signs releases with —
otherwise the portal sees "publisher X registered the app, but the upload
is signed by Y" and rejects it.

Open Phantom → ⚙ Settings → **Add / Connect Wallet** → **Import Recovery Phrase**
→ paste the BIP39 mnemonic that was emitted when `solana-keygen new` created
`publisher-keypair.json`. The mnemonic is stored locally in your password
manager / Claude memory file — never commit it to git.

After import, verify the derived first account matches public key
`AKpZ68kWBf6htCBE8Vz1WVJN1Kg5adXtuUwsoVidMDoj`. If it doesn't, you imported
the wrong phrase.

## Step 2 — Register SolBorn in the portal (web, one-time)

1. Go to https://publish.solanamobile.com
2. Sign in with your wallet (Phantom)
3. Create a new app entry. Fields the portal will ask for — they're already
   in `dapp-store/config.yaml`, just copy across:

| Portal field | Value from config.yaml |
|---|---|
| App name | `SolBorn` |
| Package ID | `xyz.solborn.app` |
| Publisher name | `SolBorn` |
| Publisher email | `landishser49@gmail.com` |
| Publisher website | `https://solborn.xyz` |
| Icon | upload `dapp-store/assets/icon.png` (512×512) |
| Banner | upload `dapp-store/assets/banner.png` (1200×600) |
| Short description | `AI co-founder that ships your startup on Solana` |
| Long description | copy from `config.yaml` lines 64-89 |
| License URL | `https://github.com/funboy322/solborn/blob/main/LICENSE` |
| Privacy URL | `https://solborn.xyz/privacy` |
| Copyright URL | `https://solborn.xyz/privacy` |

4. The portal will mint an **App NFT** to your wallet (~0.05 SOL fee). The
   address gets stored server-side — you don't need to track it.

5. After App NFT mints, go to https://publish.solanamobile.com/dashboard/settings/api-keys
   and **Generate API key**. Copy it.

## Step 3 — Upload release via CLI

In your terminal:

```bash
export DAPP_STORE_API_KEY=<paste the key from step 2>

cd /Users/ilyas/Downloads/soldad/founder-forge/dapp-store
./submit.sh
```

The script:
1. Pre-flight checks (keypair, APK, assetlinks deployed, API key set, balance)
2. Calls `dapp-store --apk-file ./build/solborn-release.apk --whats-new "..."`
3. Portal extracts package name from APK → matches your registered app →
   uploads to Arweave → mints Release NFT → queues for review

Total CLI runtime: 2-4 minutes. Solana Mobile reviews in **2-5 business days**.
Email at `landishser49@gmail.com`.

## After approval

- Listing live at https://dappstore.solanamobile.com/
- Update the grant application's "Existing assets" with the listing URL
- Tweet from `@solborn_xyz` (script in `docs/twitter-warmup.md`)

## Sanity checks (already passed, do not re-run unless something breaks)

- ✅ APK built and signed (`build/solborn-release.apk`, package `xyz.solborn.app`)
- ✅ assetlinks.json live: `curl https://www.solborn.xyz/.well-known/assetlinks.json`
- ✅ Google verifies the TWA fingerprint:
  ```
  curl 'https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https%3A%2F%2Fwww.solborn.xyz&relation=delegate_permission%2Fcommon.handle_all_urls'
  ```
- ✅ Publisher wallet funded with 0.2 SOL on mainnet
- ✅ 6 portrait screenshots in `assets/`

## Files in this folder

| File | What it is |
|---|---|
| `config.yaml` | Reference for portal form fields (App NFT metadata) |
| `submit.sh` | Final upload runner |
| `publisher-keypair.json` | Solana keypair (gitignored, back up the seed) |
| `assets/icon.png` | 512×512 app icon for portal upload |
| `assets/banner.png` | 1200×600 store banner for portal upload |
| `assets/screenshot-1..6.png` | 1080×2140 portrait shots for portal upload |
| `build/solborn-release.apk` | Signed TWA APK (1.1 MB, gitignored) |
| `build/android.keystore` | Signing key (gitignored — never lose!) |
| `README.md` | Original (outdated) instructions for legacy CLI |
| `SUBMIT_NOW.md` | This file — current portal-flow guide |
