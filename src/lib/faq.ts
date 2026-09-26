import { LANGUAGE_COUNT } from "./languages";

const languageCount = Math.floor(LANGUAGE_COUNT / 10) * 10;

export const FAQ_ITEMS = [
  {
    q: "What is an image translator?",
    a: "An image translator finds the text inside a picture and translates it into another language. SnapTranslate gives you the same image back with the translated text placed where the original text was, so you never have to retype anything.",
  },
  {
    q: "How do I translate text from a photo?",
    a: "Upload or drop a photo, choose the source language (or leave it on Auto Detect), pick the language you want, and click Translate Now. You'll get the same image back with its text in your language, and you can switch between the translated and original versions or download the result.",
  },
  {
    q: "Can I translate screenshots?",
    a: "Yes. Screenshots usually give the best results because the text is sharp and high-contrast. You can also paste a screenshot straight from your clipboard with Ctrl+V (⌘V on Mac).",
  },
  {
    q: "Which image formats are supported?",
    a: "JPG, PNG and WebP images up to 10 MB.",
  },
  {
    q: "Does the tool support automatic language detection?",
    a: "Yes, for languages written in the Latin alphabet such as English, Spanish, French, German, Portuguese and Italian. For other scripts — Arabic, Chinese, Japanese, Korean, Hindi, Urdu and so on — select the source language so the right text-recognition model is used.",
  },
  {
    q: "How many languages are supported?",
    a: `You can choose from more than ${languageCount} languages. Text recognition is available for almost all of them. A few rare language pairs may not be supported by our translation service — if that happens you'll see a message and can pick another language.`,
  },
  {
    q: "Does the translation keep the original layout?",
    a: "Yes. Each piece of text is replaced in the same spot, using colours sampled from the original. On plain backgrounds it looks very close to the original; on busy or textured backgrounds the replaced area may look like a flat patch.",
  },
  {
    q: "Can I download the translation?",
    a: "Yes. Click Download Translated Image to save the result as a full-resolution PNG. Your Recent Scans also keep a small preview in your browser.",
  },
  {
    q: "Can it recognize handwriting?",
    a: "Only to a limited extent. Our OCR is built for printed text, so neat, print-style handwriting sometimes works, but cursive or messy handwriting usually won't be recognised reliably.",
  },
  {
    q: "Are uploaded images stored?",
    a: "No. Text recognition runs in your browser, so your image isn't uploaded to our servers. Only the text found in it is sent to our translation service to be translated. Your Recent Scans (a small preview of each translated image) are saved only in your own browser, and you can delete them at any time.",
  },
];
