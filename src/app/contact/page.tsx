import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the SnapTranslate team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ContentPage title="Contact us" intro="Feedback, bug reports, partnership ideas — we'd love to hear from you.">
      <p>
        Email us at <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> and we&apos;ll get back to you as
        soon as we can.
      </p>
      <p>
        If you&apos;re reporting a problem with a translation, it helps to include the source and target languages
        and a description of the image. Please don&apos;t send images that contain personal or sensitive information.
      </p>
    </ContentPage>
  );
}
