# てにをは英単語 / python_chatgpt

英単語学習アプリ本体と、その周辺の Firebase / テスト / コンテンツ整備スクリプトを含むリポジトリです。

この repo の標準運用では、`index.html` を編集元とし、`vocab_clicker_game.html` は配信用の同期コピーとして扱います。

## Quickstart

1. 依存関係を入れる
   - ルート: `npm install`
   - Functions を触る場合: `cd functions && npm install`
2. ローカル表示
   - Windows: `py -3 local_server.py`
   - macOS / Linux: `python3 local_server.py`
3. ブラウザで開く
   - [http://localhost:8000/index.html](http://localhost:8000/index.html)
4. テスト
   - `npm run test:unit`
   - `npm run test:e2e`
   - `npm run test:e2e:safe`

## Main Docs

- `SETUP.md`
- `ARCHITECTURE.md`
- `docs/operations.md`
- `docs/data-workflow.md`
- `docs/repo-inventory.md`
- `docs/legacy-reference.md`

## Key Commands

- `npm run sync:html`
- `npm run check:html-sync`
- `npm run check:version-sync`
- `npm run release:patch`

## Repo Policy

- 現在のコードとテストを正とする
- `docs/` を運用知識の system of record にする
- `.agent/` や旧ディレクトリは一次情報ではなく legacy reference として扱う
