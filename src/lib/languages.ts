/**
 * Supported languages.
 *
 * `code`  – canonical code used by the app and the translation API (Google-style BCP-47).
 * `ocr`   – Tesseract traineddata code. Languages without one fall back to `eng`,
 *           which works reasonably for other Latin-script languages.
 * `iso3`  – ISO 639-3 code returned by the local language detector (franc).
 * `rtl`   – right-to-left script.
 */
export interface Language {
  code: string;
  name: string;
  native: string;
  ocr?: string;
  iso3?: string;
  rtl?: boolean;
}

export const AUTO_DETECT = "auto";

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English", ocr: "eng", iso3: "eng" },
  { code: "es", name: "Spanish", native: "Español", ocr: "spa", iso3: "spa" },
  { code: "fr", name: "French", native: "Français", ocr: "fra", iso3: "fra" },
  { code: "de", name: "German", native: "Deutsch", ocr: "deu", iso3: "deu" },
  { code: "ar", name: "Arabic", native: "العربية", ocr: "ara", iso3: "arb", rtl: true },
  { code: "hi", name: "Hindi", native: "हिन्दी", ocr: "hin", iso3: "hin" },
  { code: "ur", name: "Urdu", native: "اردو", ocr: "urd", iso3: "urd", rtl: true },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "简体中文", ocr: "chi_sim", iso3: "cmn" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文", ocr: "chi_tra" },
  { code: "ja", name: "Japanese", native: "日本語", ocr: "jpn", iso3: "jpn" },
  { code: "ko", name: "Korean", native: "한국어", ocr: "kor", iso3: "kor" },
  { code: "pt", name: "Portuguese", native: "Português", ocr: "por", iso3: "por" },
  { code: "ru", name: "Russian", native: "Русский", ocr: "rus", iso3: "rus" },
  { code: "it", name: "Italian", native: "Italiano", ocr: "ita", iso3: "ita" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", ocr: "ind", iso3: "ind" },
  { code: "tr", name: "Turkish", native: "Türkçe", ocr: "tur", iso3: "tur" },
  { code: "nl", name: "Dutch", native: "Nederlands", ocr: "nld", iso3: "nld" },
  { code: "pl", name: "Polish", native: "Polski", ocr: "pol", iso3: "pol" },
  { code: "uk", name: "Ukrainian", native: "Українська", ocr: "ukr", iso3: "ukr" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", ocr: "vie", iso3: "vie" },
  { code: "th", name: "Thai", native: "ไทย", ocr: "tha", iso3: "tha" },
  { code: "he", name: "Hebrew", native: "עברית", ocr: "heb", iso3: "heb", rtl: true },
  { code: "fa", name: "Persian", native: "فارسی", ocr: "fas", iso3: "pes", rtl: true },
  { code: "bn", name: "Bengali", native: "বাংলা", ocr: "ben", iso3: "ben" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", ocr: "pan", iso3: "pan" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", ocr: "guj", iso3: "guj" },
  { code: "mr", name: "Marathi", native: "मराठी", ocr: "mar", iso3: "mar" },
  { code: "ta", name: "Tamil", native: "தமிழ்", ocr: "tam", iso3: "tam" },
  { code: "te", name: "Telugu", native: "తెలుగు", ocr: "tel", iso3: "tel" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", ocr: "kan", iso3: "kan" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", ocr: "mal", iso3: "mal" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", ocr: "ori", iso3: "ory" },
  { code: "as", name: "Assamese", native: "অসমীয়া", ocr: "asm", iso3: "asm" },
  { code: "ne", name: "Nepali", native: "नेपाली", ocr: "nep", iso3: "npi" },
  { code: "si", name: "Sinhala", native: "සිංහල", ocr: "sin", iso3: "sin" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्", ocr: "san", iso3: "san" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", ocr: "msa", iso3: "zlm" },
  { code: "tl", name: "Filipino", native: "Filipino", ocr: "fil", iso3: "tgl" },
  { code: "jv", name: "Javanese", native: "Basa Jawa", ocr: "jav", iso3: "jav" },
  { code: "ceb", name: "Cebuano", native: "Cebuano", ocr: "ceb", iso3: "ceb" },
  { code: "sw", name: "Swahili", native: "Kiswahili", ocr: "swa", iso3: "swh" },
  { code: "sv", name: "Swedish", native: "Svenska", ocr: "swe", iso3: "swe" },
  { code: "no", name: "Norwegian", native: "Norsk", ocr: "nor", iso3: "nob" },
  { code: "da", name: "Danish", native: "Dansk", ocr: "dan", iso3: "dan" },
  { code: "fi", name: "Finnish", native: "Suomi", ocr: "fin", iso3: "fin" },
  { code: "is", name: "Icelandic", native: "Íslenska", ocr: "isl", iso3: "isl" },
  { code: "cs", name: "Czech", native: "Čeština", ocr: "ces", iso3: "ces" },
  { code: "sk", name: "Slovak", native: "Slovenčina", ocr: "slk", iso3: "slk" },
  { code: "hu", name: "Hungarian", native: "Magyar", ocr: "hun", iso3: "hun" },
  { code: "ro", name: "Romanian", native: "Română", ocr: "ron", iso3: "ron" },
  { code: "bg", name: "Bulgarian", native: "Български", ocr: "bul", iso3: "bul" },
  { code: "el", name: "Greek", native: "Ελληνικά", ocr: "ell", iso3: "ell" },
  { code: "hr", name: "Croatian", native: "Hrvatski", ocr: "hrv", iso3: "hrv" },
  { code: "sr", name: "Serbian", native: "Српски", ocr: "srp", iso3: "srp" },
  { code: "sl", name: "Slovenian", native: "Slovenščina", ocr: "slv", iso3: "slv" },
  { code: "bs", name: "Bosnian", native: "Bosanski", ocr: "bos", iso3: "bos" },
  { code: "mk", name: "Macedonian", native: "Македонски", ocr: "mkd", iso3: "mkd" },
  { code: "sq", name: "Albanian", native: "Shqip", ocr: "sqi", iso3: "als" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių", ocr: "lit", iso3: "lit" },
  { code: "lv", name: "Latvian", native: "Latviešu", ocr: "lav", iso3: "lvs" },
  { code: "et", name: "Estonian", native: "Eesti", ocr: "est", iso3: "ekk" },
  { code: "be", name: "Belarusian", native: "Беларуская", ocr: "bel", iso3: "bel" },
  { code: "ka", name: "Georgian", native: "ქართული", ocr: "kat", iso3: "kat" },
  { code: "hy", name: "Armenian", native: "Հայերեն", ocr: "hye", iso3: "hye" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan", ocr: "aze", iso3: "azj" },
  { code: "kk", name: "Kazakh", native: "Қазақ", ocr: "kaz", iso3: "kaz" },
  { code: "uz", name: "Uzbek", native: "Oʻzbek", ocr: "uzb", iso3: "uzn" },
  { code: "ky", name: "Kyrgyz", native: "Кыргызча", ocr: "kir", iso3: "kir" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ", ocr: "tgk", iso3: "tgk" },
  { code: "tt", name: "Tatar", native: "Татар", ocr: "tat", iso3: "tat" },
  { code: "mn", name: "Mongolian", native: "Монгол", ocr: "mon", iso3: "khk" },
  { code: "km", name: "Khmer", native: "ខ្មែរ", ocr: "khm", iso3: "khm" },
  { code: "lo", name: "Lao", native: "ລາວ", ocr: "lao", iso3: "lao" },
  { code: "my", name: "Burmese", native: "မြန်မာ", ocr: "mya", iso3: "mya" },
  { code: "am", name: "Amharic", native: "አማርኛ", ocr: "amh", iso3: "amh" },
  { code: "ps", name: "Pashto", native: "پښتو", ocr: "pus", iso3: "pbu", rtl: true },
  { code: "sd", name: "Sindhi", native: "سنڌي", ocr: "snd", iso3: "snd", rtl: true },
  { code: "ug", name: "Uyghur", native: "ئۇيغۇرچە", ocr: "uig", iso3: "uig", rtl: true },
  { code: "yi", name: "Yiddish", native: "ייִדיש", ocr: "yid", iso3: "ydd", rtl: true },
  { code: "ca", name: "Catalan", native: "Català", ocr: "cat", iso3: "cat" },
  { code: "eu", name: "Basque", native: "Euskara", ocr: "eus", iso3: "eus" },
  { code: "gl", name: "Galician", native: "Galego", ocr: "glg", iso3: "glg" },
  { code: "cy", name: "Welsh", native: "Cymraeg", ocr: "cym", iso3: "cym" },
  { code: "ga", name: "Irish", native: "Gaeilge", ocr: "gle", iso3: "gle" },
  { code: "gd", name: "Scottish Gaelic", native: "Gàidhlig", ocr: "gla", iso3: "gla" },
  { code: "mt", name: "Maltese", native: "Malti", ocr: "mlt", iso3: "mlt" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", ocr: "ltz", iso3: "ltz" },
  { code: "fy", name: "Frisian", native: "Frysk", ocr: "fry", iso3: "fry" },
  { code: "co", name: "Corsican", native: "Corsu", ocr: "cos", iso3: "cos" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", ocr: "afr", iso3: "afr" },
  { code: "la", name: "Latin", native: "Latina", ocr: "lat", iso3: "lat" },
  { code: "eo", name: "Esperanto", native: "Esperanto", ocr: "epo", iso3: "epo" },
  { code: "ht", name: "Haitian Creole", native: "Kreyòl ayisyen", ocr: "hat", iso3: "hat" },
  { code: "mi", name: "Maori", native: "Māori", ocr: "mri", iso3: "mri" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", ocr: "yor", iso3: "yor" },
  { code: "so", name: "Somali", native: "Soomaali", iso3: "som" },
  { code: "zu", name: "Zulu", native: "isiZulu", iso3: "zul" },
  { code: "xh", name: "Xhosa", native: "isiXhosa", iso3: "xho" },
  { code: "ha", name: "Hausa", native: "Hausa", iso3: "hau" },
  { code: "ig", name: "Igbo", native: "Igbo", iso3: "ibo" },
];

/** Popular languages are listed first in selectors. */
export const POPULAR_CODES = [
  "en", "es", "fr", "de", "ar", "hi", "ur", "zh-CN", "ja", "ko", "pt", "ru", "it", "id", "tr",
];

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));
const byIso3 = new Map(LANGUAGES.filter((l) => l.iso3).map((l) => [l.iso3!, l]));

export function getLanguage(code: string | undefined | null): Language | undefined {
  if (!code) return undefined;
  return byCode.get(code) ?? byCode.get(code.split("-")[0]);
}

export function languageName(code: string | undefined | null): string {
  if (code === AUTO_DETECT) return "Auto Detect";
  return getLanguage(code)?.name ?? code ?? "Unknown";
}

export function languageFromIso3(iso3: string): Language | undefined {
  return byIso3.get(iso3);
}

export function isRtl(code: string | undefined | null): boolean {
  return Boolean(getLanguage(code)?.rtl);
}

/** Tesseract language string for a source language. English is added as a secondary model for mixed text. */
export function ocrLangsFor(code: string): string {
  const ocr = getLanguage(code)?.ocr ?? "eng";
  return ocr === "eng" ? "eng" : `${ocr}+eng`;
}

export const LANGUAGE_COUNT = LANGUAGES.length;
