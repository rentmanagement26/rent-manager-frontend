export type AppRole = "Admin" | "Landlord" | "Tenant" |  "Contractor";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  backendToken?: string;
  backendTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
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
  units: Unit[];
}

export interface Unit {
  id: number;
  label: string;
  unitType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
  status: string;
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

export interface UpdateUnitInput {
  unitTypeId: number;
  label: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
  status: string;
}

export interface MediaItem {
  id: number;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface TenantInvitePreview {
  email: string;
  landlordName: string;
  unitLabel: string;
  propertyName: string;
  addressLine: string;
  expiresAt: string;
  isExpired: boolean;
  isUsed: boolean;
}

export interface CreateTenantInviteResult {
  token: string;
  inviteUrl: string;
  expiresAt: string;
}

export interface TenantInviteListItem {
  id: number;
  email: string;
  unitLabel: string;
  propertyName: string;
  createdAt: string;
  expiresAt: string;
  status: "Pending" | "Accepted" | "Declined" | "Expired";
}

export interface TenantInviteStats {
  sent: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
}

export interface RegisterTenantInput {
  token: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  password: string;
}

export interface RegisterTenantResult {
  message: string;
  userId: string;
  email: string;
}
