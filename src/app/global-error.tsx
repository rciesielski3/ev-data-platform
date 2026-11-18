"use client";

import "./globals.css";

const GlobalError = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => (
  <html lang="pl">
    <body className="flex min-h-screen items-center justify-center bg-cream p-6 font-sans text-forest">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Dane chwilowo niedostępne</h1>
        <p className="mt-3 text-forest/70">Dane są chwilowo niedostępne. Spróbuj ponownie później.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-forest px-7 py-3.5 font-semibold text-cream shadow-lg shadow-forest/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sun hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Spróbuj ponownie
        </button>
      </div>
    </body>
  </html>
);

export default GlobalError;
