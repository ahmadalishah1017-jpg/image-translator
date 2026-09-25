import { ArrowRight, Cpu, Eraser, Lock, Upload } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { icon: Upload, title: "Upload", text: "Your image opens locally in your browser. It isn't sent to our servers." },
  { icon: Cpu, title: "Process", text: "Text is recognised on your device. Only the extracted text is sent to be translated." },
  { icon: Eraser, title: "Delete", text: "Remove the image anytime — it's discarded when you reset or leave. History is local and clearable." },
];

export function PrivacySection() {
  return (
    <section aria-labelledby="privacy-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-white sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-gradient opacity-30 blur-3xl"
          />
          <div className="relative grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                <Lock className="size-4" aria-hidden="true" />
                Privacy by design
              </span>
              <h2 id="privacy-title" className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Your Images Stay Private
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/75">
                We designed SnapTranslate with privacy in mind. Images are only processed for the purpose you
                request: text recognition happens in your browser, the image itself is never uploaded or stored on
                our servers, and we tell you clearly what happens to your data.
              </p>
              <Link
                href="/privacy"
                className="mt-6 inline-flex items-center gap-1.5 font-semibold text-white underline-offset-4 hover:underline"
              >
                Read our privacy policy <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative rounded-2xl border border-white/10 bg-white/5 p-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-gradient">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{text}</p>
                  {i < STEPS.length - 1 && (
                    <ArrowRight
                      className="absolute -right-3.5 top-8 hidden size-5 text-white/40 sm:block"
                      aria-hidden="true"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
