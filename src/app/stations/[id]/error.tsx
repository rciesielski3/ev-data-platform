"use client";

import Link from "next/link";

const StationDetailsError = ({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <section className="card border-amber-200 bg-amber-50 text-amber-900">
        <h1 className="text-xl font-semibold">Station details unavailable</h1>
        <p className="mt-2">
          The station detail record could not be loaded. Try again, or return to
          the station search.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </button>
          <Link
            href="/stations"
            className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Back to stations
          </Link>
        </div>
      </section>
    </main>
  );
};

export default StationDetailsError;
