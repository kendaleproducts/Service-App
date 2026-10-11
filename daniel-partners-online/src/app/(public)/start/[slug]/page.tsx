import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug, pickLawyerFor, takenSlots } from "@/lib/data";
import { formatMoney, formatTime } from "@/lib/format";
import { availableSlots } from "@/lib/scheduling";
import { getCurrentUser } from "@/lib/session";
import IntakeForm from "./IntakeForm";

export async function generateMetadata({ params }: PageProps<"/start/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  return { title: service ? `Start: ${service.name}` : "Start" };
}

export default async function StartPage({ params }: PageProps<"/start/[slug]">) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service || !service.active) notFound();

  const user = await getCurrentUser();
  const lawyer = pickLawyerFor(service.practice_area);
  const slotDays = availableSlots(takenSlots(lawyer?.id ?? null), 8, service.consultation_minutes);
  const timeLabels: Record<string, string> = {};
  for (const d of slotDays) for (const s of d.slots) timeLabels[s.iso] = formatTime(s.iso);

  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link href={`/services/${service.slug}`} className="text-xs uppercase tracking-[0.18em] text-slate hover:text-gold-deep">
          ← {service.name}
        </Link>
        <p className="eyebrow mt-6">Start a matter</p>
        <h1 className="mt-2 text-3xl sm:text-4xl text-brand-black">{service.name}</h1>
        <p className="mt-3 text-slate">
          {service.fee_label} {formatMoney(service.fee_cents)} + HST · {service.timeline}
        </p>
        <div className="mt-8">
          <IntakeForm
            service={{
              slug: service.slug,
              name: service.name,
              fee_label: service.fee_label,
              fee_display: formatMoney(service.fee_cents),
              consultation_minutes: service.consultation_minutes,
              questions: service.questions,
            }}
            lawyerName={lawyer?.name ?? null}
            slotDays={slotDays}
            signedIn={user && user.role === "client" ? { name: user.name, email: user.email } : null}
            timeLabels={timeLabels}
          />
        </div>
      </div>
    </section>
  );
}
