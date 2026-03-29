interface SessionNoteInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SessionNoteInput({ value, onChange }: SessionNoteInputProps) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">Note</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Note (e.g., location, occasion)"
        className="mt-1 w-full px-3 py-2 min-h-[44px] border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
