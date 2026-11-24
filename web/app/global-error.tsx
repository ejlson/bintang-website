"use client"; // Error boundaries must be Client Components.

import Link from "next/link";
import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
// global-error replaces the root layout, so it brings its own tokens and font.
import "./globals.css";

/**
 * Last-resort error page, shown when the root layout itself fails. It renders
 * its own <html> and <body>, so it stands alone: the same red title card as
 * app/error.tsx, with only the lion mark (no shared header, footer or page
 * scripts, any of which could be what broke). Aquavit still loads from the
 * Adobe Fonts kit, as in the layout.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en-GB">
      <head>
        <title>Something went wrong · Bintang</title>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" />
        <link rel="stylesheet" href="https://use.typekit.net/pev2vne.css" />
      </head>
      <body>
        <ErrorScreen
          onRetry={retry}
          header={
            <header style={{ display: "flex", justifyContent: "center", padding: "20px 0 0" }}>
              <Link href="/" aria-label="Bintang home" style={{ display: "block", padding: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- small vector mark */}
                <img src="/brand/lion-head-paper.svg" alt="" width={53} height={52} />
              </Link>
            </header>
          }
        />
      </body>
    </html>
  );
}
