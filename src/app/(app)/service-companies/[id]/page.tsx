import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceCompany, listServiceRequests } from "@/lib/data";
import Badge from "@/components/Badge";
import BackLink from "@/components/BackLink";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { isAdmin } from "@/lib/session";
import CompanyForm from "../CompanyForm";
import {
  deleteServiceCompanyAction,
  unassignCompanyFromHistoryAction,
  updateServiceCompanyAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ServiceCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = getServiceCompany(Number(id));
  if (!company) notFound();

  const requests = listServiceRequests({ companyId: company.id });
  const updateWithId = updateServiceCompanyAction.bind(null, company.id);
  const deleteWithId = deleteServiceCompanyAction.bind(null, company.id);
  const unassignWithId = unassignCompanyFromHistoryAction.bind(null, company.id);
  const admin = await isAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <BackLink fallbackHref="/service-companies" label="Back to service companies" />
          <h1 className="text-2xl font-semibold text-charcoal mt-1">{company.name}</h1>
          {(company.city || company.province) && (
            <p className="text-sm text-stone-500">
              {company.city}
              {company.city && company.province ? ", " : ""}
              {company.province}
            </p>
          )}
        </div>
        {admin && (
          <div className="flex items-start gap-2">
            {requests.length > 0 && (
              <ConfirmSubmitButton
                action={unassignWithId}
                label="Unassign from History"
                variant="neutral"
                confirmMessage={`Unassign ${company.name} from all ${requests.length} service request(s) it's attached to? The requests themselves stay on file — only the vendor link is cleared. This cannot be undone.`}
              />
            )}
            <ConfirmSubmitButton
              action={deleteWithId}
              label="Delete Company"
              confirmMessage={`Permanently delete ${company.name}? Any service requests assigned to it will be unassigned (kept on file) rather than deleted. This cannot be undone.`}
            />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <CompanyForm action={updateWithId} company={company} submitLabel="Save Changes" />

        <div className="bg-white border border-stone-200 rounded-lg">
          <div className="px-4 py-3 border-b border-stone-200">
            <h2 className="font-medium text-charcoal">Assigned Service Requests</h2>
          </div>
          {requests.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500">
              No service requests assigned to this company yet.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {requests.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <Link
                    href={`/service-requests/${r.id}`}
                    className="text-sm font-medium text-charcoal hover:underline"
                  >
                    #{r.store_number} {r.location_name} — {r.issue_description}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <Badge label={r.status} />
                    <Badge label={r.priority} />
                    <span className="text-xs text-stone-500">
                      {new Date(r.reported_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
