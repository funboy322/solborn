# Submit SolBorn to Solana dApp Store — final steps

Everything is built and verified. Only **two things** stand between you and a submitted listing.

## 1. Fund the publisher wallet with 0.2 SOL on mainnet

```
Address: AKpZ68kWBf6htCBE8Vz1WVJN1Kg5adXtuUwsoVidMDoj
Amount:  ~0.2 SOL (covers 3 NFT mint fees + Arweave uploads)
```

Send from Phantom (mainnet) or via CLI:

```bash
solana transfer AKpZ68kWBf6htCBE8Vz1WVJN1Kg5adXtuUwsoVidMDoj 0.2 \
  --url https://api.mainnet-beta.solana.com \
  --from <your-funding-wallet.json>
```

Verify:

```bash
solana balance AKpZ68kWBf6htCBE8Vz1WVJN1Kg5adXtuUwsoVidMDoj \
  --url https://api.mainnet-beta.solana.com
```

Should show `0.2 SOL` (or whatever you sent).

## 2. Run the submit script

```bash
cd /Users/ilyas/Downloads/soldad/founder-forge/dapp-store
./submit.sh
```

The script does pre-flight checks first (balance, assetlinks, all files), then runs the four CLI commands in order:

1. `create publisher` — mints Publisher NFT (~5-10 sec)
2. `create app` — mints App NFT, writes address to `config.yaml`
3. `create release` — uploads APK + 6 screenshots + icon + banner to Arweave, mints Release NFT (~30-60 sec)
4. `publish submit` — flips the submission to "in review"

Total run time: **3-5 minutes**. After step 4, you're done — Solana Mobile will email `landishser49@gmail.com` within 2-5 business days with approval or feedback.

## Verified pre-conditions (already done, don't worry about them)

- ✅ APK built and signed (`build/solborn-release.apk`, package `xyz.solborn.app`)
- ✅ Keystore secured (`build/android.keystore`, gitignored)
- ✅ Digital Asset Links live: https://www.solborn.xyz/.well-known/assetlinks.json
- ✅ Google verification API confirms SHA-256 matches
- ✅ 6 screenshots at 1080×2140 portrait in `assets/`
- ✅ Icon (512×512) and banner (1200×600) in `assets/`
- ✅ `config.yaml` complete (name, package, URLs, all media listed)
- ✅ Publisher keypair gitignored and backed up via seed phrase

## If something fails

Re-run `./submit.sh` — it's idempotent. Steps that already wrote addresses to `config.yaml` are skipped.

Common failure modes:
- **`HTTP 000` on assetlinks** → no internet or Vercel down → check VPN
- **`< 0.2 SOL`** → wallet not yet funded → wait for tx confirmation
- **Arweave upload timeout during `create release`** → network flakiness → just re-run, idempotent
- **`publish submit` rejected** → check email at `landishser49@gmail.com` for review notes

## After approval

- Listing goes live at https://dappstore.solanamobile.com/
- Update the grant application's "Existing assets" with the listing URL
- Tweet about it from `@solborn_xyz` (warm-up post script in `docs/twitter-warmup.md`)
