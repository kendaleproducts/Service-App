import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceCompany, listServiceRequests } from "@/lib/data";
import Badge from "@/components/Badge";
import CompanyForm from "../CompanyForm";
import { updateServiceCompanyAction } from "../actions";

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/service-companies" className="text-sm text-stone-500 hover:text-hotsauce">
          ← Back to service companies
        </Link>
        <h1 className="text-2xl font-semibold text-charcoal mt-1">{company.name}</h1>
        {(company.city || company.province) && (
          <p className="text-sm text-stone-500">
            {company.city}
            {company.city && company.province ? ", " : ""}
            {company.province}
          </p>
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
