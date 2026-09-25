import { ChevronDown } from "lucide-react";
import { eyebrow, sectionLead, sectionTitle } from "@/components/ui";
import { FAQ_ITEMS } from "@/lib/faq";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className={eyebrow}>FAQ</p>
          <h2 id="faq-title" className={`${sectionTitle} mt-3`}>
            Frequently asked questions
          </h2>
          <p className={sectionLead}>Quick answers about translating text from images.</p>
        </div>
        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-white shadow-sm transition open:shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 font-semibold text-ink">
                <h3>{item.q}</h3>
                <ChevronDown
                  className="size-5 shrink-0 text-ink-muted transition group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
