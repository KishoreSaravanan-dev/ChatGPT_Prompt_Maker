type StepperProps = {
  step: 1 | 2 | 3;
};

const labels = ["Upload PDF", "Your Situation", "Prompt Output"];

export default function Stepper({ step }: StepperProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {labels.map((label, index) => {
        const active = index + 1 <= step;
        return (
          <div
            key={label}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              active
                ? "border-pine bg-pine text-paper"
                : "border-pine/30 bg-paper/70 text-pine"
            }`}
          >
            {index + 1}. {label}
          </div>
        );
      })}
    </div>
  );
}
