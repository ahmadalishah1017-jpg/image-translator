import { eyebrow, sectionLead, sectionTitle } from "@/components/ui";
import { getLanguage } from "@/lib/languages";

const SHOWCASE = ["en", "es", "fr", "de", "ar", "hi", "ur", "zh-CN", "ja", "ko", "pt", "ru", "it", "id", "tr"];

export function LanguageShowcase() {
  return (
    <section aria-labelledby="languages-title" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className={eyebrow}>Languages</p>
        <h2 id="languages-title" className={`${sectionTitle} mt-3`}>
          Popular languages, ready to go
        </h2>
        <p className={sectionLead}>Read text in one language and get it back in another — in seconds.</p>
        <ul className="mt-12 flex flex-wrap justify-center gap-3">
          {SHOWCASE.map((code) => {
            const lang = getLanguage(code)!;
            const name = code === "zh-CN" ? "Chinese" : lang.name;
            return (
              <li
                key={code}
                className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm"
              >
                <span className="font-semibold text-ink">{name}</span>
                {lang.native !== lang.name && (
                  <span lang={code} className="text-sm text-ink-muted">
                    {code === "zh-CN" ? "中文" : lang.native}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-8 font-semibold text-brand-600">And many more languages</p>
      </div>
    </section>
  );
}
