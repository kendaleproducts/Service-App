import CompanyForm from "../CompanyForm";
import { createServiceCompanyAction } from "../actions";

export default function NewServiceCompanyPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Add Service Company</h1>
      <CompanyForm action={createServiceCompanyAction} submitLabel="Create Company" />
    </div>
  );
}
