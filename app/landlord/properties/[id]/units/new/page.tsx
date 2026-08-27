import { requireBackendToken } from "@/lib/auth-guard";
import { getUnitTypes } from "@/lib/unit-types";
import { NewUnitForm } from "./new-unit-form";

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const unitTypes = await getUnitTypes(session.backendToken);

  return <NewUnitForm propertyId={Number(id)} unitTypes={unitTypes} />;
}