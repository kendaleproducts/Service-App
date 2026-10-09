"use client";

export default function CloseTicketForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Close this ticket? It becomes read-only until reopened.")) {
          e.preventDefault();
        }
      }}
      className="bg-white border border-stone-200 rounded-lg p-4 space-y-3"
    >
      <div>
        <h2 className="font-medium text-charcoal">Close Ticket</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Once the problem is solved. Summarize what fixed it — this goes on the printed ticket.
        </p>
      </div>
      <textarea
        name="resolution"
        required
        rows={3}
        placeholder="Resolution (e.g. replaced lid interlock switch, tested through 3 full cycles)"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
      >
        Close Ticket
      </button>
    </form>
  );
}
