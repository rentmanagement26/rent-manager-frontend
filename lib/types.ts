export type AppRole = "Admin" | "Landlord" | "Tenant" |  "Contractor";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phonenumber: number;
}

export interface Property {
  id: string;
  name: string;
  propertyTypeId: number;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}