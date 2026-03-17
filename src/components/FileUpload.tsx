type FileUploadProps = {
  fileName: string | null;
  onSelect: (file: File | null) => void;
};

export default function FileUpload({ fileName, onSelect }: FileUploadProps) {
  return (
    <label className="block rounded-2xl border-2 border-dashed border-pine/40 bg-paper/90 p-8 text-center shadow-panel transition hover:border-clay">
      <input
        className="hidden"
        type="file"
        accept="application/pdf"
        onChange={(event) => {
          const selected = event.target.files?.[0] ?? null;
          onSelect(selected);
        }}
      />
      <p className="font-display text-2xl text-ink">Upload Knowledge PDF</p>
      <p className="mt-2 text-sm text-ink/70">Accepts .pdf files only</p>
      <div className="mx-auto mt-5 w-fit rounded-xl bg-pine px-5 py-2 text-sm font-semibold text-paper">
        Choose PDF
      </div>
      {fileName ? <p className="mt-4 text-sm text-pine">Selected: {fileName}</p> : null}
    </label>
  );
}
