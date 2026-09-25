import { LANGUAGE_COUNT } from "./languages";

const languageCount = Math.floor(LANGUAGE_COUNT / 10) * 10;

export const FAQ_ITEMS = [
  {
    q: "What is an image translator?",
    a: "An image translator reads the text inside a picture using OCR (optical character recognition) and then translates it into another language. SnapTranslate does both steps for you, so you don't have to retype anything.",
  },
  {
    q: "How do I translate text from a photo?",
    a: "Upload or drop a photo, choose the source language (or leave it on Auto Detect), pick the language you want, and click Translate Now. You'll see the original and translated text side by side, ready to copy or download.",
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
    q: "Can I copy the translated text?",
    a: "Yes. Both the extracted text and the translation have a copy button. You can also edit the extracted text to fix recognition mistakes before translating again.",
  },
  {
    q: "Can I download the translation?",
    a: "Yes. You can download the original or translated text as a TXT file, a bilingual document with both, or a translated image that places the translation over the original text areas. On busy or textured backgrounds the translated image is an approximation.",
  },
  {
    q: "Can it recognize handwriting?",
    a: "Only to a limited extent. Our OCR is built for printed text, so neat, print-style handwriting sometimes works, but cursive or messy handwriting usually won't be recognised reliably.",
  },
  {
    q: "Are uploaded images stored?",
    a: "No. Text recognition runs in your browser, so your image isn't uploaded to our servers. Only the extracted text is sent to our translation service to be translated. Your Recent Scans (text and a small thumbnail) are saved only in your own browser, and you can delete them at any time.",
  },
];
