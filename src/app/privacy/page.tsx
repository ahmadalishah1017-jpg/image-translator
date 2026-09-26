import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SnapTranslate handles your images and text when you translate a photo.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro="SnapTranslate is built to process as little of your data as possible. This page explains exactly what happens when you translate an image."
    >
      <h2>Your images</h2>
      <p>
        Text recognition (OCR) runs entirely in your web browser. When you upload, paste or photograph an image, it
        is opened locally on your device and is <strong>not uploaded to our servers</strong>. The image is discarded
        when you remove it, replace it, or leave the page.
      </p>
      <p>
        To run OCR in your browser, your device downloads the recognition engine and language model files from a
        public content delivery network (jsDelivr). These downloads do not include your image.
      </p>

      <h2>Text in your image</h2>
      <p>
        To translate, the text recognised in your image is sent to our server, which forwards it to a third-party
        machine-translation provider and returns the result. We do not store this text on our servers. The
        translation provider processes it under its own terms and privacy policy.
      </p>

      <h2>Recent Scans</h2>
      <p>
        Your recent translations — a small preview of each translated image and the languages used — are
        saved in your browser&apos;s local storage so you can reopen them. This data never leaves your device. You
        can delete individual scans or clear your whole history at any time from the Recent Scans panel.
      </p>

      <h2>Logs and abuse prevention</h2>
      <p>
        Like most websites, our hosting infrastructure may keep short-lived technical logs (such as IP addresses
        and request times) to keep the service running and to limit abuse. We don&apos;t use them to identify you or
        build profiles.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email us at <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </ContentPage>
  );
}
