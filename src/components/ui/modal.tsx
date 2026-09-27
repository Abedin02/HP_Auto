import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Built on the native <dialog>: showModal() gives focus trapping, Esc-to-close
 * and top-layer stacking without a dependency.
 */
export function Modal({ isOpen, onClose, title, eyebrow, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={event => event.target === ref.current && onClose()}
      aria-labelledby={titleId}
      className={cn(
        "m-auto w-[min(34rem,calc(100vw-2rem))] border border-line bg-ink p-0 text-ivory shadow-2xl backdrop:bg-ink/75 backdrop:backdrop-blur-md open:animate-fade-up",
        className,
      )}
    >
      <div className="relative p-8 md:p-10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 grid size-10 place-items-center rounded-full text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
        >
          <X className="size-5" strokeWidth={1.5} />
        </button>
        {eyebrow && <p className="eyebrow text-[0.62rem] text-champagne">{eyebrow}</p>}
        <h2 id={titleId} className="mt-3 pr-10 font-display text-3xl leading-tight md:text-4xl">
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </dialog>
  );
}
