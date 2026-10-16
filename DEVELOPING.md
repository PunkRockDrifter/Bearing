# Bearing: developer notes

A career direction finder: a ten-minute questionnaire that suggests a direction and ranks 204 Australian jobs by how well they match, without starting from your job history. It runs entirely on the device, works offline once loaded, and installs to a phone's home screen.

## Files

| File | What it is |
|---|---|
| `index.html` | App shell |
| `app.js` | Questions flow, scoring, results, sharing and settings |
| `data.js` | Questions, interest types, the original 79 jobs, fields |
| `jobs2.js` | The other 125 jobs |
| `style.css` | Styles (light and dark) |
| `manifest.webmanifest`, `icons/` | Makes it installable |
| `sw.js` | Offline support (cache version `d7e7cdc8d2`) |
| `config.js` | Your feedback Sheet address. Leave empty to hide the feedback card. |
| `apps-script/` | The Google Sheet receiver for feedback, with step-by-step `SETUP.md` |
| `privacy.html` | Privacy policy. **Fill in the bracketed details before publishing.** |

## Try it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Offline caching and the install prompt need `localhost` or HTTPS.

## Publish on GitHub Pages (free)

This repository is `PunkRockDrifter/Bearing`, so the site is `https://punkrockdrifter.github.io/Bearing/`.

1. Push these files to the `main` branch.
2. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save.
3. `config.js` already points `BEARING_SHARE_BASE` and `BEARING_APK_URL` at the addresses above.

### Making links open in the app

Android only opens a website's links in an app after checking `https://punkrockdrifter.github.io/.well-known/assetlinks.json`, at the root of the account site rather than under `/Bearing/`. Create a second public repository named exactly `PunkRockDrifter.github.io`, put the `.well-known/assetlinks.json` file from the `PunkRockDrifter.github.io` folder in it, and turn on Pages for it too. Until then, links open in the browser.

## Installing it

- **Android (Chrome):** open the site, then use **Install** in Bearing's Settings, or the browser menu's **Install app**.
- **iPhone (Safari):** Share → **Add to Home Screen**.

## Sharing between people

On the hosted app, sharing uses links:

- `?describe=Name` opens the friend questions about Name.
- `?friend=BRG-F1…` adds a friend's answers to your results.
- `?profile=BRG-P1…` opens a set of results.

All the data is inside the link itself, so no server or database is involved.

## Updating

Edit the source files, rebuild, and push. The service worker's cache name changes with the content, so installed copies update on their next launch.

## Android app (.apk)

The `android/` folder is a small Android app that wraps this web app, and `.github/workflows/build-apk.yml` makes GitHub build it for you. Every push to `main` produces a fresh `Bearing.apk` on the repository's **Releases** page.

### One-time setup

1. **Push this folder to a GitHub repository** (see "Publish on GitHub Pages" below; do that too, since invite links need the web address).
2. **Add the signing key as two secrets.** In the repository, go to **Settings → Secrets and variables → Actions → New repository secret**:
   - `KEYSTORE_B64`: paste the whole contents of `KEYSTORE_B64.txt`
   - `KEYSTORE_PASSWORD`: paste the contents of `KEYSTORE_PASSWORD.txt`

   These files were sent separately. Keep `bearing-release.jks` and its password somewhere safe: every future version must be signed with the same key, or phones will refuse to update and people would have to uninstall (losing their answers). Never commit them to the repository.
3. **Set your web address** in `config.js`, for example `window.BEARING_SHARE_BASE = 'https://yourname.github.io/bearing/';`. The app uses it for invite and results links. Friends who open a link get the web version, so they don't need the app.
4. **Run the build:** push a change, or open the **Actions** tab, choose "Build Android APK" and click **Run workflow**. It takes about 3 to 5 minutes.

### Installing on a phone

1. On the phone, open the repository's **Releases** page and tap **Bearing.apk** under "Bearing for Android (latest build)".
2. Open the downloaded file. Android asks you to allow installs from your browser or file manager the first time; allow it, then tap **Install**.
3. Newer builds install over the top and keep everyone's answers, as long as they're signed with the same key.

### Notes

- The app is self-contained: it works fully offline. Only fonts, outside links (SEEK, courses) and feedback need the internet.
- Outside links open in the phone's browser. Sharing uses Android's share sheet.
- If a build fails, open the failed run in the Actions tab and copy the red error lines; that's what's needed to fix it.

## Later: Google Play

Once it's hosted, it can be wrapped as an Android app with Bubblewrap (a Trusted Web Activity). That needs a `.well-known/assetlinks.json` file on the site to prove you own it, and a Google Play developer account.
