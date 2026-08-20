export type AppRole = "admin" | "tenant";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  rentAmount: number;
}