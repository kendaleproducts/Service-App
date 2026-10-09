import { notFound } from "next/navigation";
import { getServiceRequest, listPartsForRequest } from "@/lib/data";
import BackLink from "@/components/BackLink";
import ServiceDeskMark from "@/components/ServiceDeskMark";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ServiceTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = getServiceRequest(Number(id));
  if (!request) notFound();

  const parts = listPartsForRequest(request.id);
  const serviceCost = request.cost ?? 0;

  return (
    <div className="min-h-screen bg-stone-100 py-8 print:bg-white print:py-0">
      <div className="no-print max-w-[8.5in] mx-auto mb-4 flex items-center justify-between">
        <BackLink fallbackHref={`/service-requests/${request.id}`} label="Back to service request" />
        <PrintButton label="Print Ticket" />
      </div>

      <div className="max-w-[8.5in] mx-auto bg-white border border-stone-200 print:border-0 p-10 text-sm text-charcoal">
        <div className="flex items-start justify-between border-b border-stone-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <ServiceDeskMark className="h-12 text-charcoal" badgeFill="#ffffff" />
            <div>
              <p className="font-heading font-semibold text-lg leading-tight">
                Kendale Service Desk
              </p>
              <p className="text-xs text-stone-500">Kendale Products Ltd &middot; Fort Erie, ON &middot; Service Ticket</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500">Service Request</p>
            <p className="text-2xl font-heading font-semibold">#{request.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
              Location
            </p>
            <p className="font-medium">
              #{request.store_number} {request.location_name}
            </p>
            {request.location_address && <p>{request.location_address}</p>}
            <p>
              {request.city}
              {request.city && request.province ? ", " : ""}
              {request.province} {request.location_postal_code ?? ""}
            </p>
            {request.location_phone && <p>{request.location_phone}</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
              Service Company
            </p>
            {request.service_company_name ? (
              <>
                <p className="font-medium">{request.service_company_name}</p>
                {request.service_company_contact && <p>{request.service_company_contact}</p>}
                {request.service_company_phone && <p>{request.service_company_phone}</p>}
              </>
            ) : (
              <p className="text-stone-500">Unassigned</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6 text-xs">
          <div>
            <p className="font-medium text-stone-500 uppercase tracking-wide mb-1">Status</p>
            <p className="text-sm text-charcoal">{request.status}</p>
          </div>
          <div>
            <p className="font-medium text-stone-500 uppercase tracking-wide mb-1">Priority</p>
            <p className="text-sm text-charcoal">{request.priority}</p>
          </div>
          <div>
            <p className="font-medium text-stone-500 uppercase tracking-wide mb-1">Reported</p>
            <p className="text-sm text-charcoal">{formatDate(request.reported_at)}</p>
          </div>
          <div>
            <p className="font-medium text-stone-500 uppercase tracking-wide mb-1">Completed</p>
            <p className="text-sm text-charcoal">{formatDate(request.completed_at)}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
            Equipment / Issue
          </p>
          {request.equipment_description && (
            <p className="font-medium">{request.equipment_description}</p>
          )}
          <p>{request.issue_description}</p>
        </div>

        <table className="w-full text-sm mb-4 border-t border-stone-200">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-200">
              <th className="py-2 font-medium">Part #</th>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p, i) => (
              <tr key={i} className="border-b border-stone-100">
                <td className="py-2">{p.part_number}</td>
                <td className="py-2">{p.description}</td>
                <td className="py-2 text-right">{p.quantity}</td>
              </tr>
            ))}
            {parts.length === 0 && (
              <tr>
                <td colSpan={3} className="py-3 text-stone-500">
                  No parts needed for this request.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-2 border-t border-stone-300 font-semibold text-base">
              <span>Service Cost</span>
              <span>${serviceCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <p className="mt-10 pt-4 border-t border-stone-200 text-xs text-stone-500">
          Generated by Kendale Service Desk for billing purposes. Reference
          Service Request #{request.id} on all related invoices and correspondence.
        </p>
      </div>
    </div>
  );
}
