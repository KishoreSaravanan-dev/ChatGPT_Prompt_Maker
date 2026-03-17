import { useState } from "react";
import type { PromptResult as PromptResultType } from "../types";

type PromptResultProps = {
  result: PromptResultType;
  onCopy: () => void;
  onRegenerate: () => void;
};

export default function PromptResult({
  result,
  onCopy,
  onRegenerate,
}: PromptResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split sections if they contain separator lines
  const splitSection = (text: string) => {
    return text.split(/-{3,}/).filter((s) => s.trim());
  };

  return (
    <div className="space-y-4 rounded-2xl bg-paper/95 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Generated Prompt</h2>
        <span className="text-xs font-medium text-pine/70">✓ Ready to use</span>
      </div>

      {/* Prompt Section */}
      <section className="rounded-xl border border-clay/30 bg-gradient-to-br from-clay/5 to-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-clay text-lg">📝 Prompt</h3>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg bg-clay px-3 py-1 text-xs font-semibold text-white transition hover:brightness-95"
            title="Copy prompt to clipboard"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm text-ink/90 leading-relaxed">
          {result.prompt}
        </p>
      </section>

      {/* Structure Section */}
      <section className="rounded-xl border border-pine/25 bg-white p-5">
        <h3 className="font-semibold text-pine text-lg mb-3">🏗️ Structure</h3>
        <div className="text-sm text-ink/85 space-y-2 leading-relaxed">
          {splitSection(result.structure).length > 1 ? (
            splitSection(result.structure).map((part, idx) => (
              <div key={idx} className="pl-3 border-l-2 border-pine/30">
                <p className="whitespace-pre-wrap">{part.trim()}</p>
              </div>
            ))
          ) : (
            <p className="whitespace-pre-wrap">{result.structure}</p>
          )}
        </div>
      </section>

      {/* Explanation Section */}
      <section className="rounded-xl border border-pine/20 bg-blue-50 p-5">
        <h3 className="font-semibold text-ink text-lg mb-3">💡 Why It Works</h3>
        <p className="text-sm text-ink/85 whitespace-pre-wrap leading-relaxed">
          {result.explanation}
        </p>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 flex items-center gap-2"
        >
          {copied ? "✓ Copied" : "📋 Copy Prompt"}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="rounded-lg border border-pine px-5 py-2.5 text-sm font-semibold text-pine transition hover:bg-pine/10"
        >
          🔄 Regenerate
        </button>
      </div>
    </div>
  );
}
