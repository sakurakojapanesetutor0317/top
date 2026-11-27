#!/usr/bin/env python3
"""
Travel Japanese (Sakura Japanese) — build js/data.js from the Google Sheet
==========================================================================
The Google Sheet "Sakura Japanese | Travel Japanese Phrase Bank" is the source
of truth. js/data.js is generated output: do not edit it by hand.

Sheet tabs
----------
  Situations    Situation Key | English Name | Japanese Label | Icon | Display Order | Status
  Scenes        Situation | Scene Key | English Label | Japanese Label | Icon | Display Order
  Vocabulary    ID | Japanese | Romaji | English | <one column per situation key> |
  Customer        Confusable Group | Audio | Review Status | Notes
  Staff
  Culture Tips  ID | Topic | Culture Tip (English) | <one column per situation key> |
                  Related Phrase IDs | Article URL | Review Status | Notes

One row = one item, written once. To use an item in a situation, write the
scene key in that situation's column (e.g. "menu" in the "restaurant" column,
"food" in the "cafe" column). Leave the cell empty to not use it there.
Fixing a row fixes it in every situation that uses it.

  * IDs are permanent: learning progress is saved by ID. Never reuse an ID.
    To stop using a row, clear its situation cells or set Review Status to
    "Retired"; don't delete it.
  * Japanese is written in hiragana / katakana. If kanji are needed, write
    them with readings: {予約|よやく}. (Culture tips may use the same notation.)
  * Confusable Group: rows sharing a tag (e.g. "receipt") are never shown as
    answer choices in the same question. Several tags: "receipt, payment".
  * Situations with Status "Draft" are built but not listed on the home page
    (open them with index.html?situation=<key> to test). "Hidden" is skipped.

How to update
-------------
Option A (one file): put a text export with "## Sheet name: <tab>" headers
                     followed by CSV rows in data/sheet-export.txt, then run
                         python3 tools/build_data.py
Option B (CSV per tab): in Google Sheets use File > Download > CSV for each tab,
                     put the files in one folder, then run
                         python3 tools/build_data.py path/to/folder
                     (data/sheets/ holds the current tables in this form.)

Only light, objective clean-up is done here (extra spaces). Wording is never
changed: fix wording in the Sheet. Problems are listed as notes.
"""
import csv, io, json, os, re, sys, datetime, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SRC = os.path.join(ROOT, 'data', 'sheet-export.txt')
OUT = os.path.join(ROOT, 'js', 'data.js')
TABS = ['Situations', 'Scenes', 'Vocabulary', 'Customer', 'Staff', 'Culture Tips']
ITEM_TABS = (('Vocabulary', 'vocabulary'), ('Customer', 'customer'), ('Staff', 'staff'))
KANJI = re.compile(r'[一-鿿㐀-䶿々]')
RUBY = re.compile(r'\{([^|{}]+)\|([^|{}]+)\}')
KANA = re.compile(r'^[ぁ-ゖァ-ヺー・\s]+$')
ICONS = {'utensils', 'coffee', 'clock', 'door', 'book', 'pencil', 'shield', 'alert', 'card', 'bag', 'snow',
         'cake', 'bell', 'drop', 'wifi', 'tray', 'pin', 'train', 'bed', 'store', 'plane', 'cart', 'noodles', 'fish', 'glass'}

warnings, fixes, info = [], [], []


# ---------------------------------------------------------------------------
# reading the Sheet
# ---------------------------------------------------------------------------
def read_tabs(src):
    tabs = {}
    if os.path.isdir(src):
        for name in TABS:
            for fn in os.listdir(src):
                base = os.path.splitext(fn)[0]
                if fn.lower().endswith('.csv') and (base == name or base.endswith(' - ' + name)):
                    with open(os.path.join(src, fn), encoding='utf-8-sig') as f:
                        tabs[name] = [r for r in csv.reader(f) if any(c.strip() for c in r)]
        return tabs
    text = open(src, encoding='utf-8-sig').read()
    parts = re.split(r'^## Sheet name:\s*(.+?)\s*$', text, flags=re.M)
    for i in range(1, len(parts), 2):
        rows = [r for r in csv.reader(io.StringIO(parts[i + 1].strip())) if any(c.strip() for c in r)]
        tabs[parts[i].strip()] = rows
    return tabs


