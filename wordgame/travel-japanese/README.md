# Travel Japanese — Sakura Japanese (v3)

日本旅行で使う単語・フレーズを、**シチュエーション（Restaurant / Café …）→ 場面**ごとに学び、落下式ゲーム **Vocabulary Rush** で練習するWebアプリです（HTML / CSS / Vanilla JS、外部ライブラリなし）。

## 画面と流れ
| URL | 画面 |
|---|---|
| `index.html` | シチュエーション一覧（Restaurant, Café …） |
| `index.html?situation=restaurant` | Restaurant のホーム（場面一覧・ゲーム・Culture Tips・進捗） |
| `index.html?situation=cafe` | Café のホーム |
| `…#scene/<場面キー>` | Study Mode（Culture Tips → Vocabulary / Customer / Staff / To Review、前後の場面へ移動） |
| `…#tips` | そのシチュエーションの Culture Tips 全件 |
| `…#practice` → `#game` → `#results` | Vocabulary Rush（出題はシチュエーション全体から） |
| `…#progress` | 学習進捗 |

旧版のリンク（`index.html#scene/Menu` など）は Restaurant の対応する場面に自動で移動します。

## 公開方法（GitHub Pages）
フォルダの中身をリポジトリのルートに置き、Settings → Pages → Branch `main` / `/ (root)`。`index.html` のダブルクリックでも動きます。

## データ管理（Google スプレッドシートが原本）
`js/data.js` は**書き出し結果**です。手で編集しないでください。

### シートの構成（1つのスプレッドシートに全シチュエーション）
| タブ | 列 |
|---|---|
| **Situations** | Situation Key, English Name, Japanese Label, Icon, Display Order, Status |
| **Scenes** | Situation, Scene Key, English Label, Japanese Label, Icon, Display Order |
| **Vocabulary / Customer / Staff** | ID, Japanese, Romaji, English, **restaurant, cafe, …（シチュエーションごとに1列）**, Confusable Group, Audio, Review Status, Notes |
| **Culture Tips** | ID, Topic, Culture Tip (English), **restaurant, cafe, …**, Related Phrase IDs, Article URL, Review Status, Notes |

- **1項目＝1行**。シチュエーション列に場面キー（例：`menu`、`food`）を書くと、そのシチュエーションで使われます。空欄なら使われません。
  同じ「すみません。」を Restaurant と Café の両方で使う場合も行は1つ → 修正は全シチュエーションに反映され、学習記録も共有されます。
- **ID は永久に固定**（学習記録はIDで保存）。使わなくなった行は削除せず、シチュエーション列を空にするか Review Status を `Retired` に。IDの再利用は禁止。
- 新しいIDの付け方：どこでも使える項目は `V/C/S` の連番（V094, C122, S077 …）、そのシチュエーション専用は接頭辞付き（`RA-C001` など。Café は `CA-`）。
- **Japanese はひらがな・カタカナ**。漢字を出す場合は `{予約|よやく}` の形でルビを付けます（Culture Tips の本文でも使用可）。
- **Confusable Group**：同じタグの行は、ゲームで同じ問題の選択肢に並びません（例：`receipt`）。複数は `receipt, payment`。
- **Status**（Situations）：`Published`＝一覧に表示 / `Draft`＝一覧に出さず `?situation=キー` で確認用に開ける / `Hidden`＝書き出さない。
- **Icon**：utensils, coffee, clock, door, book, pencil, shield, alert, card, bag, snow, cake, bell, drop, wifi, tray, pin, noodles, fish, glass, bed, cart, train, store, plane

### 書き出し → 生成
1. シートを修正
2. 次のどちらかで書き出す
   - 各タブを「ファイル → ダウンロード → CSV」で1つのフォルダに保存（`data/sheets/` と同じ形）
   - または「## Sheet name: タブ名」＋CSV形式の1ファイルを `data/sheet-export.txt` に保存
3. `python3 tools/build_data.py`（CSVフォルダの場合は `python3 tools/build_data.py フォルダ名`）
   → 場面ごとの件数と注意点（NOTE）が表示されます。`--verbose` でヒントも表示。
   - ローマ字とかなの不一致、英語欄の日本語、ルビのない漢字、未定義の場面キー、ID重複
   - 同じシチュエーション内で**英訳や日本語が同じ**項目
   - ゲームで**公平な選択肢が3つ作れない**項目

