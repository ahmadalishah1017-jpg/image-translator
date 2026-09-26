# imageTranslator — SnapTranslate

An online image translator: upload a photo or screenshot and get the same image back with its text translated in place.

**Upload → Translate → Download the translated image**

Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Features

- Upload by drag-and-drop, file picker, paste (Ctrl/⌘+V or the **Paste an image** button), or the camera on mobile devices
- File validation: JPG, PNG, and WebP files up to 10 MB
- **In-browser OCR** with [Tesseract.js](https://github.com/naptha/tesseract.js). Images are never uploaded.
- Automatic language detection for Latin-script text: an English pass, detection with `franc-min`, then a second pass with the detected language's model
- Source/target selectors covering 90+ languages
- **Text replaced in place**: each line or block is erased with its sampled background colour and redrawn in the target language with the sampled text colour and a matching size
- Viewer with a **Translated / Original** toggle and zoom, plus a full-resolution PNG download
- Re-translate into another language without uploading or reading the image again
- **Recent Scans** kept in `localStorage` (a small preview of each translated image), with per-item delete and **Clear History**
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
