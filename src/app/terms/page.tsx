import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using the SnapTranslate online image translator.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ContentPage title="Terms of Service" intro="By using SnapTranslate you agree to these terms. They're short, we promise.">
      <h2>Using the service</h2>
      <p>
        SnapTranslate is a free tool for extracting and translating text from images. You may use it for personal
        and commercial purposes, provided you only upload images you have the right to use and you don&apos;t use the
        service to break the law or to overload it with automated requests.
      </p>

      <h2>Accuracy</h2>
      <p>
        Text recognition and translations are generated automatically and may contain mistakes. Don&apos;t rely on
        them for legal, medical, safety-critical or other high-stakes decisions without checking with a qualified
        human translator.
      </p>

      <h2>Availability</h2>
      <p>
        We aim to keep the service available but can&apos;t guarantee it will always be. Translation limits may apply
        to keep the service fair for everyone.
      </p>

      <h2>Liability</h2>
      <p>
        The service is provided &quot;as is&quot;, without warranties of any kind. To the extent permitted by law, we
        aren&apos;t liable for losses arising from its use.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </ContentPage>
  );
}
