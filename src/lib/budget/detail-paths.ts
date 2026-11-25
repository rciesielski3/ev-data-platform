const STATION_DETAIL_PATH = /^\/stations\/(?:c[a-z0-9]{20,}|\d+)\/?$/;
const VEHICLE_DETAIL_PATH = /^\/vehicles\/[^/]+\/?$/;

export const isBudgetPausedDetailPath = (pathname: string): boolean =>
  STATION_DETAIL_PATH.test(pathname) || VEHICLE_DETAIL_PATH.test(pathname);

export const PAUSED_RETRY_AFTER_SECONDS = 3600;

export const buildPausedDetailBody = (): string =>
  '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chwilowo niedostępne | EVSource</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem"><h1>Ta strona jest chwilowo niedostępna</h1><p>Ograniczamy zapytania do bazy danych do końca miesiąca. Wróć za kilka dni albo przejdź do <a href="/stations">katalogu stacji</a>.</p><p lang="en">This page is temporarily unavailable. Please come back in a few days or browse the <a href="/stations">station catalogue</a>.</p></body></html>';
