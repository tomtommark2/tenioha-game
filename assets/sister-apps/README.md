# 姉妹アプリの配信用素材

ロゴは無改変、教材は生成・再描画しない。紹介文・トップURL・素材参照の正本は `js/sister_apps.js`。認証・学習データの連携は行わない。2026-10-14に静止画から短い無音のPRループへ変更し、10-15に現行版の公開を承認。公開確認は `docs/experiments/sister-apps-release-2026-10-15/` に記録する。

## 現行のPRループ

本人の素材指定で **UP → EVEN → THERE IS → DARE** に差替え（2026-10-14）。4つとも既存のアニメーションあり。公開対象は図鑑v3と英文図解v1の動画・完成図・公式アイコンのみ。旧案の比較用ファイルと出典記録は開発元ワークスペースに保持し、この公開用checkoutには含めない。

- `dictionary-promo-v3.mp4`: 13.7秒／131,765B、720×480px／30fps、H.264／yuv420p／faststart、音声なし。UPは最初のv1の2.4秒を再使用。
- EVENは `PhrasalVerbApp/assets/svg-audio/single/even_core/core-c77a2a9d10aa.svg` の既存CSSアニメ4.5秒、THERE ISは `there_is_core/core-fd2aad17d909.svg` の冒頭2.2秒、DAREは `dare_core/core-ae0a43039eb4.svg` と `core-f9eab31cd6a5.json` の4.6秒。教材の図・姿勢画像・キーフレーム・意味を新規制作しない。
- SVGのタイトル分を外す切出し（viewBox）は、EVEN `0 74 640 342`、THERE IS `0 35 240 145`、DARE `0 80 640 300`。図を680×305px内へ比率維持で配置し、720×480pxの左20／上135pxへ載せる。既存のCSS線形キーフレーム、DAREは本体 `svg-scene.js` と同じ行列・透明度の補間で、ローカルの静止SVGフレームへ変換して書き出す。CSS色変数は採用SVG内の値で解決。元のSVG/JSON・図鑑本体は無変更、保護素材全体は公開フォルダーへコピーしない。
- アプリの見出し境界は0／2.4／6.9／9.1秒。日本語は採用済み教材の短いコア表現を使用。`dictionary-promo-poster-v3.jpg` はUPの2.1秒の完成図（17,724B）。低モーション／エラーではUPとこの完成図に戻る。
- `node scripts/create-sister-selected-promo.mjs` で再生成（ffmpegとsharpが必要）。sharpの外部ライブラリを使う場合は `SISTER_MEDIA_NODE_MODULES` にそのnode_modulesディレクトリを指定する。フレーム・元ファイルのhash記録は `.media/selected-v3/`、Media Useの派生登録は `.media/`（どちらもGit対象外）。再現時はこれらの出典記録と元教材の採用版を照合する。
- 動画の先読みは追加しない。英文図解v1・共通の可視範囲／停止／繰返し仕様は維持。図鑑の停止操作だけは、図中の下部ラベルと重ならないよう紹介枠の右上へ配置。初期キャッシュはv3完成図のみ。

### 比較版v2（保持）

2026-10-14の追加依頼で、図鑑のUP単体を3語・4場面の紹介へ変更。ローカルのみ、未公開。素材は既存教材MP4の短いPR用抜粋であり、現行のネイティブSVG詳細ページそのものの画面録画ではない。

- `dictionary-promo-v2.mp4`: 16秒／152,285B、720×480px、30fps、H.264／yuv420p／faststart、音声なし。延期・食欲の変化・答えの導出・管理の引き継ぎを順に見せる。長い導入と完成後の待機は省き、主要な移動と短い読取り時間を残す。
- 使用元は `PhrasalVerbApp/assets/videos/phrasal/<語>/<語>-light-magenta-720p.mp4`。下表の図部分だけを720px幅へ縮小し、720×480pxへ中央配置。英語見出し・短い日本語は `js/sister_apps.js` の `examples` で動画の時刻に同期する。元の図・動き・教材データ・公開区分は無変更。

| 場面 | 元動画の範囲 | 切出し（x／y／幅／高さ） | 紹介内の開始 |
| --- | --- | --- | --- |
| put-off：延期 | 10.8〜14.4秒 | 100／290／1080／250 | 0秒 |
| put-off：食欲の変化 | 19.4〜23.6秒 | 160／250／980／270 | 3.6秒 |
| figure-out：答え | 11.0〜15.2秒 | 280／285／740／260 | 7.8秒 |
| take-over：会社の管理 | 6.3〜10.3秒 | 140／260／1000／320 | 12秒 |

