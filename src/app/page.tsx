import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Faq } from "@/components/sections/Faq";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LanguageShowcase } from "@/components/sections/LanguageShowcase";
import { PrivacySection } from "@/components/sections/PrivacySection";
import { UseCases } from "@/components/sections/UseCases";
import { Translator } from "@/components/translator/Translator";
import { btn } from "@/components/ui";
import { FAQ_ITEMS } from "@/lib/faq";
import { SITE } from "@/lib/site";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
];

export default function Home() {
  return (
    <>
      <div id="top" className="relative isolate">
        {/* Soft background gradients */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden">
          <div className="absolute left-1/2 top-[-280px] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.16),transparent)]" />
          <div className="absolute right-[-200px] top-[120px] h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(139,61,240,0.10),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(11,20,55,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,20,55,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        </div>

        <Header />

        <main id="main">
          <section aria-labelledby="hero-title" className="px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-sm font-semibold text-brand-700 shadow-sm">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Free online photo translator · No sign-up
              </p>
              <h1
                id="hero-title"
                className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl"
              >
                Translate Any Image <span className="whitespace-nowrap text-brand-gradient">in Seconds</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
                Upload a photo, screenshot, document, or sign. We translate the text right inside your image —
                same picture, same layout, in your language.
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-6xl">
              <Translator />
            </div>
          </section>

          <HowItWorks />
          <Features />
          <UseCases />
          <LanguageShowcase />
          <PrivacySection />
          <Faq />

          <section aria-labelledby="cta-title" className="px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
            <h2 id="cta-title" className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Ready to read the world around you?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
              Drop in a photo or screenshot and get a translation in seconds — free, with no account needed.
            </p>
            <a href="#translate" className={`${btn.primary} mt-8 px-7 text-base`}>
              Translate an Image
            </a>
          </section>
        </main>
      </div>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
