interface SessionNoteInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SessionNoteInput({ value, onChange }: SessionNoteInputProps) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">Note</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Note (e.g., location, occasion)"
        className="mt-1 w-full px-4 py-2 min-h-[44px] border border-border rounded-full text-sm bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 transition-all duration-300"
      />
    </div>
  );
}
