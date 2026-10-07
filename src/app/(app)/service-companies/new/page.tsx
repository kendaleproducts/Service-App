import BackLink from "@/components/BackLink";
import CompanyForm from "../CompanyForm";
import { createServiceCompanyAction } from "../actions";

export default function NewServiceCompanyPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <BackLink fallbackHref="/service-companies" label="Back to service companies" />
        <h1 className="text-2xl font-semibold text-charcoal mt-1">Add Service Company</h1>
      </div>
      <CompanyForm action={createServiceCompanyAction} submitLabel="Create Company" />
    </div>
  );
}
