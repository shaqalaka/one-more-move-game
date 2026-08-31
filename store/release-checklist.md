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
- [ ] Test debug build on emulator and real Android device
- [ ] Increment versionCode and set versionName
- [ ] Generate and securely back up upload keystore
- [ ] Enrol in Play App Signing
- [ ] Build signed release AAB
- [ ] Record AAB SHA-256 and signing certificate fingerprint
- [ ] Inspect merged manifest and final bundle dependencies
- [ ] Confirm no unexpected runtime network calls

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
