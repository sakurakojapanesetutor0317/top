# Restaurant Vocabulary Rush — Sakura Japanese (v2)

日本のレストランで使う単語・フレーズを、場面ごとに学んでから落下式ゲームで練習するWebアプリです（HTML / CSS / Vanilla JS、外部ライブラリなし）。

## 学習の流れ
1. **場面を選ぶ**（ホーム）：Entering / Seating / Menu / Ordering / During Meal / Problems / Payment / Leaving
2. **学習する**（場面ページ）：Culture Tips → Vocabulary / Customer / Staff / To Review タブ（日本語・ローマ字・英語）
3. **ゲーム**（Practice）：練習する種類（Vocabulary・Customer・Staff）とセット（New & learning / To review / Mastered）を選び、出題される項目を確認してスタート
   - 出題・選択肢は**選んだ場面の項目だけ**。選択肢が足りないときだけ同じ場面の他の種類を使います
4. **復習**：結果画面の Review Mistakes、または場面ページの To Review

## 公開方法（GitHub Pages）
フォルダの中身をリポジトリのルートに置き、Settings → Pages → Branch `main` / `/ (root)`。`index.html` のダブルクリックでも動きます。

## データの更新（Googleスプレッドシートが原本）
`js/data.js` は**書き出し結果**です。手で編集しないでください。
1. シートを修正
2. 次のどちらかで書き出す
   - 各タブ（Customer, Staff, Vocabulary, Culture Tips, Settings）を「ファイル → ダウンロード → CSV」で1つのフォルダに保存
   - または「## Sheet name: タブ名」＋CSV形式の1ファイルを `data/sheet-export.txt` に保存
3. `python3 tools/build_data.py`（CSVフォルダの場合は `python3 tools/build_data.py フォルダ名`）
   → 場面ごとの件数、自動修正（余分なスペース・Settingsの重複行）、注意点が表示されます。注意点には「ローマ字がかなと合っていない」「ローマ字の列に英語が入っている」「同じ英訳」なども含まれます（データは書き換えず、報告のみ）

## ファイル構成
| ファイル | 役割 |
|---|---|
| `js/data.js` | シートから生成したデータ（場面・項目・Culture Tips） |
| `js/confusables.js` | 同じ問題の選択肢に並べない「意味が近い項目」のグループ（手動で追加可） |
| `js/config.js` | 設定値（時間・出題数・習得条件・速度・得点） |
| `js/storage.js` | 学習記録と旧バージョンからの引き継ぎ |
| `js/session.js` | 1回のゲームの出題セットの選び方 |
| `js/game.js` | ゲーム本体（落下・回答・コンボ・選択肢の重複チェック） |
| `js/app.js` | 画面遷移・場面ページ・結果・進捗 |
| `js/audio.js` | 音声再生（将来用） |
| `tools/build_data.py` | シート → `js/data.js` 変換 |
| `data/sheet-export.txt` | 今回使ったシートの書き出し |
| `data/proofreading-suggestions.csv` | 校正の修正案（最新のシートで残っているもの） |

## 意味が近い選択肢の扱い
次の3つで、正解が2つあるように見える問題を防ぎます。
- `js/confusables.js` のグループ（例：That's all. / That's all for now.）
- 英語のキーワードがほぼ同じものを自動で除外（例：Receipt / A receipt, please.）
- 単語の問題には単語、フレーズの問題にはフレーズを優先して選択肢にする

## 音声の追加（将来）
シートの Audio 列に `audio/C001.mp3` のようなパスを入れて書き出し、MP3 を `audio/` に置くだけで、学習画面に再生ボタンが出ます。Listening Mode は `config.js` の `mode` で切り替える設計です。

## 学習記録
- 同じ項目に3回連続正解で習得。ミス（時間切れ含む）で連続数0・習得解除 → To Review に入る
- **旧バージョン（restaurant_001〜032）の記録**：初回読み込み時に `sakura-rvr-progress-v1-backup-v1` にそのままバックアップし、新IDへ引き継ぎ
  - 日本語が同じ項目（例：ふたりです → C002）：習得状況ごと引き継ぎ
  - 表現が少し違う項目（例：よやくを しています → C006）：回答記録のみ。習得は新しい形でやり直し
  - 対応する行がない5件（ビール・これは なんですか など）：削除せずそのまま保存
- Reset all progress は現在のデータの記録だけを消します（旧データとバックアップは残ります）
