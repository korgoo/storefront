"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AccountError({
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
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-600 mb-6">
        We couldn&apos;t load your account. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