def as_dicts(rows):
    head = [h.strip() for h in rows[0]]
    out = []
    for r in rows[1:]:
        r = r + [''] * (len(head) - len(r))
        out.append({h: (r[i] or '').strip() for i, h in enumerate(head)})
    return head, out


def num(s, default=99):
    m = re.search(r'\d+', s or '')
    return int(m.group()) if m else default


def clean_ja(s, ref):
    orig = s
    s = unicodedata.normalize('NFC', s).replace('　', ' ')
    s = re.sub(r'、\s+', '、', s)
    s = re.sub(r'\s{2,}', ' ', s).strip()
    if s != orig:
        fixes.append(f'{ref}: spacing "{orig}" -> "{s}"')
    check_ruby(s, ref)
    return s


def check_ruby(s, ref):
    for base, reading in RUBY.findall(s):
        if not KANA.match(reading):
            warnings.append(f'{ref}: ruby reading must be kana: {{{base}|{reading}}}')
    bare = RUBY.sub('', s)
    if KANJI.search(bare):
        warnings.append(f'{ref}: kanji without reading (write {{漢字|かんじ}}): {s}')


def clean_txt(s):
    return re.sub(r'\s{2,}', ' ', s).strip()


def plain(s):
    """Japanese as kana only: {予約|よやく} -> よやく"""
    return RUBY.sub(lambda m: m.group(2), s)


# ---------------------------------------------------------------------------
# Romaji check (reported as notes; the data itself is never changed)
# ---------------------------------------------------------------------------
_K = {}
def _add(kana, roma):
    for k, r in zip(kana.split(), roma.split()):
        _K[k] = r
_add('あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん',
     'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa o n')
_add('が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ ぁ ぃ ぅ ぇ ぉ ゔ',
     'ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po a i u e o vu')
for base, r in (('き', 'ky'), ('し', 'sh'), ('ち', 'ch'), ('に', 'ny'), ('ひ', 'hy'), ('み', 'my'), ('り', 'ry'),
                ('ぎ', 'gy'), ('じ', 'j'), ('び', 'by'), ('ぴ', 'py')):
    for small, v in (('ゃ', 'a'), ('ゅ', 'u'), ('ょ', 'o')):
        _K[base + small] = r + v
_K.update({'てぃ': 'ti', 'でぃ': 'di', 'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo', 'しぇ': 'she', 'じぇ': 'je',
           'ちぇ': 'che', 'うぃ': 'wi', 'うぇ': 'we', 'うぉ': 'wo'})


def kana_to_romaji(text):
    """Plain romaji from kana. Word-final は/へ (particles) become wa/e."""
    hira = ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in plain(text))
    words = re.split(r'[\s、。？！?!・]+', hira)
    out = []
    for w in words:
        if not w:
            continue
        r, i, dbl = '', 0, False
        while i < len(w):
            two, one = w[i:i + 2], w[i]
            if one == 'っ':
                dbl = True; i += 1; continue
            if one == 'ー':
                m = re.search(r'[aiueo]$', r)
                r += m.group() if m else ''; i += 1; continue
            if two in _K:
                syl, i = _K[two], i + 2
            elif one in _K:
                syl, i = _K[one], i + 1
            else:
                syl, i = one, i + 1
            if dbl:
                syl = ('c' if syl.startswith('ch') else syl[0]) + syl; dbl = False
            r += syl
        if r.endswith('ha') and len(r) > 2 and w.endswith('は'):
            r = r[:-2] + 'wa'
        if r.endswith('he') and len(r) > 2 and w.endswith('へ'):
            r = r[:-2] + 'e'
        out.append(r)
    return ''.join(out)


