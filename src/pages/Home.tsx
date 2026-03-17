import FileUpload from "../components/FileUpload";

type HomeProps = {
  fileName: string | null;
  onSelectFile: (file: File | null) => void;
  onContinue: () => void;
  loading: boolean;
};

export default function Home({ fileName, onSelectFile, onContinue, loading }: HomeProps) {
  return (
    <div className="animate-rise space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">AI Prompt Builder</h1>
        <p className="mx-auto max-w-2xl text-sm text-ink/75 sm:text-base">
          Upload your prompt knowledge PDF and generate a tailored prompt for any real-world situation.
        </p>
      </header>

      <FileUpload fileName={fileName} onSelect={onSelectFile} />

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!fileName || loading}
          onClick={onContinue}
          className="rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
