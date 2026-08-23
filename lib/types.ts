export type AppRole = "Admin" | "Landlord" | "Contractor";

export interface SessionUser {
  id: string;
  email: string;
  role: AppRole;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  rentAmount: number;
}