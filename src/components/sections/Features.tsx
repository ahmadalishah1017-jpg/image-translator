import { FileText, ImageDown, Globe, MonitorSmartphone, ScanText, ShieldCheck } from "lucide-react";
import { eyebrow, sectionLead, sectionTitle } from "@/components/ui";
import { LANGUAGE_COUNT } from "@/lib/languages";

const FEATURES = [
  {
    icon: ScanText,
    title: "Text Stays in Place",
    text: "The translation is drawn right where the original text was, keeping your image's layout and colours.",
  },
  {
    icon: Globe,
    title: `${Math.floor(LANGUAGE_COUNT / 10) * 10}+ Languages`,
    text: "Translate between a broad range of languages, from Spanish and Arabic to Japanese, Hindi and Urdu.",
  },
  {
    icon: MonitorSmartphone,
    title: "Screenshot Translator",
    text: "Translate text from screenshots of webpages, apps, chats and digital documents. Paste with Ctrl+V.",
  },
  {
    icon: FileText,
    title: "Document Translator",
    text: "Translate the text in documents, notes, invoices, receipts and other images.",
  },
  {
    icon: ImageDown,
    title: "Download the Result",
    text: "Save the translated image as a full-resolution PNG in one click, ready to share or print.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Focused",
    text: "Your image stays on your device. Only the text it contains is sent for translation, and history lives in your browser.",
  },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className={eyebrow}>Features</p>
          <h2 id="features-title" className={`${sectionTitle} mt-3`}>
            Everything you need to translate images
          </h2>
          <p className={sectionLead}>A focused photo translator that does one job well — fast, simple and private.</p>
        </div>
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="group rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-gradient group-hover:text-white">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
