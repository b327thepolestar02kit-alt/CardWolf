CardWolf v133


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

v133 debug mode: debug.html includes a single 「再投票テスト」 button. It forces a controlled tie and runs the real solo vote-resolution path so the automatic revote behavior can be verified.


v133: ATK/DEF clue choices use 500-point ranges (500以下, 501～1000, 1001～1500, 1501～2000, 2001～2500, 2501以上) while unknown values remain separate. Mobile TABLE TALK uses more horizontal space.
