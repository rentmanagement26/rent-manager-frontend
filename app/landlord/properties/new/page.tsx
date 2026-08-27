import { requireBackendToken } from "@/lib/auth-guard";
import { getPropertyTypes } from "@/lib/property-types";
import { NewPropertyForm } from "./new-property-form";

export default async function NewPropertyPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const propertyTypes = await getPropertyTypes(session.backendToken);

  return <NewPropertyForm propertyTypes={propertyTypes} />;
}