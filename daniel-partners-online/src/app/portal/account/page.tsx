import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/session";
import { saveProfile } from "../actions";

export default async function AccountPage({ searchParams }: PageProps<"/portal/account">) {
  const user = await requireUser("client");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl normal-case tracking-normal text-brand-black">Your details</h1>
      <form action={saveProfile} className="card mt-8 space-y-5 p-6">
        <div>
          <label className="label" htmlFor="name">Full legal name</label>
          <input id="name" name="name" defaultValue={user.name} className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" value={user.email} className="field bg-ivory" readOnly />
          <p className="mt-1 text-xs text-mist">Contact the firm to change the email on your account.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={user.phone ?? ""} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="city">City or town</label>
            <input id="city" name="city" defaultValue={user.city ?? ""} className="field" />
          </div>
        </div>
        {sp.saved === "1" && <p className="text-sm text-green">Saved.</p>}
        <SubmitButton className="btn-dark" pendingText="Saving…">Save changes</SubmitButton>
      </form>
    </div>
  );
}
