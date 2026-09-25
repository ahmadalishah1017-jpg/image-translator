import { Languages, ScanText, Upload } from "lucide-react";
import { eyebrow, sectionLead, sectionTitle } from "@/components/ui";

const STEPS = [
  {
    icon: Upload,
    title: "Upload",
    text: "Upload a JPG, PNG, or WebP image — or paste a screenshot straight from your clipboard.",
    art: (
      <div className="relative mx-auto h-20 w-28">
        <div className="absolute inset-x-2 top-2 h-16 rounded-lg border-2 border-dashed border-brand-500/40 bg-white" />
        <div className="absolute left-1/2 top-5 grid size-9 -translate-x-1/2 place-items-center rounded-full bg-brand-gradient text-white shadow-lift">
          <Upload className="size-4" />
        </div>
      </div>
    ),
  },
  {
    icon: ScanText,
    title: "Extract",
    text: "AI-powered OCR identifies the text inside your image, line by line.",
    art: (
      <div className="relative mx-auto h-20 w-28 overflow-hidden rounded-lg border border-line bg-white p-3">
        <div className="space-y-1.5">
          <div className="h-1.5 w-16 rounded bg-ink/70" />
          <div className="h-1.5 w-20 rounded bg-ink/40" />
          <div className="h-1.5 w-12 rounded bg-ink/40" />
          <div className="h-1.5 w-18 rounded bg-ink/40" />
        </div>
        <div className="absolute inset-x-0 top-7 h-0.5 bg-brand-500 shadow-[0_0_12px_2px_rgb(79_91_240/0.6)]" />
      </div>
    ),
  },
  {
    icon: Languages,
    title: "Translate",
    text: "Choose your language and instantly receive the translated text — ready to copy or download.",
    art: (
      <div className="mx-auto flex h-20 w-28 items-center justify-center gap-2">
        <span className="grid size-10 place-items-center rounded-xl border border-line bg-white text-lg font-bold text-ink">
          A
        </span>
        <span className="text-brand-600">→</span>
        <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-lg font-bold text-white shadow-lift">
          文
        </span>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className={eyebrow}>How it works</p>
          <h2 id="how-title" className={`${sectionTitle} mt-3`}>
            From photo to translation in three steps
          </h2>
          <p className={sectionLead}>No sign-up, no software to install. Just upload and translate.</p>
        </div>

        <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-16 hidden h-px bg-gradient-to-r from-transparent via-brand-100 to-transparent md:block"
          />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-2xl border border-line bg-white p-6 text-center shadow-card">
              <div className="rounded-xl bg-gradient-to-b from-brand-50 to-white py-4">{step.art}</div>
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-brand-600">Step {i + 1}</p>
              <h3 className="mt-1 text-xl font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
