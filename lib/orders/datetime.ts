/**
 * Interpreta un valor `datetime-local` (sin zona) como hora de America/Lima
 * y lo convierte a ISO-8601 con offset fijo UTC-5 (Lima no usa DST).
 */
export function limaDateTimeLocalToTimestamptz(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "00"] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}-05:00`;
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return iso;
}

export function formatDateTimeLima(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  },
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    ...options,
  }).format(date);
}

/**
 * Límites UTC inclusivo/exclusivo para un día calendario en America/Lima
 * (`YYYY-MM-DD`).
 */
export function limaDateBoundsUtc(dateValue: string): {
  startIso: string;
  endIso: string;
} | null {
  const trimmed = dateValue.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const startIso = `${trimmed}T00:00:00-05:00`;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

/** Instantánea de referencia para comparar vencimientos (servidor). */
export function getReferenceInstantMs(): number {
  return Date.parse(new Date().toISOString());
}

/** Fecha calendario actual en America/Lima (`YYYY-MM-DD`). */
export function limaTodayDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Fecha calendario en America/Lima desplazada `days` días desde hoy. */
export function limaDateOffset(days: number): string {
  const today = limaTodayDate();
  const base = new Date(`${today}T12:00:00-05:00`);
  base.setUTCDate(base.getUTCDate() + days);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(base);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Valor inicial razonable para `datetime-local` en zona Lima (+2 h). */
export function getDefaultScheduledForLocal(): string {
  const target = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(target);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}
