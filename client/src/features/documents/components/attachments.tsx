import { Download, Globe, ImagePlus, Lock, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SimpleSelect } from "@/components/common/simple-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DOCUMENT_TYPES } from "@/config/constants";
import { fileUrl, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { documentsApi } from "../api";
import { useDeleteDocument, useDeleteMedia, useSetCover, useUpdateDocument, useUpdateMedia } from "../hooks";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

type Media = { id: string; fileKey: string; title: string | null; isCover: boolean };
type Doc = {
  id: string; name: string; type: string | null; fileKey: string; isPublic: boolean; createdAt: string;
  uploadedByName?: string | null;
};

// Téléversement vers /api/upload (contrôles de format, taille et signature côté serveur)
const uploadFile = documentsApi.upload;

const ext = (key: string) => key.split(".").pop()?.toUpperCase() ?? "DOC";

export function DocumentUploader({ opportunityId, onUploaded, className }: {
  opportunityId: string;
  onUploaded: () => void;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<string>("Fiche projet");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        await uploadFile({ file, opportunityId, kind: "document", type, isPublic });
        toast.success(`« ${file.name} » ajouté`);
      } catch (e) {
        toast.error(`${file.name} : ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    onUploaded();
  };

  return (
    <div className={cn("rounded-lg border-2 border-dashed bg-surface-low/50 p-5", className)}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <p className="text-[13px] font-semibold text-secondary">Type de document</p>
          <SimpleSelect value={type} onChange={(v) => setType(v ?? "Fiche projet")} options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))} />
        </div>
        <label className="flex h-10 items-center gap-2 text-sm">
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          {isPublic ? "Public" : "Réservé aux connectés"}
        </label>
        <Button type="button" className="h-10" disabled={busy} onClick={() => input.current?.click()}>
          <Upload /> {busy ? "Téléversement…" : "Ajouter des fichiers"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint · 20 Mo maximum par fichier.</p>
      <input
        ref={input} type="file" multiple hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}

export function DocumentList({ documents, onChange }: { documents: Doc[]; onChange: () => void }) {
  const [toDelete, setToDelete] = useState<Doc | null>(null);
  const update = useUpdateDocument({ onSuccess: onChange, onError: (e) => toast.error(e.message) });
  const remove = useDeleteDocument({
    onSuccess: () => { toast.success("Document supprimé"); onChange(); },
    onError: (e) => toast.error(e.message),
  });
  if (!documents.length) return <p className="text-sm text-muted-foreground">Aucun document rattaché.</p>;
  return (
    <>
      <ul className="space-y-2">
        {documents.map((d) => (
          <li key={d.id} className="flex flex-col gap-3 rounded-md border bg-white p-3 sm:flex-row sm:items-center">
            <span className="label-caps flex h-10 w-12 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">{ext(d.fileKey)}</span>
            <div className="min-w-0 flex-1">
              <Input
                defaultValue={d.name}
                aria-label="Nom du document"
                className="h-8 border-transparent px-1 font-semibold shadow-none hover:border-input focus:border-input"
                onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== d.name && update.mutate({ id: d.id, name: e.target.value.trim() })}
              />
              <p className="px-1 text-xs text-muted-foreground">{d.type} · {formatDate(d.createdAt)}{d.uploadedByName ? ` · ${d.uploadedByName}` : ""}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => update.mutate({ id: d.id, isPublic: !d.isPublic })}
                className={cn("flex h-8 items-center gap-1 rounded px-2 text-xs font-semibold", d.isPublic ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}
                title="Changer la visibilité"
              >
                {d.isPublic ? <><Globe className="size-3.5" /> Public</> : <><Lock className="size-3.5" /> Membres</>}
              </button>
              <a href={fileUrl(d.fileKey)} target="_blank" rel="noopener" className="flex size-8 items-center justify-center rounded text-secondary hover:bg-muted" aria-label="Télécharger"><Download className="size-4" /></a>
              <button type="button" onClick={() => setToDelete(d)} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-700" aria-label="Supprimer"><Trash2 className="size-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer ce document ?" description={<>« {toDelete?.name} » et son fichier seront supprimés.</>}
        confirmLabel="Supprimer" onConfirm={() => toDelete && remove.mutate({ id: toDelete.id })}
      />
    </>
  );
}

export function MediaGallery({ opportunityId, media, onChange }: { opportunityId: string; media: Media[]; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const opts = { onSuccess: onChange, onError: (e: { message: string }) => toast.error(e.message) };
  const setCover = useSetCover(opts);
  const update = useUpdateMedia(opts);
  const remove = useDeleteMedia(opts);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        await uploadFile({ file, opportunityId, kind: "image" });
      } catch (e) {
        toast.error(`${file.name} : ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    onChange();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {media.map((m) => (
          <figure key={m.id} className={cn("group relative overflow-hidden rounded-lg border bg-white", m.isCover && "ring-2 ring-ochre")}>
            <img src={fileUrl(m.fileKey)} alt={m.title ?? ""} className="aspect-[4/3] w-full object-cover" />
            {m.isCover && <span className="label-caps absolute top-2 left-2 rounded bg-ochre px-2 py-0.5 text-white">Couverture</span>}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              {!m.isCover && (
                <button type="button" onClick={() => setCover.mutate({ id: m.id })} className="flex size-7 items-center justify-center rounded bg-white/95 text-ochre shadow" aria-label="Définir comme couverture" title="Définir comme couverture">
                  <Star className="size-3.5" />
                </button>
              )}
              <button type="button" onClick={() => remove.mutate({ id: m.id })} className="flex size-7 items-center justify-center rounded bg-white/95 text-red-700 shadow" aria-label="Supprimer l'image">
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <figcaption className="p-1.5">
              <Input
                defaultValue={m.title ?? ""} placeholder="Légende…" aria-label="Légende"
                className="h-7 border-transparent px-1 text-xs shadow-none hover:border-input focus:border-input"
                onBlur={(e) => e.target.value !== (m.title ?? "") && update.mutate({ id: m.id, title: e.target.value })}
              />
            </figcaption>
          </figure>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-surface-low/50 text-sm font-semibold text-secondary transition hover:border-primary hover:text-primary"
        >
          <ImagePlus className="size-6" /> {busy ? "Envoi…" : "Ajouter des images"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">PNG, JPEG ou WebP · 5 Mo maximum. La première image sert de couverture ; survolez une image pour la changer.</p>
      <input ref={input} type="file" accept=".png,.jpg,.jpeg,.webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}
