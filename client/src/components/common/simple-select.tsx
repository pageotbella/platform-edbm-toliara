import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

/** Liste déroulante simple. `allLabel` ajoute une option « tous » de valeur null. */
export function SimpleSelect({
  value, onChange, options, placeholder = "Sélectionner…", allLabel, className, id, disabled, invalid,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  allLabel?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const items = [...(allLabel ? [{ value: null, label: allLabel }] : []), ...options];
  return (
    <Select
      items={items}
      value={value ?? null}
      onValueChange={(v) => onChange((v as string | null) ?? null)}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-invalid={invalid || undefined} className={cn("h-10 w-full bg-white", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((o) => (
          <SelectItem key={o.value ?? "__all"} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
