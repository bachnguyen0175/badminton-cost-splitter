interface ClipboardFallbackModalProps {
  text: string | null;
  onClose: () => void;
}

export function ClipboardFallbackModal({ text, onClose }: ClipboardFallbackModalProps) {
  if (text === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-sm font-medium text-gray-700">
          Copy the text below manually
        </h2>
        <textarea
          readOnly
          value={text}
          rows={10}
          className="w-full rounded border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800 select-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full min-h-[44px] rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}