def _canon(r):
    r = unicodedata.normalize('NFC', r.lower())
    for a, b in (('ā', 'aa'), ('ī', 'ii'), ('ū', 'uu'), ('ē', 'ee'), ('ō', 'oo'), ('â', 'aa'), ('î', 'ii'), ('û', 'uu'), ('ê', 'ee'), ('ô', 'oo')):
        r = r.replace(a, b)
    r = re.sub(r"[^a-z]", '', r)
    return r.replace('ou', 'oo').replace('tch', 'cch').replace('nm', 'mm')


ENGLISH_WORDS = re.compile(r"\b(the|this|that|please|have|you|your|is|are|i'll|i'd|can|could|of|for|with)\b", re.I)


def check_item(it):
    notes = []
    ja, ro, en = it['japanese'], it['romaji'], it['english']
    has_latin = re.search(r'[A-Za-z]', ja)
    if not ro:
        notes.append('Romaji is empty')
    elif re.search(r'[぀-ヿ]', ro):
        notes.append('Romaji contains kana')
    elif not has_latin and ENGLISH_WORDS.search(ro) and _canon(kana_to_romaji(ja)) != _canon(ro):
        notes.append(f'Romaji looks like English: "{ro}" (expected about "{kana_to_romaji(ja)}")')
    elif not has_latin and _canon(kana_to_romaji(ja)) != _canon(ro):
        notes.append(f'Romaji does not match the kana: "{ro}" vs kana → "{kana_to_romaji(ja)}"')
    if re.search(r'[぀-ヿ一-鿿]', en):
        notes.append('English contains Japanese')
    if not en:
        notes.append('English is empty')
    if not re.search(r'[぀-ヿ]', ja) and not has_latin:
        notes.append('Japanese has no kana')
    return notes


# ---------------------------------------------------------------------------
# Answer-choice fairness — the same rules as js/game.js (keep them in step)
# ---------------------------------------------------------------------------
STOP = set(('please the a an i you we my your this these that is it its do does can could may would will to of for be '
            'have has some any me us our here there are am at in on with get just one').split())


def tokens(s):
    out = set()
    for x in re.findall(r"[a-z0-9']+", s.lower().replace('’', "'")):
        if x.endswith("n't"):
            out.add('not'); x = x[:-3]
        x = re.sub(r"'(s|ll|d|re|m)$", '', x)
        if len(x) < 2 or x in STOP:
            continue
        if len(x) > 3 and x.endswith('s') and not x.endswith('ss'):
            x = x[:-1]
        out.add(x)
    return out


def similar_english(a, b):
    if a.lower() == b.lower():
        return True
    A, B = tokens(a), tokens(b)
    if not A or not B:
        return False
    inter = len(A & B)
    if inter / len(A | B) >= 0.75:
        return True
    return (A <= B or B <= A) and min(len(A), len(B)) <= 2


def jnorm(s):
    return re.sub(r'[\s。、？！?!・「」（）()〜…,.]', '', plain(s))


def similar_japanese(a, b):
    a, b = jnorm(a), jnorm(b)
    if a == b:
        return True
    s, l = (a, b) if len(a) <= len(b) else (b, a)
    return len(s) >= 2 and s in l


def clash(x, y):
    return bool(set(x['cg']) & set(y['cg'])) or similar_english(x['english'], y['english']) or \
        similar_japanese(x['japanese'], y['japanese'])


