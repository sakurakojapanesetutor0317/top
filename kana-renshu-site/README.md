# Kana Renshū かな れんしゅう

Learn **hiragana, katakana and JLPT N5–N1 kanji**: stroke-order animation, tracing practice, Japanese audio, picture-word quizzes and JLPT reading quizzes. Made for people learning Japanese.

Works in any modern browser, on phones and computers. After the first visit it also works offline, and it can be added to the home screen like an app.

## GitHub Pages での公開手順

1. GitHub で新しいリポジトリを作る（例: `kana-renshu`、Public）。
2. このフォルダの中身をすべてリポジトリの一番上にアップロードする（`index.html` がトップに来るように）。
   - ブラウザなら「Add file → Upload files」にフォルダの中身をドラッグ＆ドロップ → 「Commit changes」。
3. リポジトリの **Settings → Pages** を開き、Source を「Deploy from a branch」、Branch を `main` / `/(root)` にして Save。
4. 1〜2分で `https://<ユーザー名>.github.io/kana-renshu/` で見られるようになります。

更新するとき: ファイルを差し替えたあと、`sw.js` の `VERSION`（例: `"v1"` → `"v2"`）も変えてください。オフライン用のキャッシュが新しい版に切り替わります。

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app (HTML, CSS, JS, kana stroke data) |
| `kanji-n5.json` … `kanji-n1.json` | Kanji per JLPT level: meanings, readings, example words, stroke paths, quiz words |
| `manifest.webmanifest`, `icons/` | Home-screen install (PWA) |
| `sw.js` | Offline support |

## Notes

- Audio uses the device's built-in Japanese text-to-speech, so the voice differs between devices. Users can pick a voice, speed and pitch under **Voice**.
- Learning progress is saved in each visitor's browser (localStorage). It is not shared between devices.
- JLPT kanji levels follow the commonly used unofficial lists (official lists have not been published since 2010), checked against Nihongo-Pro's Kanji Pal JLPT list: N5 80, N4 167, N3 370, N2 368, N1 1,235.

## Credits and licenses

This project uses open data. Please keep these credits when you share or modify it.

- **Stroke order data** — [KanjiVG](https://kanjivg.tagaini.net/) by Ulrich Apel, licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The stroke paths in `index.html` and `kanji-n*.json` are derived from KanjiVG and are shared under the same license.
- **Kanji meanings and readings** — [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) by the Electronic Dictionary Research and Development Group, licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), via [kanji-data](https://github.com/davidluzgouveia/kanji-data) by David Luz Gouveia (MIT).
- **JLPT vocabulary** — Jonathan Waller's JLPT lists ([tanos.co.uk](http://www.tanos.co.uk/jlpt/)), licensed under [CC BY](https://creativecommons.org/licenses/by/4.0/), via [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks).
- **Fonts** — Klee One and M PLUS Rounded 1c from Google Fonts (SIL Open Font License).

Because of the share-alike terms above, the data files (`kanji-n*.json` and the stroke data inside `index.html`) are available under **CC BY-SA 4.0**.
