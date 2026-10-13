import { useEffect } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md shadow-lg text-[13.5px] font-medium flex items-center gap-2 bg-espresso text-cream">
      <Check size={15} />
      {message}
    </div>
  );
}
