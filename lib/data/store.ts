import type { Property } from "@/lib/types";

const globalForStore = globalThis as unknown as { __properties?: Property[] };
const properties = globalForStore.__properties ?? (globalForStore.__properties = []);

export function listProperties(): Property[] {
  return properties;
}

export function createProperty(input: Omit<Property, "id">): Property {
  const property: Property = { id: crypto.randomUUID(), ...input };
  properties.push(property);
  return property;
}

export function getProperty(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}