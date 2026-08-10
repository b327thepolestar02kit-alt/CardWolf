Yu-Gi-Oh Card Wolf v31

v31 changes:
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
- Version label updated to v31.

Important:
1. In Firebase Console, enable Authentication > Sign-in method > Anonymous.
2. In Realtime Database > Rules, paste the contents of firebase-database-rules.json and publish.
3. The Firebase config in firebase-config.js is the config for the cardwolf project shown during setup.
4. This first online version is a prototype. The host browser is authoritative; if the host closes the page during a game, the running game may stop.
5. Do not treat the current database rules as a final production security design. Tighten them before public distribution.

