import { Minus, Plus } from "lucide-react";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  accentColor?: string;
}

export function Stepper({ value, onChange, accentColor }: StepperProps) {
  const set = (v: number) => onChange(Math.max(0, Math.round(v)));
  const activo = value > 0;
  const color = activo && accentColor ? accentColor : undefined;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => set(value - 1)}
        disabled={value <= 0}
        className="w-9 h-9 rounded-full border-[1.5px] border-line-strong text-plum flex items-center justify-center hover:border-plum disabled:opacity-30 disabled:hover:border-line-strong transition-colors"
        aria-label="Restar porción"
        type="button"
      >
        <Minus size={15} strokeWidth={2.5} />
      </button>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return set(0);
          const n = parseInt(v, 10);
          if (!Number.isNaN(n)) set(n);
        }}
        aria-label="Porciones"
        className="w-14 h-9 rounded-full text-center font-mono-num text-[16px] border-[1.5px] bg-panel focus:outline-none transition-colors placeholder:text-muted/60"
        style={{
          borderColor: color ?? "var(--color-line-strong)",
          color: color ?? "var(--color-ink)",
          fontWeight: activo ? 700 : 400,
          background: color ? `color-mix(in srgb, ${color} 7%, white)` : undefined,
        }}
      />
      <button
        onClick={() => set(value + 1)}
        className="w-9 h-9 rounded-full bg-lilac text-plum flex items-center justify-center hover:bg-plum hover:text-white transition-colors"
        aria-label="Sumar porción"
        type="button"
      >
        <Plus size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}
