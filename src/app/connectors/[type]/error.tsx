"use client";

import Link from "next/link";

export default function ConnectorDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="card border-amber-200 bg-amber-50 text-amber-900">
        <h1 className="text-xl font-semibold">
          Connector details could not load
        </h1>
        <p className="mt-2">
          This static connector reference page is temporarily unavailable.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            Retry
          </button>
          <Link
            href="/connectors"
            className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Back to connectors
          </Link>
        </div>
      </section>
    </main>
  );
}
