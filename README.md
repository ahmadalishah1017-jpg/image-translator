# imageTranslator — SnapTranslate

An online image translator: upload a photo or screenshot, extract its text with OCR, translate it, and copy or download the result.

**Upload → Extract → Translate → Copy/Download**

Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Features

- Upload by drag-and-drop, file picker, paste (Ctrl/⌘+V or the **Paste an image** button), or the camera on mobile devices
- File validation: JPG, PNG, and WebP files up to 10 MB
- **In-browser OCR** with [Tesseract.js](https://github.com/naptha/tesseract.js). Images are never uploaded.
- Automatic language detection for Latin-script text: an English pass, detection with `franc-min`, then a second pass with the detected language's model
- Source/target selectors covering 90+ languages
- Original and translated text side by side, with copy, edit, TXT download, and a bilingual document download
- Re-translate into another language without uploading or running OCR again
- **Translated image** download: each translated segment is painted over the original text area, using the sampled background and text colours. If no layout is available (for example after editing the text), you get a clean text card instead.
- **Recent Scans** kept in `localStorage` (text plus a small thumbnail), with per-item delete and **Clear History**
- Friendly error states for unsupported files, oversized images, no text found, OCR failure, translation failure, network errors, and rate limits
- SEO: metadata, Open Graph image, JSON-LD (`WebApplication` + `FAQPage`), sitemap, and robots.txt
- Accessibility: keyboard navigation throughout, skip link, labelled controls, live regions for progress and copy feedback, and respect for `prefers-reduced-motion`

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: configure a translation provider
npm run dev
```

Open http://localhost:3000.

With no configuration the app uses the free **MyMemory** API. It needs no key, but its daily quota is small. Use it for development only and configure a real provider for production.

## Translation providers

The provider is chosen by `TRANSLATION_PROVIDER`, or picked automatically from whichever credentials are present:

| Provider       | Env vars                                          |
| -------------- | ------------------------------------------------- |
| Google Cloud   | `GOOGLE_TRANSLATE_API_KEY`                        |
| DeepL          | `DEEPL_API_KEY`                                   |
| LibreTranslate | `LIBRETRANSLATE_URL`, `LIBRETRANSLATE_API_KEY`    |
| MyMemory       | `MYMEMORY_EMAIL` (optional, raises the quota)     |

Provider keys stay on the server. The browser only calls `/api/translate`.

## Architecture

```
OCR Service  →  Extracted Text  →  Translation Service  →  Translated Text
(browser)                           (/api/translate → provider)
```

- `src/lib/services/ocr/types.ts` defines the `OcrProvider` interface. `tesseract.ts` is the default implementation. A cloud OCR provider can implement the same interface.
- `src/lib/services/translation/types.ts` defines the `TranslationService` interface used by the UI. `client.ts` calls the API route.
- `src/server/translation/` holds the server-side `TranslationProvider` implementations (Google, DeepL, LibreTranslate, MyMemory) and the env-based selector.
- `src/lib/services/pipeline.ts` orchestrates OCR, language detection, and translation.
- `src/lib/services/text.ts` splits OCR lines into translatable units (headings, list items, wrapped sentences) so the layout can be rebuilt.
- `src/lib/image.ts` handles validation, OCR preprocessing, and translated-image rendering.
- `src/components/translator/` contains the interactive tool. `src/components/sections/` contains the marketing sections.

## Privacy model

- Images are processed in the browser and never sent to the server.
- Only the extracted text is sent to `/api/translate` and forwarded to the configured provider. It is not stored.
- The OCR engine and language models are downloaded from jsDelivr and cached by the browser.
- History lives in `localStorage` only.

## Known limitations

- OCR is tuned for printed text. Handwriting support is limited.
- Auto Detect is reliable for Latin-script languages. For other scripts, users should choose the source language. The UI says this.
- The translated-image overlay approximates the original layout and looks best on plain backgrounds.
- The rate limiter is in-memory, so it is per server instance. Use a shared store if you run several instances.
