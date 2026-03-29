interface ClipboardFallbackModalProps {
  text: string | null;
  onClose: () => void;
}

export function ClipboardFallbackModal({ text, onClose }: ClipboardFallbackModalProps) {
  if (text === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-[2rem] bg-background p-5 shadow-float border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Copy the text below manually
        </h2>
        <textarea
          readOnly
          value={text}
          rows={10}
          className="w-full rounded-2xl border border-border bg-muted/50 p-3 text-sm text-foreground select-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full min-h-[44px] rounded-full bg-muted text-sm font-medium text-accent-foreground hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
