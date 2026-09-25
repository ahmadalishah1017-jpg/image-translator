import { Briefcase, Check, Coffee, GraduationCap, Plane } from "lucide-react";
import { eyebrow, sectionLead, sectionTitle } from "@/components/ui";

const CASES = [
  {
    icon: Plane,
    title: "Travel",
    tint: "from-sky-500 to-blue-600",
    items: ["Road signs", "Restaurant menus", "Storefronts", "Tickets", "Public notices"],
  },
  {
    icon: GraduationCap,
    title: "Students",
    tint: "from-violet-500 to-purple-600",
    items: ["Textbooks", "Notes", "Worksheets", "Screenshots", "Study material"],
  },
  {
    icon: Briefcase,
    title: "Business",
    tint: "from-indigo-500 to-blue-700",
    items: ["Invoices", "Receipts", "Documents", "Presentations", "Foreign-language emails"],
  },
  {
    icon: Coffee,
    title: "Everyday Life",
    tint: "from-fuchsia-500 to-violet-600",
    items: ["Product labels", "Instructions", "Social media screenshots", "Photos", "Handwritten notes*"],
  },
];

export function UseCases() {
  return (
    <section id="use-cases" aria-labelledby="use-cases-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className={eyebrow}>Use cases</p>
          <h2 id="use-cases-title" className={`${sectionTitle} mt-3`}>
            Translate Images for Any Situation
          </h2>
          <p className={sectionLead}>
            Whether you&apos;re abroad, studying, or working with international clients — snap it and understand it.
          </p>
        </div>
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CASES.map(({ icon: Icon, title, tint, items }) => (
            <li key={title} className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card">
              <div
                aria-hidden="true"
                className={`absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br ${tint} opacity-10`}
              />
              <span className={`grid size-12 place-items-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-lift`}>
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">Translate:</p>
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-ink-soft">
                    <Check className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-ink-muted">
          *Handwriting recognition is limited — neat, print-style writing works best.
        </p>
      </div>
    </section>
  );
}
