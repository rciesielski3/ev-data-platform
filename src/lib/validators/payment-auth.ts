import { PaymentMethod, AuthMethod } from "@prisma/client";

// Sourced from EIPA's official `dictionary` export, `station_payment_method`
// resource (fetchEipaDictionary()) -- not guessed. IDs map to the dictionary's
// numeric `id`, not its Polish `description` text, since the description
// wording isn't a stable identifier across API revisions.
//
// Built lazily (memoized) rather than at module load: this module is
// imported widely, so eagerly dereferencing `PaymentMethod.X` here would
// crash on import if the generated Prisma client is stale and hasn't
// picked up these enum members yet.
let eipaPaymentMethodMap: Record<number, PaymentMethod> | undefined;

const getEipaPaymentMethodMap = (): Record<number, PaymentMethod> => {
  if (!eipaPaymentMethodMap) {
    eipaPaymentMethodMap = {
      0: PaymentMethod.UNDETERMINED, // Nieokreślone
      1: PaymentMethod.FREE, // Bezpłatne ładowanie
      2: PaymentMethod.OPERATOR_CONTRACT, // Płatne ładowanie, umowa z operatorem
      4: PaymentMethod.PAYMENT_CARD, // Płatne ładowanie, karta płatnicza
      8: PaymentMethod.CASH, // Płatne ładowanie, gotówka
      16: PaymentMethod.PREPAID_CARD, // Płatne ładowanie, karta przedpłacona
      32: PaymentMethod.FLEET_CARD, // Płatne ładowanie, karta flotowa
      64: PaymentMethod.BANK_TRANSFER, // Płatne ładowanie, przelew
      128: PaymentMethod.ONLINE_PAYMENT, // Płatne ładowanie, płatność internetowa
    };
  }

  return eipaPaymentMethodMap;
};

// Sourced from EIPA's official `dictionary` export, `station_authentication_method`
// resource. Same id-not-description rationale and lazy-build rationale as
// EIPA_PAYMENT_METHOD_MAP above.
let eipaAuthMethodMap: Record<number, AuthMethod> | undefined;

const getEipaAuthMethodMap = (): Record<number, AuthMethod> => {
  if (!eipaAuthMethodMap) {
    eipaAuthMethodMap = {
      0: AuthMethod.OPEN_ACCESS, // Nieograniczony dostęp
      1: AuthMethod.NO_ACCESS, // Brak dostępu
      2: AuthMethod.RFID_MIFARE_CLASSIC, // Karta RFID / NFC - Mifare Classic
      4: AuthMethod.RFID_MIFARE_DESFIRE, // Karta RFID / NFC - Mifare Desifare
      8: AuthMethod.RFID_CALYPSO, // RFID Calypso
      16: AuthMethod.PINPAD, // PINPAD
      32: AuthMethod.MOBILE_APP, // Aplikacje
      64: AuthMethod.PHONE_RFID, // Telefon (aktywny RFID chip)
      128: AuthMethod.ISO15118_PLC, // ISO/IEC 15118 - PLC
      256: AuthMethod.ISO15118_WIRELESS, // ISO/IEC 15118 - bezprzewodowo
      512: AuthMethod.PHONE_VOICE, // Telefonicznie głosowo
      1024: AuthMethod.SMS, // Telefoniczne SMS
      8192: AuthMethod.PREPAID_CARD, // Karta przedpłacona
    };
  }

  return eipaAuthMethodMap;
};

export const validatePaymentMethod = (
  value: string | null | undefined,
): PaymentMethod | null => {
  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed) {
    return null;
  }

  return (Object.values(PaymentMethod) as string[]).includes(trimmed)
    ? (trimmed as PaymentMethod)
    : null;
};

export const validateAuthMethod = (
  value: string | null | undefined,
): AuthMethod | null => {
  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed) {
    return null;
  }

  return (Object.values(AuthMethod) as string[]).includes(trimmed)
    ? (trimmed as AuthMethod)
    : null;
};

export const mapEipaPaymentMethodIds = (
  ids: number[] | null | undefined,
): PaymentMethod[] => {
  if (!Array.isArray(ids)) {
    return [];
  }

  const paymentMethodMap = getEipaPaymentMethodMap();
  const mapped = ids
    .map((id) => paymentMethodMap[id])
    .filter((value): value is PaymentMethod => Boolean(value));

  return Array.from(new Set(mapped));
};

export const mapEipaAuthMethodIds = (
  ids: number[] | null | undefined,
): AuthMethod[] => {
  if (!Array.isArray(ids)) {
    return [];
  }

  const authMethodMap = getEipaAuthMethodMap();
  const mapped = ids
    .map((id) => authMethodMap[id])
    .filter((value): value is AuthMethod => Boolean(value));

  return Array.from(new Set(mapped));
};

export const findUnknownEipaPaymentMethodIds = (
  ids: number[] | null | undefined,
): number[] => {
  if (!Array.isArray(ids)) {
    return [];
  }

  const paymentMethodMap = getEipaPaymentMethodMap();
  return Array.from(
    new Set(ids.filter((id) => !(id in paymentMethodMap))),
  );
};

export const findUnknownEipaAuthMethodIds = (
  ids: number[] | null | undefined,
): number[] => {
  if (!Array.isArray(ids)) {
    return [];
  }

  const authMethodMap = getEipaAuthMethodMap();
  return Array.from(
    new Set(ids.filter((id) => !(id in authMethodMap))),
  );
};

export type StationPaymentAuthValidationResult = {
  valid: string[];
  unknown: string[];
};

const validateMethodList = (
  values: string[] | null | undefined,
  validate: (value: string) => string | null,
): StationPaymentAuthValidationResult => {
  if (!Array.isArray(values)) {
    return { valid: [], unknown: [] };
  }

  const valid = new Set<string>();
  const unknown = new Set<string>();

  for (const value of values) {
    const trimmed = typeof value === "string" ? value.trim() : "";

    if (!trimmed) {
      continue;
    }

    const result = validate(trimmed);

    if (result) {
      valid.add(result);
    } else {
      unknown.add(trimmed);
    }
  }

  return { valid: Array.from(valid), unknown: Array.from(unknown) };
};

export const validateStationPaymentMethods = (
  values: string[] | null | undefined,
): StationPaymentAuthValidationResult =>
  validateMethodList(values, (value) => validatePaymentMethod(value));

export const validateStationAuthMethods = (
  values: string[] | null | undefined,
): StationPaymentAuthValidationResult =>
  validateMethodList(values, (value) => validateAuthMethod(value));

export const hasValidPaymentAuth = (station: {
  acceptedPaymentMethods?: string[] | null;
  authenticationTypes?: string[] | null;
}): boolean =>
  (station.acceptedPaymentMethods?.length ?? 0) > 0 ||
  (station.authenticationTypes?.length ?? 0) > 0;
