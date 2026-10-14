import type { Metadata } from "next";
import "./globals.css";
import IconFontGuard from "@/components/IconFontGuard";

export const metadata: Metadata = {
  title: "Invoice Extractor",
  description:
    "Upload an invoice. A vision model reads it, code checks the arithmetic, you fix what is flagged and export CSV.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
          rel="stylesheet"
        />
        {/* Hide scroll-reveal content only when JS runs; if the app never hydrates, show everything. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js-reveal');setTimeout(function(){var d=document.documentElement;if(!d.classList.contains('reveal-ready'))d.classList.add('reveal-all')},3000);",
          }}
        />
      </head>
      <body className="bg-surface font-body-md text-body-md text-on-surface antialiased">
        <IconFontGuard />
        {children}
      </body>
    </html>
  );
}
