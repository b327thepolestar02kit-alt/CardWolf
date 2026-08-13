Yu-Gi-Oh Card Wolf v63

Release v63
- Fixed a fatal JavaScript syntax error in the online code that could prevent app.js from loading at all. This was the reason all first-screen buttons could become unresponsive.
- Converted the Firebase configuration/app bootstrap to classic scripts so an ES-module import failure cannot disable the whole UI.
- Firebase is still loaded lazily only when online play is used.
- Added a release version guard: version.json, version-check.js and BUILD_VERSION.txt all carry the same build number.
- The visible version in the first screen is explicitly v63 and is also refreshed by version-check.js before app.js runs.
- Added verify-build.ps1 / verify-build.cmd to catch version-number mismatches before packaging a release.
- Online mode supports up to 8 players; the host can select the maximum room size.
- CPU defaults to 0 and is automatically added when fewer than 3 human players are present.
- Voice Chat Mode is available for online games, with a default 2-minute discussion timer.
- Host-only force-end discussion and same-room replay are retained.
- This ZIP intentionally does not contain the images folder. Keep the existing images folder in the GitHub repository when replacing the application files.

Firebase setup
1. Firebase Console > Authentication > Sign-in method > Anonymous: Enabled.
2. Realtime Database > Rules: publish firebase-database-rules.json.
3. Keep firebase-config.js synchronized with the Firebase project.

Deployment
- Replace the files in the GitHub Pages repository with the contents of the v63 folder.
- Keep the existing images folder if it already exists in the repository.
- Confirm the first screen shows v63 before testing other functions.
- If an older version is shown, do not begin gameplay; check that index.html, version-check.js, version.json and app.js were all uploaded.
- Run verify-build.cmd on Windows before future releases.


v63 release checks
- Mobile setup and online dialogs were made responsive so participant-count controls and selectors stay inside the viewport.
- Dialog close buttons use the same high-contrast circular design as the online dialog.
- The online maximum-player setting is explicitly laid out for narrow screens and "3〜8人から選択" remains readable.
- "嘘の回数を表示しない" defaults to checked and getSettings() continues to interpret checked as hidden.
- Voice-chat mode no longer shows "まだ発言していません" in the online player list.
- Version references and cache-busting query parameters are synchronized to v63.
- No separate images folder is included because no image assets were changed in this release.
