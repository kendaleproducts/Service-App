import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppointment } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function MeetingRoomPage({ params }: PageProps<"/portal/meet/[id]">) {
  const { id } = await params;
  const user = await requireUser("client");
  const appt = getAppointment(Number(id));
  if (!appt || appt.client_id !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/portal/matters/${appt.matter_id}`} className="text-xs uppercase tracking-[0.18em] text-slate hover:text-gold-deep">← {appt.matter_reference}</Link>
      <h1 className="mt-4 text-3xl normal-case tracking-normal text-brand-black">Video room</h1>
      <p className="mt-2 text-slate">{appt.purpose} · {formatDateTime(appt.starts_at)}{appt.lawyer_name ? ` · ${appt.lawyer_name}` : ""}</p>
      <div className="card-dark mt-8 flex aspect-video flex-col items-center justify-center p-8 text-center">
        <span className="font-serif text-6xl text-gold">&amp;</span>
        <p className="mt-4 font-display text-sm uppercase tracking-[0.24em] text-white/80">Secure video meeting</p>
        <p className="mt-4 max-w-md text-sm text-white/60">
          This sandbox does not run live video. In production this room embeds the firm&apos;s video provider (for example Zoom, Microsoft Teams or a Canadian-hosted WebRTC service) and the join link is emailed with the calendar invitation.
        </p>
        <button type="button" className="btn-white mt-6" disabled>
          Join meeting
        </button>
      </div>
      <ul className="mt-6 space-y-2 text-sm text-slate">
        <li>• Have your government-issued photo ID ready; your lawyer will verify it on camera.</li>
        <li>• Use a private space. Anything discussed is privileged.</li>
        <li>• Documents you want to discuss can be uploaded to the matter beforehand.</li>
      </ul>
    </div>
  );
}
