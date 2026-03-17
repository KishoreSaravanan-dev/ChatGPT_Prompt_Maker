import { useState } from "react";
import OutputPage from "./pages/OutputPage";
import PromptGenerator from "./pages/PromptGenerator";
import Home from "./pages/Home";
import Stepper from "./components/Stepper";
import { generatePrompt, uploadPdf } from "./services/api";
import { extractAndCleanPDFText } from "./services/pdfParser";
import type { PromptResult } from "./types";

type Step = 1 | 2 | 3;

export default function App() {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [pdfContext, setPdfContext] = useState<string>("");
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState<PromptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      // Extract PDF text
      console.log("[App] Extracting PDF text...");
      const pdfText = await extractAndCleanPDFText(file, 8000);
      setPdfContext(pdfText);
      console.log(
        `[App] PDF extracted successfully (${pdfText.length} characters)`
      );

      // Process the file
      await uploadPdf(file);
      setStep(2);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to extract PDF text";
      console.error("[App] PDF extraction error:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Generate prompt with PDF context
      console.log("[App] Generating prompt with situation and PDF context...");
      const data = await generatePrompt(situation.trim(), pdfContext);
      setResult(data);
      setStep(3);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to generate prompt";
      console.error("[App] Prompt generation error:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      console.log("[App] Prompt copied to clipboard");
    } catch {
      console.error("[App] Failed to copy prompt");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Stepper step={step} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Error: {error}</p>
        </div>
      ) : null}

      {step === 1 ? (
        <Home
          fileName={file?.name ?? null}
          onSelectFile={setFile}
          onContinue={handleContinue}
          loading={loading}
        />
      ) : null}

      {step === 2 ? (
        <PromptGenerator
          situation={situation}
          onSituationChange={setSituation}
          onGenerate={handleGenerate}
          onBack={() => setStep(1)}
          loading={loading}
          pdfFileName={file?.name}
        />
      ) : null}

      {step === 3 && result ? (
        <OutputPage
          result={result}
          onBack={() => setStep(2)}
          onCopy={handleCopy}
          onRegenerate={handleGenerate}
        />
      ) : null}
    </main>
  );
}
