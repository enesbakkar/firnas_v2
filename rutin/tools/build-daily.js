// Builds rutin/daily.js: verses (Uthmani text, Diyanet TR, Saheeh EN, Ibn Kathir Arabic excerpt)
// from api.quran.com and short hadiths from al-Nawawi's Forty (ara/eng/tur) via fawazahmed0/hadith-api.
// Usage (from the repo root): node rutin/tools/build-daily.js rutin/daily.js [--dry]
const fs = require('fs');
const OUT = process.argv[2];
const DRY = process.argv.includes('--dry');

// 65:2-3 are left out: Diyanet translates them as one passage, so 65:3 alone reads wrong.
const VERSES = [
  '94:5', '93:3', '53:39', '11:115', '13:28', '14:7', '40:60', '2:153', '2:152', '2:186',
  '3:139', '29:69', '39:53', '20:114', '33:41', '2:45', '16:97', '50:16', '3:200', '18:46',
  '23:1', '103:3', '87:14', '7:56', '25:63', '31:17', '64:16', '59:18', '21:87', '2:155',
  '3:8', '2:201', '6:162', '9:51', '94:6', '17:80', '20:25', '28:24'
];
const MAX_VERSE_AR = 330;
const TAFSIR_MIN = 140, TAFSIR_MAX = 420;
const MAX_HADITH_AR = 520;

const TR_SURAH = { 2: 'Bakara', 3: 'Âl-i İmrân', 6: "En'âm", 7: "A'râf", 9: 'Tevbe', 11: 'Hûd', 13: "Ra'd", 14: 'İbrâhîm',
  16: 'Nahl', 17: 'İsrâ', 18: 'Kehf', 20: 'Tâhâ', 21: 'Enbiyâ', 23: "Mü'minûn", 25: 'Furkân', 28: 'Kasas', 29: 'Ankebût',
  31: 'Lokmân', 33: 'Ahzâb', 39: 'Zümer', 40: "Mü'min", 50: 'Kâf', 53: 'Necm', 59: 'Haşr', 64: 'Teğâbün', 87: "A'lâ",
  93: 'Duhâ', 94: 'İnşirâh', 103: 'Asr' };
const SURAH_EN = {}; const SURAH_AR = {};

async function json(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 800));
  }
  throw new Error('fetch failed ' + url);
}

const strip = html => html
  .replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

// Arabic without diacritics and letter variants, to check that an excerpt is about the verse.
const bare = t => t.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
  .replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
function mentionsVerse(tafsir, arabic) {
  const words = bare(arabic).split(/\s+/).filter(w => w.length >= 4);
  const t = bare(tafsir);
  return words.filter(w => t.includes(w)).length >= Math.min(2, words.length);
}

function fromVerseQuote(text, arabic) {
  const words = bare(arabic).split(/s+/).filter(w => w.length >= 4);
  for (let i = text.indexOf('('); i >= 0; i = text.indexOf('(', i + 1)) {
    const near = bare(text.slice(i, i + 70));
    if (words.some(w => near.includes(w))) {
      // keep a lead-in such as "وقوله :" or "ثم قال :" that introduces the quote, from a word boundary
      const pre = text.slice(Math.max(0, i - 30), i);
      const m = pre.match(/(?:^|s)((?:S+s+)?(?:قوله|قال)(?:s+تعالى)?s*:?s*)$/);
      return text.slice(m ? i - m[1].length : i).trim();
    }
  }
  return text;
}

// First sentence(s) of the tafsir, cut at a sentence end, never mid-word.
function excerpt(text) {
  if (text.length <= TAFSIR_MAX) return text;
  const ends = [];
  for (let i = TAFSIR_MIN; i < Math.min(text.length, TAFSIR_MAX); i++) {
    if ('.؟!'.includes(text[i]) && (text[i + 1] === ' ' || i + 1 === text.length)) ends.push(i);
  }
  if (ends.length) return text.slice(0, ends[ends.length - 1] + 1).trim() + ' …';
  const cut = text.slice(0, TAFSIR_MAX);
  return cut.slice(0, cut.lastIndexOf(' ')).trim() + ' …';
}

// "body [source] , [source]" -> { body, source }
function splitSource(text) {
  const m = text.match(/(?:\s*[,،]?\s*\[[^\]]+\])+\s*\.?\s*$/);
  if (!m) return { body: text.trim(), source: '' };
  const source = [...m[0].matchAll(/\[([^\]]+)\]/g)].map(x => x[1].trim()).join(' · ');
  return { body: text.slice(0, m.index).trim(), source };
}

