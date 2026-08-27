CardWolf Yu-Gi-Oh v109

変更点:
- プラクティスモードの発言候補生成を安全化し、候補生成・再描画で例外が起きても必ずフォールバック候補を表示。
- カード画像が未配置でも、日本語カード名・種別・ATK/DEFをカード面に表示するフォールバックを追加。
- v106のカードプール選択（40～100種、10種刻み）を維持。
- release ZIPにはimagesフォルダを含めない。必要な画像はprepare_cards.cmdで生成可能。

v109 セキュリティ修正:
- privateCards を /rooms/{roomId}/privateCards からトップレベル /privateCards/{roomId}/{uid} へ分離。
- /rooms/{roomId} の公開読み取りで他プレイヤーの privateCards が取得できない構造に変更。
- privateCards の読み取りは本人UIDのみ許可。
- privateCards の書き込みは本人またはホストのみ許可。
- 非ホストの本人書き込みは cardName=null の初期化のみ許可し、カード名の自己変更を防止。
- ホスト退室時は /privateCards/{roomId} を先に削除してからルームを削除。

Firebase側での注意:
- firebase-database-rules.json の内容をRealtime DatabaseのRulesへ反映してください。
- GitHubへファイルをアップロードするだけではFirebaseのSecurity Rulesは自動更新されません。
