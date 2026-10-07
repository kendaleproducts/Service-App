"use client";

export default function ConfirmSubmitButton({
  action,
  confirmMessage,
  label,
  variant = "danger",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  variant?: "danger" | "neutral";
}) {
  const classes =
    variant === "danger"
      ? "border-red-200 text-red-700 hover:bg-red-50"
      : "border-stone-300 text-stone-600 hover:bg-stone-50";

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${classes}`}
      >
        {label}
      </button>
    </form>
  );
}
