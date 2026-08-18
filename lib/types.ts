export type AppRole = "admin" | "tenant";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}