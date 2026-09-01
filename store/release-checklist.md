# Release Checklist

## Identity and ownership

- [ ] Confirm One More Move name/trademark availability
- [ ] Confirm permanent package ID `io.github.shaqalaka.onemoremove`
- [ ] Enrol the real publisher in Play Console
- [ ] Provide real support email and public developer contact
- [x] Publish privacy-policy effective date and public support channel

## Artifact

- [x] Install Android Studio, Java 21, SDK/API 36, and build tools
- [x] Run `npm install`, `npm run check`, and `npm run cap:sync`
- [x] Compile, lint, and unit-test the debug build
- [x] Test offline launch, accessibility tree, move persistence, and process restart on Android 16 emulator
- [ ] Test haptics, audio, TalkBack, and touch feel on a real Android device
- [x] Set first-release `versionCode 1` and `versionName 0.1.0`; confirm code 1 is unused before upload
- [ ] Generate and securely back up upload keystore
- [ ] Enrol in Play App Signing
- [ ] Build signed release AAB
- [x] Record unsigned AAB SHA-256 in `release/CHECKSUMS.txt`
- [ ] Record signed AAB SHA-256 and upload certificate fingerprint
- [x] Inspect merged manifest and remove unused Google Services/FileProvider integration
- [x] Verify bundled game launches offline and makes no remote gameplay requests

## Store content

- [ ] Upload `store/icon-512.png`
- [ ] Upload `store/feature-1024x500.png`
- [ ] Upload phone screenshots from `store/screenshots/`
- [ ] Finalize listing from `store/listing.md`
- [ ] Link public privacy policy
- [ ] Complete content rating and target-audience forms
- [ ] Declare no ads for v0.1
- [ ] Complete Data safety from final binary audit
- [ ] Confirm all functionality is available without login

## Testing

- [ ] Create internal test release
- [ ] Resolve Play pre-launch report defects
- [ ] Recruit 15–20 testers
- [ ] Keep at least 12 continuously opted in for 14 days
- [ ] Track cohort in `store/tester-tracker.csv`
- [ ] Review gameplay feedback and Android vitals
- [ ] Apply for production access
- [ ] Stage production rollout and define halt criteria
