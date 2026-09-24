"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/Badge";
import type { ServiceRequestWithJoins } from "@/lib/types";

export default function ServiceRequestRow({ r }: { r: ServiceRequestWithJoins }) {
  const router = useRouter();
  const href = `/service-requests/${r.id}`;

  return (
    <tr
      onClick={() => router.push(href)}
      className="border-b border-stone-50 last:border-0 hover:bg-stone-50 cursor-pointer"
    >
      <td className="px-4 py-2">
        <Link href={href} className="text-charcoal hover:underline">
          #{r.store_number} {r.location_name}
        </Link>
        <div className="text-xs text-stone-500">
          {r.city}
          {r.province ? `, ${r.province}` : ""}
        </div>
      </td>
      <td className="px-4 py-2 text-stone-600 max-w-xs truncate">{r.issue_description}</td>
      <td className="px-4 py-2">
        <Badge label={r.status} />
      </td>
      <td className="px-4 py-2">
        <Badge label={r.priority} />
      </td>
      <td className="px-4 py-2 text-stone-600">{r.service_company_name ?? "—"}</td>
      <td className="px-4 py-2 text-stone-600">{new Date(r.reported_at).toLocaleDateString()}</td>
    </tr>
  );
}
