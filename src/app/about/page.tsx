import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "About",
  description: "SnapTranslate is a fast, private online image translator.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About SnapTranslate"
      intro="We make it effortless to understand text you can see but can't read."
    >
      <p>
        Menus in another language, a screenshot from a foreign app, an invoice from an overseas supplier — text in
        images is everywhere, and retyping it into a translator is slow and error-prone. SnapTranslate turns that
        into a single step: upload the image, and get the text and its translation side by side.
      </p>
      <h2>How we&apos;re different</h2>
      <ul>
        <li>
          <strong>Private by default.</strong> Text recognition runs in your browser, so your images stay on your
          device.
        </li>
        <li>
          <strong>No account needed.</strong> The translator is free to use straight away.
        </li>
        <li>
          <strong>Honest about limits.</strong> OCR works best on clear, printed text. We tell you when results may
          be unreliable and let you fix the text before translating.
        </li>
      </ul>
    </ContentPage>
  );
}
