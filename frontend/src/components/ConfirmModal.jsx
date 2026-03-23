export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const confirmClassName =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-slate-800 hover:bg-slate-900";

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="modal-card w-full max-w-md">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn btn-muted text-sm disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`btn text-sm text-white disabled:opacity-60 ${confirmClassName}`}
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
