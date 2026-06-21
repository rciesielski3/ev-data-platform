"use client";

export default function CoverageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="card border-amber-200 bg-amber-50 text-amber-900">
        <h1 className="text-xl font-semibold">Coverage analysis could not load</h1>
        <p className="mt-2">
          Infrastructure coverage rankings are temporarily unavailable. Try
          again, or check that the charging imports have completed.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
