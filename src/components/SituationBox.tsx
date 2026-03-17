type SituationBoxProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SituationBox({ value, onChange }: SituationBoxProps) {
  return (
    <div className="rounded-2xl bg-paper/95 p-6 shadow-panel">
      <h2 className="font-display text-2xl text-ink">Describe Your Situation</h2>
      <textarea
        className="mt-4 min-h-48 w-full rounded-xl border border-pine/30 bg-white px-4 py-3 text-base text-ink outline-none ring-clay/30 transition focus:ring"
        placeholder='Example: "I want to prepare for a software engineering interview."'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
