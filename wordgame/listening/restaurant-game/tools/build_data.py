#!/usr/bin/env python3
"""
Restaurant Vocabulary Rush — build js/data.js from the Google Sheet
=====================================================================
The Google Sheet "Sakura Japanese | Restaurant Japanese Phrase Bank" is the
source of truth. js/data.js is generated output: do not edit it by hand.

How to update
-------------
Option A (one file): put a text export with "## Sheet name: <tab>" headers
                     followed by CSV rows in data/sheet-export.txt, then run
                         python3 tools/build_data.py
Option B (CSV per tab): in Google Sheets use File > Download > CSV for each tab
                     (Customer, Staff, Vocabulary, Culture Tips, Settings),
                     put the files in one folder, then run
                         python3 tools/build_data.py path/to/folder

Only light, objective clean-up is done here (extra spaces, a space after "、",
duplicate Settings rows). Wording is never changed: fix wording in the Sheet.
"""
import csv, io, json, os, re, sys, datetime, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SRC = os.path.join(ROOT, 'data', 'sheet-export.txt')
OUT = os.path.join(ROOT, 'js', 'data.js')
TABS = ['Customer', 'Staff', 'Vocabulary', 'Culture Tips', 'Settings']
KANJI = re.compile(r'[一-鿿㐀-䶿]')

warnings = []
fixes = []


def read_tabs(src):
    tabs = {}
    if os.path.isdir(src):
        for name in TABS:
            for fn in os.listdir(src):
                base = os.path.splitext(fn)[0]
                if fn.lower().endswith('.csv') and (base == name or base.endswith(' - ' + name)):
                    with open(os.path.join(src, fn), encoding='utf-8-sig') as f:
                        tabs[name] = list(csv.reader(f))
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
    return out


def clean_ja(s, ref):
    orig = s
    s = unicodedata.normalize('NFC', s).replace('　', ' ')
    s = re.sub(r'、\s+', '、', s)
    s = re.sub(r'\s{2,}', ' ', s).strip()
    if s != orig:
        fixes.append(f'{ref}: spacing "{orig}" -> "{s}"')
    if KANJI.search(s):
        warnings.append(f'{ref}: contains kanji (beginner prompts should be kana only): {s}')
    return s


def clean_txt(s):
    return re.sub(r'\s{2,}', ' ', s).strip()



# ---------------------------------------------------------------------------
# Consistency checks: does the Romaji match the kana? does each column hold
# the right language? (Reported as notes; the data itself is never changed.)
# ---------------------------------------------------------------------------
_K = {}
def _add(kana, roma):
    for k, r in zip(kana.split(), roma.split()):
        _K[k] = r
_add('あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん',
     'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa o n')
_add('が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ ぁ ぃ ぅ ぇ ぉ',
     'ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po a i u e o')
for base, r in (('き', 'ky'), ('し', 'sh'), ('ち', 'ch'), ('に', 'ny'), ('ひ', 'hy'), ('み', 'my'), ('り', 'ry'),
                ('ぎ', 'gy'), ('じ', 'j'), ('び', 'by'), ('ぴ', 'py')):
    for small, v in (('ゃ', 'a'), ('ゅ', 'u'), ('ょ', 'o')):
        _K[base + small] = r + v
_K.update({'てぃ': 'ti', 'でぃ': 'di', 'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo', 'しぇ': 'she', 'じぇ': 'je', 'ちぇ': 'che'})

def kana_to_romaji(text):
    """Plain romaji from kana. Word-final は/へ (particles) become wa/e."""
    hira = ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in text)
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
    r = (r.replace('ā', 'aa').replace('ī', 'ii').replace('ū', 'uu').replace('ē', 'ee').replace('ō', 'oo')
          .replace('â', 'aa').replace('î', 'ii').replace('û', 'uu').replace('ê', 'ee').replace('ô', 'oo'))
    r = re.sub(r"[^a-z]", '', r)
    return r.replace('ou', 'oo').replace('tch', 'cch')

ENGLISH_WORDS = re.compile(r"\b(the|this|that|please|have|you|your|is|are|i'll|i'd|can|could|of|for|with)\b", re.I)

