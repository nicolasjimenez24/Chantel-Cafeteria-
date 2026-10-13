import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: "sm" | "lg";
}

export function Modal({ titulo, subtitulo, onClose, children, pie, ancho = "sm" }: ModalProps) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`w-full ${ancho === "lg" ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-panel shadow-2xl flex flex-col max-h-[88vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
          <div>
            <h3 className="font-display text-[22px] leading-tight text-plum">{titulo}</h3>
            {subtitulo && <p className="text-[13px] text-muted mt-1 leading-snug">{subtitulo}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
            className="w-8 h-8 rounded-full text-muted hover:bg-panel-alt hover:text-ink flex items-center justify-center shrink-0"
          >
            <X size={17} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
        {pie && <div className="px-6 py-4 border-t border-line flex flex-wrap justify-end gap-2">{pie}</div>}
      </div>
    </div>
  );
}
