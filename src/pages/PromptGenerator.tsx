import SituationBox from "../components/SituationBox";

// Example situations for quick start
const EXAMPLE_SITUATIONS = [
  {
    title: "Write a Resume",
    text: "I need help writing a professional resume that showcases my skills and experience to land interviews at top tech companies.",
  },
  {
    title: "Coding Interview",
    text: "I want to prepare for a software engineering interview. Create a prompt that will help me practice technical questions and improve my problem-solving approach.",
  },
  {
    title: "Marketing Email",
    text: "I need to write compelling marketing emails for my product that increase open rates and drive conversions. Help me create a prompt for this.",
  },
  {
    title: "Machine Learning Help",
    text: "I'm learning machine learning and need a structured approach to understanding key concepts. Create a prompt that helps me study efficiently.",
  },
];

type PromptGeneratorProps = {
  situation: string;
  onSituationChange: (value: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  loading: boolean;
  pdfFileName?: string;
};

export default function PromptGenerator({
  situation,
  onSituationChange,
  onGenerate,
  onBack,
  loading,
  pdfFileName,
}: PromptGeneratorProps) {
  return (
    <div className="animate-rise space-y-6">
      {pdfFileName ? (
        <div className="rounded-lg bg-pine/5 border border-pine/30 p-4">
          <p className="text-sm text-ink/70">
            📄 <span className="font-semibold">PDF Knowledge Loaded:</span>{" "}
            {pdfFileName}
          </p>
          <p className="text-xs text-ink/60 mt-1">
            Your prompt will be optimized using principles from this document.
          </p>
        </div>
      ) : null}

      <SituationBox value={situation} onChange={onSituationChange} />

      <div>
        <p className="text-sm font-semibold text-ink/70 mb-2">
          Quick Start Examples:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_SITUATIONS.map((example) => (
            <button
              key={example.title}
              type="button"
              onClick={() => onSituationChange(example.text)}
              className="rounded-lg border border-pine/30 bg-white px-3 py-2 text-left text-sm transition hover:bg-pine/5 hover:border-pine/60"
              title={`Use example: ${example.title}`}
            >
              <p className="font-medium text-ink">{example.title}</p>
              <p className="text-xs text-ink/60 line-clamp-1 mt-0.5">
                {example.text}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-pine px-4 py-2 text-sm font-semibold text-pine transition hover:bg-pine/10"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!situation.trim() || loading}
          onClick={onGenerate}
          className="rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Prompt"}
        </button>
      </div>
    </div>
  );
}
