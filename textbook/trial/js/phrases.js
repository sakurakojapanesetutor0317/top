/* Sakura Japanese — phrase list shared by all four games.
   audio: number N  -> audio/trial_NN.mp3 (only the 20 existing recordings, 1–20)
          null      -> no recording; the phrase is still used, just without a play button.
   NOTE: The text of each recording is taken from the original Listening Lab table and has
   not been checked by listening. If a file says something different, fix it here only. */
window.PHRASES = [
  // ---------- Greetings ----------
  { id: 'ohayou', cat: 'greetings', jp: 'おはようございます', ro: 'ohayou gozaimasu', en: 'Good morning', audio: 1, img: 'images/scenes/sky_morning.jpg', note: 'Morning — until about 10 AM. (A rough guide, not a strict rule.)' },
  { id: 'konnichiwa', cat: 'greetings', jp: 'こんにちは', ro: 'konnichiwa', en: 'Hello / Good afternoon', audio: 2, img: 'images/scenes/sky_daytime.jpg', note: 'Daytime — from about 10 AM. The last は is read “wa”.' },
  { id: 'konbanwa', cat: 'greetings', jp: 'こんばんは', ro: 'konbanwa', en: 'Good evening', audio: 3, img: 'images/scenes/sky_evening.jpg', note: 'Evening — from about 5–6 PM.' },
  { id: 'hajimemashite', cat: 'greetings', jp: 'はじめまして', ro: 'hajimemashite', en: 'Nice to meet you', audio: 4, img: null, note: 'Only the first time you meet someone.' },
  { id: 'yoroshiku', cat: 'greetings', jp: 'よろしく おねがいします', ro: 'yoroshiku onegaishimasu', en: 'Nice to meet you (I look forward to it)', audio: null, img: null, note: 'A set phrase at the end of a self-introduction.' },
  { id: 'arigatou_masu', cat: 'greetings', jp: 'ありがとうございます', ro: 'arigatou gozaimasu', en: 'Thank you', audio: null, img: 'images/icons/02_thank_you.png', note: 'For something happening now: a gift, a coffee, help…' },
  { id: 'arigatou_mashita', cat: 'greetings', jp: 'ありがとうございました', ro: 'arigatou gozaimashita', en: 'Thank you (for something finished)', audio: 5, img: 'images/icons/02_thank_you.png', note: 'At the end of a lesson, or when you leave a shop.' },
  { id: 'arigatou', cat: 'greetings', jp: 'ありがとう', ro: 'arigatou', en: 'Thanks', audio: null, img: 'images/icons/02_thank_you.png', note: 'Short and friendly — use it with friends.' },
  { id: 'sumimasen', cat: 'greetings', jp: 'すみません', ro: 'sumimasen', en: 'Excuse me / Sorry / Thank you', audio: null, img: 'images/scenes/sumimasen_bow.png', note: 'Calling a waiter, a small mistake, or when someone holds the door for you.' },
  { id: 'douzo', cat: 'greetings', jp: 'どうぞ', ro: 'douzo', en: 'Go ahead / Please', audio: null, img: 'images/scenes/sumimasen_door.png', note: 'Holding a door, offering a seat, or handing something to someone.' },
  { id: 'matane', cat: 'greetings', jp: 'またね', ro: 'mata ne', en: 'See you!', audio: null, img: null, note: 'Friends & family. The most common casual goodbye.' },
  { id: 'jaamata', cat: 'greetings', jp: 'じゃあ、また', ro: 'jaa, mata', en: 'Well, see you.', audio: null, img: null, note: 'Friends & coworkers. Simple and natural.' },
  { id: 'mataashita', cat: 'greetings', jp: 'またあした', ro: 'mata ashita', en: 'See you tomorrow', audio: null, img: null, note: 'When you will meet again tomorrow.' },
  { id: 'sayounara', cat: 'greetings', jp: 'さようなら', ro: 'sayounara', en: 'Goodbye', audio: null, img: null, note: 'Formal, or a long goodbye. Students say it to teachers at school — with friends every day it sounds distant.' },

  // ---------- How are you? ----------
  { id: 'ogenki', cat: 'genki', jp: 'おげんきですか', ro: 'ogenki desu ka', en: 'How are you?', audio: 16, img: null, note: 'For someone you haven’t seen for a while.' },
  { id: 'genki', cat: 'genki', jp: 'げんきです', ro: 'genki desu', en: 'I’m fine.', audio: 6, img: 'images/icons/12_happy.png' },
  { id: 'maamaa', cat: 'genki', jp: 'まあまあです', ro: 'maamaa desu', en: 'So-so.', audio: 7, img: 'images/icons/09_uncertain.png' },
  { id: 'yokunai', cat: 'genki', jp: 'よくないです', ro: 'yokunai desu', en: 'Not good.', audio: null, img: 'images/icons/13_sad.png' },
  { id: 'byouki', cat: 'genki', jp: 'びょうきです', ro: 'byouki desu', en: 'I’m sick.', audio: null, img: 'images/icons/11_sick.png' },
  { id: 'anatawa', cat: 'genki', jp: 'あなたは？', ro: 'anata wa?', en: 'And you?', audio: null, img: null, note: 'Japanese people often use the name instead: ミカさんは？ (Mika-san wa?)' },

  // ---------- Feelings ----------
  { id: 'tanoshii', cat: 'feelings', jp: 'たのしいです', ro: 'tanoshii desu', en: 'It’s fun!', audio: null, img: 'images/icons/07_celebration.png' },
  { id: 'ureshii', cat: 'feelings', jp: 'うれしいです', ro: 'ureshii desu', en: 'I’m happy / glad!', audio: 8, img: 'images/icons/06_love.png' },
  { id: 'omoshiroi', cat: 'feelings', jp: 'おもしろいです', ro: 'omoshiroi desu', en: 'It’s funny / interesting!', audio: null, img: 'images/scenes/funny_tv.jpg' },
  { id: 'kandou', cat: 'feelings', jp: 'かんどうしました', ro: 'kandou shimashita', en: 'I was moved!', audio: null, img: 'images/icons/17_fireworks.png', note: 'A great movie, fireworks, a concert…' },
  { id: 'kirei', cat: 'feelings', jp: 'きれいです', ro: 'kirei desu', en: 'It’s beautiful!', audio: null, img: 'images/icons/04_cherry_blossom.png' },
  { id: 'kawaii', cat: 'feelings', jp: 'かわいいです', ro: 'kawaii desu', en: 'It’s cute!', audio: 9, img: 'images/icons/10_dog.png' },
  { id: 'iidesune', cat: 'feelings', jp: 'いいですね', ro: 'ii desu ne', en: 'Nice! / Sounds good!', audio: null, img: 'images/icons/15_thumbs_up.png' },
  { id: 'kowai', cat: 'feelings', jp: 'こわいです', ro: 'kowai desu', en: 'It’s scary!', audio: 10, img: 'images/icons/14_worried.png' },

  // ---------- Likes ----------
  { id: 'nekogasuki', cat: 'likes', jp: 'ねこが すきです', ro: 'neko ga suki desu', en: 'I like cats.', audio: 20, img: 'images/icons/11_cat.png', note: '＿＿が すきです = I like ＿＿.' },
  { id: 'inu', cat: 'likes', jp: 'いぬ', ro: 'inu', en: 'dog', audio: null, img: 'images/icons/10_dog.png' },
  { id: 'neko', cat: 'likes', jp: 'ねこ', ro: 'neko', en: 'cat', audio: null, img: 'images/icons/11_cat.png' },
  { id: 'sushi', cat: 'likes', jp: 'すし', ro: 'sushi', en: 'sushi', audio: null, img: 'images/icons/12_sushi.png' },
  { id: 'raamen', cat: 'likes', jp: 'ラーメン', ro: 'raamen', en: 'ramen', audio: null, img: 'images/icons/13_ramen.png' },
  { id: 'fujisan', cat: 'likes', jp: 'ふじさん', ro: 'Fujisan', en: 'Mt. Fuji', audio: null, img: 'images/icons/16_fuji_sakura.png' },
  { id: 'hanabi', cat: 'likes', jp: 'はなび', ro: 'hanabi', en: 'fireworks', audio: null, img: 'images/icons/17_fireworks.png' },
  { id: 'nigate', cat: 'likes', jp: 'にがてです', ro: 'nigate desu', en: 'It’s not my thing.', audio: null, img: null, note: 'A soft way to say you don’t like something.' },

  // ---------- Weather & seasons ----------
  { id: 'tenki', cat: 'weather', jp: 'てんきは どうですか', ro: 'tenki wa dou desu ka', en: 'How’s the weather?', audio: null, img: null, note: 'どうですか = How is it?' },
  { id: 'hare', cat: 'weather', jp: 'はれです', ro: 'hare desu', en: 'It’s sunny.', audio: 11, img: 'images/icons/01_sunny.png' },
  { id: 'kumori', cat: 'weather', jp: 'くもりです', ro: 'kumori desu', en: 'It’s cloudy.', audio: 12, img: 'images/icons/02_partly_cloudy.png' },
  { id: 'ame', cat: 'weather', jp: 'あめです', ro: 'ame desu', en: 'It’s rainy.', audio: 13, img: 'images/icons/03_rainy.png' },
  { id: 'yuki', cat: 'weather', jp: 'ゆきです', ro: 'yuki desu', en: 'It’s snowy.', audio: null, img: 'images/icons/04_snowy.png' },
  { id: 'kaze', cat: 'weather', jp: 'かぜが つよいです', ro: 'kaze ga tsuyoi desu', en: 'It’s windy.', audio: null, img: 'images/icons/05_windy.png' },
  { id: 'atatakai', cat: 'weather', jp: 'あたたかいです', ro: 'atatakai desu', en: 'It’s warm.', audio: null, img: 'images/icons/04_cherry_blossom.png', note: 'Spring — はる (haru)' },
  { id: 'atsui', cat: 'weather', jp: 'きょうは あついです', ro: 'kyou wa atsui desu', en: 'It’s hot today.', audio: 14, img: 'images/icons/05_beach.png', note: 'Summer — なつ (natsu). きょう = today' },
  { id: 'suzushii', cat: 'weather', jp: 'すずしいです', ro: 'suzushii desu', en: 'It’s cool.', audio: null, img: 'images/icons/06_autumn_leaves.png', note: 'Autumn — あき (aki)' },
  { id: 'samui', cat: 'weather', jp: 'きょうは さむいです', ro: 'kyou wa samui desu', en: 'It’s cold today.', audio: 15, img: 'images/icons/09_snowy_trees.png', note: 'Winter — ふゆ (fuyu). きょう = today' },

  // ---------- Days ----------
  { id: 'getsu', cat: 'days', jp: 'げつようび', ro: 'getsuyoubi', en: 'Monday', audio: null, img: 'images/days/mon.png', note: '月曜日 — 月 = moon (the Moon)' },
  { id: 'ka', cat: 'days', jp: 'かようび', ro: 'kayoubi', en: 'Tuesday', audio: null, img: 'images/days/tue.png', note: '火曜日 — 火 = fire (Mars)' },
  { id: 'sui', cat: 'days', jp: 'すいようび', ro: 'suiyoubi', en: 'Wednesday', audio: null, img: 'images/days/wed.png', note: '水曜日 — 水 = water (Mercury)' },
  { id: 'moku', cat: 'days', jp: 'もくようび', ro: 'mokuyoubi', en: 'Thursday', audio: null, img: 'images/days/thu.png', note: '木曜日 — 木 = tree (Jupiter)' },
  { id: 'kin', cat: 'days', jp: 'きんようび', ro: 'kin’youbi', en: 'Friday', audio: null, img: 'images/days/fri.png', note: '金曜日 — 金 = gold (Venus)' },
  { id: 'do', cat: 'days', jp: 'どようび', ro: 'doyoubi', en: 'Saturday', audio: null, img: 'images/days/sat.png', note: '土曜日 — 土 = soil (Saturn)' },
  { id: 'nichi', cat: 'days', jp: 'にちようび', ro: 'nichiyoubi', en: 'Sunday', audio: null, img: 'images/days/sun.png', note: '日曜日 — 日 = sun (the Sun)' },
  { id: 'kyousui', cat: 'days', jp: 'きょうは すいようびです', ro: 'kyou wa suiyoubi desu', en: 'Today is Wednesday.', audio: null, img: 'images/days/wed.png' },

  // ---------- Questions ----------
  { id: 'nandesuka', cat: 'questions', jp: 'これは なんですか', ro: 'kore wa nan desu ka', en: 'What is this?', audio: null, img: 'images/scenes/what_sign.jpg' },
  { id: 'doko', cat: 'questions', jp: 'トイレは どこですか', ro: 'toire wa doko desu ka', en: 'Where is the restroom?', audio: 17, img: 'images/icons/03_toilet.png' },
  { id: 'ikura', cat: 'questions', jp: 'これは いくらですか', ro: 'kore wa ikura desu ka', en: 'How much is this?', audio: 18, img: 'images/scenes/howmuch_bento.jpg' },
  { id: 'shashinii', cat: 'questions', jp: 'しゃしん、いいですか', ro: 'shashin, ii desu ka', en: 'May I take a photo?', audio: 19, img: 'images/icons/01_camera.png' },
  { id: 'iidesuyo', cat: 'questions', jp: 'いいですよ', ro: 'ii desu yo', en: 'Sure!', audio: null, img: 'images/icons/15_thumbs_up.png', note: 'A friendly “yes” when someone asks いいですか.' },
  { id: 'shashinonegai', cat: 'questions', jp: 'しゃしん、おねがいします', ro: 'shashin, onegaishimasu', en: 'Could you take a photo (of me), please?', audio: null, img: 'images/icons/16_fuji_sakura.png' },
  { id: 'koohii', cat: 'questions', jp: 'コーヒー、おねがいします', ro: 'koohii, onegaishimasu', en: 'Coffee, please.', audio: null, img: null, note: '＿＿、おねがいします = ＿＿, please.' }
];

window.CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'greetings', label: 'Greetings' },
  { id: 'genki', label: 'How are you?' },
  { id: 'feelings', label: 'Feelings' },
  { id: 'likes', label: 'Likes' },
  { id: 'weather', label: 'Weather & seasons' },
  { id: 'days', label: 'Days' },
  { id: 'questions', label: 'Questions' }
];

window.PH = {};
window.PHRASES.forEach(function (p) { window.PH[p.id] = p; });