### 新しいシチュエーションを追加する手順（例：Ramen Shop）
1. **Situations** に1行：`ramen, Ramen Shop, ラーメンや, noodles, 3, Draft`
2. **Scenes** に場面を追加：`ramen, ticket, Meal Tickets, しょっけん, card, 1` …
3. **Vocabulary / Customer / Staff / Culture Tips** に `ramen` 列を追加し、
   - 既存の共通項目（すみません、これを ください、おおもり など）は `ramen` 列に場面キーを書くだけ
   - ラーメン専用の項目は新しい行（新しいID）で追加
4. 書き出して `python3 tools/build_data.py` → NOTE を確認
5. `index.html?situation=ramen` で確認 → 問題なければ Status を `Published` にして再生成
   **HTML・JavaScript の変更は不要**です（アイコンは上の一覧から選択。新しいアイコンが必要な場合のみ `index.html` に `ic-名前` の symbol を1つ追加し、`tools/build_data.py` の ICONS に名前を足す）。

## ファイル構成
| ファイル | 役割 |
|---|---|
| `js/data.js` | シートから生成したデータ（全シチュエーション・場面・項目・Culture Tips） |
| `js/situation.js` | URL からシチュエーションを選び、その項目・場面・Tips を用意 |
| `js/confusables.js` | 緊急用の「同じ問題に出さない」グループ（通常はシートの Confusable Group 列） |
| `js/config.js` | 設定値（時間・出題数・習得条件・速度・得点） |
| `js/storage.js` | 学習記録（全シチュエーション共通、IDごと）と旧バージョンからの引き継ぎ |
| `js/session.js` | 1回のゲームの出題セットの選び方 |
| `js/game.js` | ゲーム本体（落下・回答・コンボ・選択肢の公平性チェック） |
| `js/app.js` | 画面遷移・Study Mode・結果・進捗（全シチュエーション共通） |
| `js/audio.js` | 音声再生（録音MP3、なければ端末の日本語音声） |
| `tools/build_data.py` | シート → `js/data.js` 変換とチェック |
| `data/sheet-export.txt` | 現在のシート内容（1ファイル形式） |
| `data/sheets/*.csv` | 同じ内容のタブ別CSV（Google スプレッドシートへの取り込み用） |
| `data/content-changes.csv` | v3 での追加・修正・除外の一覧 |
| `data/proofreading-suggestions.csv` | 残っている確認事項 |

## ゲームの選択肢の公平性
次のいずれかに当たる2項目は、同じ問題の選択肢に並びません（`tools/build_data.py` も同じ規則でチェック）。
- シートの Confusable Group が同じ
- 英語のキーワードがほぼ同じ、または一方が他方に含まれる（例：Receipt / A receipt, please.、Hot (drink) / Hot, please.）
- 日本語の一方が他方に含まれる（例：ホット / ホットで。）
- 単語の問題には単語、フレーズの問題にはフレーズだけを選択肢にする

## 音声
- シートの Audio 列に `audio/C001.mp3` のようなパスを入れて書き出し、MP3 を `audio/` に置くと、その録音が使われます。
- 録音がない項目は、端末に日本語音声がある場合のみ合成音声で再生（は・へ の助詞は「わ・え」と読ませています）。日本語音声のない端末では再生ボタンは表示されません。

## 学習記録
- 同じ項目に3回連続正解で習得。ミス（時間切れ含む）で連続数0・習得解除 → To Review に入る
- 記録はIDごと（`localStorage` の `sakura-rvr-progress-v1`）。共通項目は Restaurant と Café で記録を共有します。
- 旧バージョン（restaurant_001〜032）の記録は `sakura-rvr-progress-v1-backup-v1` にバックアップし、新IDへ引き継ぎ済み（v2から変更なし）。
- 「Reset progress」は開いているシチュエーションの項目だけを消します（共通項目は他のシチュエーションでもリセットされる旨を確認画面に表示）。
