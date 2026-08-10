Yu-Gi-Oh Card Wolf v54

v54: Fixed online rematch state races by assigning a new matchId/matchStartedAt before the room update; stale result snapshots can no longer overwrite the new game. The replay now reliably resets result/timer/action state and starts the new card/discussion phase for all players while keeping cumulative win/loss counts.
v54 changes:
- Firebase Web App configuration synchronized with the Firebase Console (including databaseURL).
- Added an online multiplayer mode using Firebase Realtime Database.
- Added a lobby with a 4-character room code.
- Same URL + room code lets friends join the same game.
- Online mode supports up to 4 human players.
- CPU addition is 0 by default; CPU is automatically added until the total reaches 3 players.
- Host controls the shared game state.
- Each human player's own card is stored in a private Firebase path.
- Solo mode remains available.
- Added Firebase Anonymous Authentication requirement.
- Added firebase-config.js and firebase-database-rules.json.
- Version label updated to v54.

Important:
1. In Firebase Console, enable Authentication > Sign-in method > Anonymous.
2. In Realtime Database > Rules, paste the contents of firebase-database-rules.json and publish.
3. The Firebase config in firebase-config.js is the config for the cardwolf project shown during setup.
4. This first online version is a prototype. The host browser is authoritative; if the host closes the page during a game, the running game may stop.
5. Do not treat the current database rules as a final production security design. Tighten them before public distribution.



v54: Online CPU turn watchdog, awaited turn advancement, and startup listener ordering fix.
v54: Fixed online clue buttons crashing when usedClueIds was missing from a room snapshot; normalized online game state and added safer action submission.


v54: Fixed online action permission handling by explicitly validating per-player action queues, added client-version tagging, and cache-busted app.js so GitHub Pages loads the new build.
v54: Added per-action host acknowledgements so clue/vote submissions cannot remain stuck after a stale or rejected request; fixed Firebase listener cleanup and stabilized multi-human voting.

v54 update notes:
- Added online Voice Chat Mode with a discussion timer (default 2 minutes).
- Voice Chat Mode skips clue-selection buttons; players discuss via external voice chat, then vote.
- CPU setting is shown to the host only in the online lobby.
- This release ZIP intentionally omits the images folder. Keep the existing images folder in the GitHub repository when updating files.


v54 update notes:
- Fixed host-side voice-chat discussion countdown rendering so Firebase snapshots do not reset the visible timer.
- Added host-only same-room replay from the result screen.
- Kept the host-only force-end discussion control.
- Version labels and package directory are aligned to v54.


v54 update notes:
- Online rooms always allow up to 4 human players; CPU fills the room only when fewer than 3 humans are present.
- Voice-chat discussion now uses an authoritative per-match deadline, including after replaying in the same room.
- Clicking the online dialog backdrop or pressing Escape no longer ejects a player from the room.
- Improved visibility of the online dialog close button.
