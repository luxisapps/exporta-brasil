import type { PortFacility } from "@exporta/domain";
export type PortCityOption = { name: string; state: string };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
export const portCityKey = (city: PortCityOption) => `${normalize(city.name)}:${city.state}`;
export function portCityOptions(facilities: PortFacility[], current?: PortCityOption | null): PortCityOption[] {
  const cities = new Map<string, PortCityOption>();
  for (const facility of facilities) {
    const city = { name: facility.municipality?.trim(), state: facility.state?.trim().toUpperCase() };
    if (city.name && /^[A-Z]{2}$/.test(city.state)) cities.set(portCityKey(city), city);
  }
  // Keep existing settings editable when the catalog is unavailable or changes.
  if (current?.name && current.state) cities.set(portCityKey(current), current);
  return [...cities.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.state.localeCompare(b.state));
}
