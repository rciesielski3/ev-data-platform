"use client";

const GlobalError = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => (
  <html lang="pl">
    <body className="flex min-h-screen items-center justify-center bg-gray-100 p-6 font-sans text-gray-900">
      <div className="max-w-md rounded-lg border border-amber-300 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold">Dane chwilowo niedostępne</h1>
        <p className="mt-2 text-sm">Dane są chwilowo niedostępne. Spróbuj ponownie później.</p>
        <button type="button" onClick={reset} className="mt-4 rounded bg-amber-600 px-4 py-2 text-sm text-white">
          Spróbuj ponownie
        </button>
      </div>
    </body>
  </html>
);

export default GlobalError;
