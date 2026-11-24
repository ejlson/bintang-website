"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Branded page for a runtime error in any page (the root layout still stands,
 * so the shared header and footer are here). Errors in the layout itself fall
 * through to app/global-error.tsx.
 */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>Something went wrong · Bintang</title>
      <ErrorScreen
        onRetry={retry}
        header={<SiteHeader variant="page" tone="paper" mark="paper" />}
        footer={<SiteFooter />}
      />
    </>
  );
}
