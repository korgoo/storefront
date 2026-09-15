"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-xl font-bold text-gray-900">
        Something went wrong
      </h1>
      <p className="text-gray-600">
        We couldn&apos;t load checkout. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