- `dictionary-promo-poster-v2.jpg`: 紹介内3.2秒の延期の完成図、17,988B。低モーション・動画エラーではこの図と最初の見出しへ戻る。英文図解のv1は変更しない。
- 図鑑だけの再生成は `node scripts/create-sister-app-promos.mjs --dictionary-multi`。引数なしでは比較用v1と英文図解も再生成する。ffmpegが必要。初期キャッシュはv2の完成図のみ、16秒の動画も紹介を開くまで先読みしない。
- 選定の意味確認：田中茂範『英語イメージ大図鑑』PDF252ページのput offの原図・本文を確認。figure outは同書の局所検索で該当なし、take overは序文の言及のみだったため、[Oxfordのfigure out](https://www.oxfordlearnersdictionaries.com/definition/english/figure-out)、[Cambridgeのtake over](https://dictionary.cambridge.org/us/dictionary/english/take-over)、[Cambridgeのput off](https://dictionary.cambridge.org/dictionary/english/put-off?topic=delaying-and-wasting-time)と現行教材を照合した。短い日本語は各例の紹介用要約で、全用法を機械的に導く規則ではない。書籍の画像・本文は公開素材へ転用しない。

### 初期の短尺版と共通の再生仕様

- `dictionary-promo-v1.mp4`: 既存 `PhrasalVerbApp/assets/videos/particles/up/up-core-light-magenta-720p.mp4` の0.75〜1.35秒＋2.2〜4.0秒を連結。待機を詰め、図が上がる場面に絞る。図部分をx300／y190／780×520pxで切り出し、720×480pxへ縮小。2.4秒、38,264B。
- `sentence-promo-v1.mp4`: 既存 `動く文法図鑑/docs/product/production/pr-assets/major-update-native-structure.gif` の0〜0.6秒＋2.6〜7.4秒を連結。長い冒頭・末尾の停止を短縮。上部の非操作の再生UIと周囲の余白を外し、x60／y66／780×384pxで切り出す。英文・構造図・訳は残す。5.4秒、74,335B。元GIFの段階的な動きを保持し、描画の補間は行わない。
- 両方H.264／yuv420p／faststart、音声トラックなし。`*-promo-poster-v1.jpg` は完成図を動画から抽出した停止時の代替（図鑑17,766B、英文図解27,370B）。元ファイルは所有プロジェクトで無変更のまま保持する。
- v1/v2は比較・復帰用に保持。Media Useによる派生素材の登録はこのディレクトリの `.media/`（Git対象外）に置く。アプリは図鑑v3／英文図解v1の動画・完成図だけを使用する。
- 動画は紹介を開き、枠が25%以上見える時だけ読み込み・再生。閉じる／画面外／タブ非表示では停止。小さな停止・再生操作は別リンクを開かない。動きを減らす設定では完成図を表示し、本人の再生操作は許可する。手動停止は同じページ内で維持するが、端末保存はしない。
- ネイティブのループに加え、終端・予期しない一時停止からの再開を行う。WebKitで一周後に先頭へ戻ったまま `paused:true`／`ended:false` になる現象を再現し、可視範囲・手動停止等の同じ条件を確認して再生するよう修正。ブラウザー任せの設定値だけでなく、2回の巻戻りと3周目の時間進行をChromium／WebKitで検査する。
- 初期キャッシュには完成図のみ登録し、動画を学習開始時に先読みしない。通信・デコードエラーでは完成図とアプリへのリンクを残す。完全オフラインの動画再生を保証しない。

## ロゴ・初期の静止画（比較用に保持）

- `dictionary-icon.png`: `C:/Users/warut/codex_project/PhrasalVerbApp/icons/core-image-icon-192.png`（動く！図鑑、192px）。
- `sentence-icon.png`: `C:/Users/warut/codex_project/PhrasalVerbApp/assets/sister-apps/sentence-icon.png`（英文図解、512px。元素材は `tenioha-products/assets/grammar-zukan-icon-20260906.png`）。
- `dictionary-preview.jpg`: 2026-10-14に https://phrasalverbapp-d5fa7.web.app/?word=of_base の公開教材をIABで撮影（390×320px）。コアイメージが見える位置までスクロールし、上部操作とOF図を含む範囲を採用。元の画面全体は `screenshots/sister-apps-20261014/dictionary-of-source-390.png`。
- `sentence-preview.jpg`: 同日に https://grammar-zukan.web.app/ からログイン不要の1文体験を開き、まとまりを分けた画面をIABで撮影（CSS 880×760px、撮影データ865×747px）。カード内ではCSSで構造図を中心に表示する。元の画面は `screenshots/sister-apps-20261014/sentence-structure-source-880.png`。

初期の `*-preview.jpg` は比較用の静止画として保持し、現行の表示・初期キャッシュでは使用しない。紹介は実教材の録画で、アプリ自体を操作できる埋込画面ではない。生成モックや個人情報を含む画面は採用しない。

採用経緯・確認は `docs/sister-apps-introduction-research-20261013.md`。
