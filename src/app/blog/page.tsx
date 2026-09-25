import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips for getting the best results when translating text from images.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <ContentPage title="Blog" intro="Guides and tips for translating text from photos and screenshots.">
      <h2>5 tips for more accurate photo translations</h2>
      <ul>
        <li>
          <strong>Get close and fill the frame.</strong> Larger text is recognised far more reliably than small
          text in a wide shot.
        </li>
        <li>
          <strong>Avoid glare and shadows.</strong> Even, bright lighting gives the OCR clean edges to work with.
        </li>
        <li>
          <strong>Keep it straight.</strong> Photograph signs and pages head-on rather than at a steep angle.
        </li>
        <li>
          <strong>Use screenshots when you can.</strong> Digital text in a screenshot is sharper than a photo of a
          screen.
        </li>
        <li>
          <strong>Choose the source language for non-Latin scripts.</strong> For Arabic, Chinese, Japanese, Hindi
          and similar scripts, selecting the language loads the right recognition model.
        </li>
      </ul>
      <p>More articles are on the way.</p>
    </ContentPage>
  );
}