# ---------------------------------------------------------------------------
def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    src = args[0] if args else DEFAULT_SRC
    tabs = read_tabs(src)
    missing = [t for t in TABS if t not in tabs]
    if missing:
        sys.exit('Missing tabs: ' + ', '.join(missing) + '\n(The old Restaurant-only layout with a "Settings" tab is no longer used — see README.)')

    # ---- situations ----
    situations, sit_keys = [], []
    for r in as_dicts(tabs['Situations'])[1]:
        key = r.get('Situation Key', '').lower()
        if not key:
            continue
        status = (r.get('Status') or 'Published').strip().lower()
        if status == 'hidden':
            continue
        if key in sit_keys:
            warnings.append(f'Situations: duplicate key "{key}" ignored'); continue
        icon = r.get('Icon') or 'pin'
        if icon not in ICONS:
            warnings.append(f'Situations: unknown icon "{icon}" for {key} (use one of: {", ".join(sorted(ICONS))})')
        sit_keys.append(key)
        situations.append({'key': key, 'name': r.get('English Name') or key, 'ja': r.get('Japanese Label', ''),
                           'icon': icon, 'order': num(r.get('Display Order')), 'published': status == 'published', 'scenes': []})
    situations.sort(key=lambda s: s['order'])
    by_sit = {s['key']: s for s in situations}

    # ---- scenes ----
    for r in as_dicts(tabs['Scenes'])[1]:
        sit, key = r.get('Situation', '').lower(), r.get('Scene Key', '')
        if not sit or not key or sit not in by_sit:
            if sit and sit not in by_sit:
                info.append(f'Scenes: "{sit}/{key}" skipped (situation hidden or unknown)')
            continue
        if any(s['key'] == key for s in by_sit[sit]['scenes']):
            fixes.append(f'Scenes: duplicate row for "{sit}/{key}" ignored'); continue
        icon = r.get('Icon') or 'pin'
        if icon not in ICONS:
            warnings.append(f'Scenes: unknown icon "{icon}" for {sit}/{key}')
        check_ruby(r.get('Japanese Label', ''), f'Scenes {sit}/{key}')
        by_sit[sit]['scenes'].append({'key': key, 'name': r.get('English Label') or key, 'ja': r.get('Japanese Label', ''),
                                      'icon': icon, 'order': num(r.get('Display Order'))})
    for s in situations:
        s['scenes'].sort(key=lambda x: x['order'])
        if not s['scenes']:
            warnings.append(f'{s["key"]}: no scenes in the Scenes tab')

    def uses_of(row, ref):
        uses = {}
        for key in sit_keys:
            col = next((h for h in row if h.strip().lower() == key), None)
            val = (row.get(col) or '').strip() if col else ''
            if not val:
                continue
            if not any(sc['key'] == val for sc in by_sit[key]['scenes']):
                warnings.append(f'{ref}: unknown scene "{val}" in column "{key}"'); continue
            uses[key] = val
        return uses

    # ---- items ----
    items, ids, unused = [], {}, 0
    for tab, group in ITEM_TABS:
        head, rows = as_dicts(tabs[tab])
        for col in sit_keys:
            if not any(h.lower() == col for h in head):
                info.append(f'{tab}: no column for situation "{col}" yet')
        for r in rows:
            iid = r.get('ID', '')
            if not iid:
                continue
            if iid in ids:
                warnings.append(f'{iid}: duplicate ID in {tab} (first in {ids[iid]}) — skipped'); continue
            ids[iid] = tab
            if (r.get('Review Status') or '').lower() == 'retired':
                continue
            uses = uses_of(r, iid)
            if not uses:
                unused += 1; continue
            items.append({
                'id': iid, 'group': group, 'type': 'word' if group == 'vocabulary' else 'phrase',
                'japanese': clean_ja(r.get('Japanese', ''), iid),
                'romaji': clean_txt(r.get('Romaji', '')),
                'english': clean_txt(r.get('English', '')),
                'audio': r.get('Audio', '').strip() or None,
                'cg': [x.strip() for x in re.split(r'[,;]', r.get('Confusable Group', '')) if x.strip()],
                'uses': uses,
            })

    # ---- culture tips ----
    tips = []
    for r in as_dicts(tabs['Culture Tips'])[1]:
        if not r.get('ID') or (r.get('Review Status') or '').lower() == 'retired':
            continue
        uses = uses_of(r, r['ID'])
        if not uses:
            continue
        text = clean_txt(r.get('Culture Tip (English)', ''))
        check_ruby(text, r['ID'])
        rel = [x.strip() for x in re.split(r'[,\s]+', r.get('Related Phrase IDs', '')) if x.strip()]
        tips.append({'id': r['ID'], 'topic': r.get('Topic', ''), 'text': text, 'related': rel,
                     'url': r.get('Article URL') or None, 'uses': uses})

    # ---- checks ----
    for it in items:
        for n in check_item(it):
            warnings.append(f"{it['id']}: {n}")
    for s in situations:
        mine = [it for it in items if s['key'] in it['uses']]
        s['count'] = len(mine)
        for field, label in (('english', 'English'), ('japanese', 'Japanese')):
            seen = {}
            for it in mine:
                seen.setdefault(jnorm(it[field]) if field == 'japanese' else it[field].lower(), []).append(it['id'])
            for k, g in seen.items():
                if len(g) > 1:
                    warnings.append(f'{s["key"]}: same {label} used by {", ".join(g)} — learners cannot tell them apart')
        # every question needs 3 wrong choices of the same kind that can't be mistaken for the answer
        for it in mine:
            same = [o for o in mine if o is not it and o['type'] == it['type'] and not clash(it, o)]
            if len(same) < 3:
                warnings.append(f'{s["key"]}: {it["id"]} has only {len(same)} safe answer choices of the same kind')
        # pairs that are not blocked but look close: worth a human look
        for i, a in enumerate(mine):
            for b in mine[i + 1:]:
                if a['type'] != b['type'] or clash(a, b):
                    continue
                A, B = tokens(a['english']), tokens(b['english'])
                if A and B and len(A & B) / len(A | B) >= 0.5:
                    info.append(f'{s["key"]}: check {a["id"]} "{a["english"]}" / {b["id"]} "{b["english"]}" (add a Confusable Group if they could both look right)')

    data = {
        'source': 'Sakura Japanese | Travel Japanese Phrase Bank (Google Sheet)',
        'generated': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        'situations': situations, 'items': items, 'tips': tips,
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('/* GENERATED by tools/build_data.py from the Google Sheet. Do not edit by hand:\n'
                '   change the Sheet, export it, and run the tool again. */\n')
        f.write('window.RVR_DATA = {\n')
        f.write(' "source": ' + json.dumps(data['source'], ensure_ascii=False) + ',\n')
        f.write(' "generated": ' + json.dumps(data['generated']) + ',\n')
        f.write(' "situations": ' + json.dumps(situations, ensure_ascii=False, indent=1).replace('\n', '\n ') + ',\n')
        for key in ('items', 'tips'):
            f.write(f' "{key}": [\n' + ',\n'.join('  ' + json.dumps(x, ensure_ascii=False) for x in data[key]) + '\n ]' + (',' if key == 'items' else '') + '\n')
        f.write('};\n')

    print(f'Wrote {os.path.relpath(OUT, ROOT)}: {len(situations)} situations, {len(items)} items in use '
          f'({unused} rows not used in any situation), {len(tips)} tips')
    for s in situations:
        print(f"  {s['key']} ({'published' if s['published'] else 'draft — not on the home page'})")
        for sc in s['scenes']:
            n = {g: sum(1 for i in items if i['uses'].get(s['key']) == sc['key'] and i['group'] == g) for g in ('vocabulary', 'customer', 'staff')}
            t = sum(1 for x in tips if x['uses'].get(s['key']) == sc['key'])
            print(f"    {sc['order']:02d} {sc['key']:<12} vocab {n['vocabulary']:>2}  customer {n['customer']:>2}  staff {n['staff']:>2}  tips {t}")
    for x in fixes:
        print('  fixed:', x)
    for w in warnings:
        print('  NOTE: ', w)
    if '--verbose' in sys.argv or '-v' in sys.argv:
        for x in info:
            print('  info: ', x)
    elif info:
        print(f'  ({len(info)} more hints: run with --verbose to see them)')


if __name__ == '__main__':
    main()
