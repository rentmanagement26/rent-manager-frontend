export type AppRole = "Admin" | "Landlord" | "Tenant" |  "Contractor";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  backendToken?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phonenumber: number;
}

export interface PropertyType {
  id: number;
  name: string;
}

export interface CreatePropertyInput {
  name: string;
  propertyTypeId: number;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Property {
  id: number;
  name: string;
  propertyType: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  units: unknown[];
}

export interface Unit {
  unitTypeId: number;
  label: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
}

export interface UnitType {
  id: number;
  name: string;
}

export interface CreateUnitInput {
  unitTypeId: number;
  label: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
}