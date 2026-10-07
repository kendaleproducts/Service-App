import { listLocations, listParts, listServiceCompanies } from "@/lib/data";
import BackLink from "@/components/BackLink";
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
  const parts = listParts();
  const preselected = params.locationId ? Number(params.locationId) : undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <BackLink fallbackHref="/service-requests" label="Back to service requests" />
        <h1 className="text-2xl font-semibold text-charcoal mt-1">New Service Request</h1>
      </div>
      <NewServiceRequestForm
        action={createServiceRequestAction}
        getEquipmentForLocation={getLocationEquipmentAction}
        locations={locations}
        companies={companies}
        parts={parts}
        preselectedLocationId={preselected}
      />
    </div>
  );
}