async function chapters() {
  const en = await json('https://api.quran.com/api/v4/chapters?language=en');
  en.chapters.forEach(c => { SURAH_EN[c.id] = c.name_simple; SURAH_AR[c.id] = c.name_arabic; });
}

async function verse(key) {
  const v = await json(`https://api.quran.com/api/v4/verses/by_key/${key}?translations=77,20&fields=text_uthmani`);
  const tr = v.verse.translations.find(t => t.resource_id === 77);
  const en = v.verse.translations.find(t => t.resource_id === 20);
  const tafsirRes = await json(`https://api.quran.com/api/v4/tafsirs/14/by_ayah/${key}`);
  const tafsir = strip(tafsirRes.tafsir.text || '');
  const [s, a] = key.split(':').map(Number);
  return {
    key,
    arabic: v.verse.text_uthmani,
    tr: strip(tr ? tr.text : ''),
    en: strip(en ? en.text : ''),
    // The source sometimes starts mid-word (e.g. "م قال"); drop a lone leading letter.
    tafsir: excerpt(fromVerseQuote(tafsir, v.verse.text_uthmani).replace(/^\S\s+/, '')),
    source_tr: `${TR_SURAH[s] || SURAH_EN[s]} Sûresi, ${a}. âyet`,
    source_en: `Surah ${SURAH_EN[s]}, ${s}:${a}`,
    source_ar: `سورة ${SURAH_AR[s]}، الآية ${a}`
  };
}

async function hadiths() {
  const base = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
  const [ar, en, tr] = await Promise.all(['ara-nawawi', 'eng-nawawi', 'tur-nawawi'].map(e => json(`${base}/${e}.min.json`)));
  // Some texts carry <br> and other markup; keep plain text only.
  const byNo = ed => Object.fromEntries(ed.hadiths.map(h => [h.hadithnumber, strip(h.text.replace(/<br\s*\/?>/gi, ' '))]));
  const A = byNo(ar), E = byNo(en), T = byNo(tr);
  const out = [];
  Object.keys(A).map(Number).sort((x, y) => x - y).forEach(n => {
    if (!A[n] || !E[n] || !T[n] || A[n].length > MAX_HADITH_AR) return;
    const a = splitSource(A[n]), e = splitSource(E[n]), t = splitSource(T[n]);
    if (!/^(Al-)?(Bukhari|Muslim)/.test(e.source) || !/رواه|رَوَاهُ/.test(a.source) || !/Buhari|Müslim/.test(t.source)) return;
    e.source = e.source.replace(/Al-/g, '').replace(' · ', ' & ');
    a.source = a.source.replace(' · ', ' ');
    out.push({ no: n, ar: a.body, en: e.body, tr: t.body, source_ar: a.source, source_en: e.source, source_tr: t.source });
  });
  return out;
}

(async () => {
  await chapters();
  const verses = [];
  for (const key of VERSES) {
    const v = await verse(key);
    const related = mentionsVerse(v.tafsir, v.arabic);
    const chain = /حدثنا|أخبرنا|أنبأنا/.test(v.tafsir.slice(0, 120));
    const keep = v.arabic.length <= MAX_VERSE_AR && v.tafsir.length >= 40 && v.tr && v.en && related && !chain;
    console.log(`${keep ? 'KEEP' : 'skip'} ${key} ${v.source_tr} | related=${related} | TAFSIR: ${v.tafsir.slice(0, 90)}`);
    if (keep) verses.push(v);
  }
  const hs = await hadiths();
  console.log(`hadiths kept: ${hs.length}`);
  hs.forEach(h => console.log(`  #${h.no} | ${h.source_tr} | ${h.source_en} | ${h.source_ar} | ${h.tr.slice(0, 60)}`));
  if (DRY) return;
  const banner = `// Generated by build-daily.js. Do not edit by hand.
// Verses: text_uthmani, Turkish (Diyanet İşleri, quran.com #77), English (Saheeh International, #20)
// and an excerpt of the Arabic Tafsir Ibn Kathir (#14), all from api.quran.com.
// Hadiths: al-Nawawi's Forty Hadith (Arabic, English, Turkish) from github.com/fawazahmed0/hadith-api.
`;
  fs.writeFileSync(OUT, `${banner}const DAILY_VERSES = ${JSON.stringify(verses, null, 1)};\n\nconst DAILY_HADITHS = ${JSON.stringify(hs, null, 1)};\n`);
  console.log('written', OUT, verses.length, 'verses', hs.length, 'hadiths');
})().catch(e => { console.error(e); process.exit(1); });
