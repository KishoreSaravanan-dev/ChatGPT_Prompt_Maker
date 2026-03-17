import PromptResult from "../components/PromptResult";
import type { PromptResult as PromptResultType } from "../types";

type OutputPageProps = {
  result: PromptResultType;
  onBack: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
};

export default function OutputPage({ result, onBack, onCopy, onRegenerate }: OutputPageProps) {
  return (
    <div className="animate-rise space-y-6">
      <PromptResult result={result} onCopy={onCopy} onRegenerate={onRegenerate} />
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg border border-pine px-4 py-2 text-sm font-semibold text-pine transition hover:bg-pine/10"
      >
        Back to Situation
      </button>
    </div>
  );
}
