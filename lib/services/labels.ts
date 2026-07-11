import type { ServiceUnit } from "@/lib/auth/types";

const SERVICE_UNIT_LABELS: Record<ServiceUnit, string> = {
  kg: "kilogramo",
  unit: "unidad",
  pair: "par",
  set: "conjunto",
  other: "otro",
};

export function getServiceUnitLabel(unit: ServiceUnit): string {
  return SERVICE_UNIT_LABELS[unit];
}

export const SERVICE_UNIT_OPTIONS: ReadonlyArray<{
  value: ServiceUnit;
  label: string;
}> = (
  Object.entries(SERVICE_UNIT_LABELS) as Array<[ServiceUnit, string]>
).map(([value, label]) => ({ value, label }));
