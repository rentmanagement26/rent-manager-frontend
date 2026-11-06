// The contractor's home is their job list.
import { redirect } from "next/navigation";

export default function ContractorHomePage() {
  redirect("/contractor/jobs");
}