def check_item(it):
    notes = []
    ja, ro, en = it['japanese'], it['romaji'], it['english']
    if not ro:
        notes.append('Romaji is empty')
    elif re.search(r'[぀-ヿ]', ro):
        notes.append('Romaji contains kana')
    elif ENGLISH_WORDS.search(ro) and _canon(kana_to_romaji(ja)) != _canon(ro):
        notes.append(f'Romaji looks like English: "{ro}" (expected about "{kana_to_romaji(ja)}")')
    elif _canon(kana_to_romaji(ja)) != _canon(ro):
        notes.append(f'Romaji does not match the kana: "{ro}" vs kana → "{kana_to_romaji(ja)}"')
    if re.search(r'[぀-ヿ一-鿿]', en):
        notes.append('English contains Japanese')
    if not en:
        notes.append('English is empty')
    if not re.search(r'[぀-ヿ]', ja):
        notes.append('Japanese has no kana')
    return notes


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    tabs = read_tabs(src)
    missing = [t for t in TABS if t not in tabs]
    if missing:
        sys.exit('Missing tabs: ' + ', '.join(missing))

    # ---- scenes (Settings) ----
    scenes, seen_scene = [], set()
    for r in as_dicts(tabs['Settings']):
        key = r.get('Scene Key', '')
        if not key:
            continue
        if key in seen_scene:
            fixes.append(f'Settings: duplicate row for "{key}" ignored')
            continue
        seen_scene.add(key)
        m = re.search(r'\d+', r.get('Display Order', ''))
        scenes.append({'key': key, 'ja': r.get('Japanese Label', ''), 'order': int(m.group()) if m else 99})
    scenes.sort(key=lambda s: s['order'])
    scene_keys = {s['key'] for s in scenes}

    # ---- items ----
    items, ids = [], set()
    for tab, group in (('Vocabulary', 'vocabulary'), ('Customer', 'customer'), ('Staff', 'staff')):
        for r in as_dicts(tabs[tab]):
            iid = r.get('ID', '')
            if not iid:
                continue
            if iid in ids:
                warnings.append(f'{iid}: duplicate ID skipped')
                continue
            ids.add(iid)
            if r['Scene'] not in scene_keys:
                warnings.append(f'{iid}: unknown scene "{r["Scene"]}"')
            audio = r.get('Audio', '').strip() or None
            items.append({
                'id': iid,
                'scene': r['Scene'],
                'group': group,                                   # vocabulary | customer | staff
                'type': (r.get('Type') or ('word' if group == 'vocabulary' else 'phrase')).lower(),
                'speaker': (r.get('Speaker') or ('' if group == 'vocabulary' else group)).lower() or None,
                'japanese': clean_ja(r['Japanese'], iid),
                'romaji': clean_txt(r.get('Romaji', '')),
                'english': clean_txt(r.get('English', '')),
                'audio': audio,
                'tip': r.get('Culture Tip ID') or None,
                'status': r.get('Review Status') or None,
            })

    # ---- culture tips ----
    tips = []
    for r in as_dicts(tabs['Culture Tips']):
        if not r.get('ID'):
            continue
        rel = [x.strip() for x in re.split(r'[,\s]+', r.get('Related Phrase IDs', '')) if x.strip()]
        tips.append({'id': r['ID'], 'scene': r.get('Scene', ''), 'topic': r.get('Topic', ''),
                     'text': clean_txt(r.get('Culture Tip (English)', '')), 'related': rel,
                     'url': r.get('Article URL') or None})

    # ---- checks ----
    for it in items:
        for n in check_item(it):
            warnings.append(f"{it['id']}: {n}")
    by_scene_en = {}
    for it in items:
        k = (it['scene'], it['english'].lower())
        by_scene_en.setdefault(k, []).append(it['id'])
    for (sc, en), group in by_scene_en.items():
        if len(group) > 1:
            warnings.append(f'{sc}: same English "{en}" used by {", ".join(group)} (never shown together as choices)')

    data = {
        'source': 'Sakura Japanese | Restaurant Japanese Phrase Bank (Google Sheet)',
        'generated': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        'scenes': scenes, 'items': items, 'tips': tips,
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('/* GENERATED by tools/build_data.py from the Google Sheet. Do not edit by hand:\n'
                '   change the Sheet, export it, and run the tool again. */\n')
        f.write('window.RVR_DATA = ')
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write(';\n')

    print(f'Wrote {os.path.relpath(OUT, ROOT)}: {len(scenes)} scenes, {len(items)} items, {len(tips)} tips')
    for s in scenes:
        n = {g: sum(1 for i in items if i['scene'] == s['key'] and i['group'] == g) for g in ('vocabulary', 'customer', 'staff')}
        print(f"  {s['order']:02d} {s['key']:<12} vocab {n['vocabulary']:>2}  customer {n['customer']:>2}  staff {n['staff']:>2}")
    for x in fixes:
        print('  fixed:', x)
    for w in warnings:
        print('  note: ', w)


if __name__ == '__main__':
    main()
