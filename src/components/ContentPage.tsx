import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** Layout for simple text pages (About, Privacy, Terms…). */
export function ContentPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
          {intro && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p>}
          <div className="mt-10 space-y-6 leading-relaxed text-ink-soft [&_a]:font-semibold [&_a]:text-brand-600 [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
