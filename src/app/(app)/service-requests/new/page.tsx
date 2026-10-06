import { listLocations, listServiceCompanies } from "@/lib/data";
import { createServiceRequestAction, getLocationEquipmentAction } from "../actions";
import NewServiceRequestForm from "./NewServiceRequestForm";

export default async function NewServiceRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const params = await searchParams;
  const locations = listLocations({ status: "Open" });
  const companies = listServiceCompanies();
  const preselected = params.locationId ? Number(params.locationId) : undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-charcoal">New Service Request</h1>
      <NewServiceRequestForm
        action={createServiceRequestAction}
        getEquipmentForLocation={getLocationEquipmentAction}
        locations={locations}
        companies={companies}
        preselectedLocationId={preselected}
      />
    </div>
  );
}
