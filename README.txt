CardWolf v136


変更点:
- トップ画面の「カード提示のみモード」を「カード提示のみモード（対人戦）」へ変更。
- debug.html を追加。通常の index.html とは独立したデバッグ用入口です。
- デバッグモードでは、プラクティスゲーム中の各プレイヤーの投票数を直接変更できます。
- 投票フェーズ／逆転フェーズ／市民勝利／狼勝利の画面へ移動するテストボタンを用意しています。
- デバッグ機能は debug.html からのみ有効になります。
- images フォルダはZIPに含めていません。

注意:
- 公開URLは index.html を使用してください。
- debug.html は開発・テスト用です。Firebaseの権限を迂回する機能ではありません。

v136 debug mode: debug.html includes a single 「再投票テスト」 button. It forces a controlled tie and runs the real solo vote-resolution path so the automatic revote behavior can be verified.


v136: CPU names are selected from 遊戯・城之内・杏子・ヒロト・獏良・海馬・ペガサス・マリク. Wins award 100 medals and losses award 50 medals. ATK/DEF clue menus first ask for 500/1000/1500-unit statements; 3001以上 and special unknown/no-DEF choices remain available.
