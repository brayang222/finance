import type { ReactNode } from "react";

export const Tab = ({ active, label, onClick }: { active?: boolean; label?: string; onClick?: () => void; color?: string }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-[13px] border-b-2 bg-transparent cursor-pointer tracking-[0.2px] transition-colors ${
      active ? "border-text text-text font-medium" : "border-transparent text-muted font-normal"
    }`}
  >
    {label}
  </button>
);

export const Card = ({ title, value, sub }: { title?: string; value?: ReactNode; color?: string; sub?: string }) => (
  <div className="bg-surface border border-border rounded-lg px-5 py-4 min-w-[130px] flex-1">
    <div className="text-[11px] text-muted mb-1.5 uppercase tracking-[0.08em]">{title}</div>
    <div className="text-[22px] font-semibold text-text">{value}</div>
    {sub && <div className="text-[11px] text-dim mt-1">{sub}</div>}
  </div>
);

export const Input = ({ label, className: cls, ...p }: { label?: string; className?: string; [key: string]: any }) => (
  <div className="flex flex-col gap-1 flex-1">
    {label && <label className="text-[11px] text-muted tracking-[0.05em]">{label}</label>}
    <input
      {...p}
      className={`bg-surface border border-border rounded-md px-2.5 py-2 text-text text-[13px] outline-none ${cls || ""}`}
    />
  </div>
);

export const Select = ({ label, options, ...p }: { label?: string; options: string[]; [key: string]: any }) => (
  <div className="flex flex-col gap-1 flex-1">
    {label && <label className="text-[11px] text-muted tracking-[0.05em]">{label}</label>}
    <select
      {...p}
      className="bg-surface border border-border rounded-md px-2.5 py-2 text-text text-[13px] outline-none"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export const Btn = ({ children, onClick, color = "", small, disabled, type = "button" }: {
  children?: ReactNode;
  onClick?: () => void;
  color?: string;
  small?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) => {
  const isGreen = color && (color.toLowerCase().includes("27ae60") || color.toLowerCase().includes("4ade80") || color === "#27AE60");
  const isBlue = color && (color.toLowerCase().includes("2d9cdb") || color.toLowerCase().includes("60a5fa") || color === "#2D9CDB");

  const accentClass = isGreen
    ? "border-accent-green text-accent-green"
    : isBlue
    ? "border-accent-blue text-accent-blue"
    : "border-btn-bd text-text";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-btn border rounded-md tracking-[0.2px] transition-colors
        ${small ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-[12px]"}
        ${disabled ? "border-btn bg-bg text-dim cursor-not-allowed" : `${accentClass} cursor-pointer`}
      `}
    >
      {children}
    </button>
  );
};

export const Modal = ({ open, title, onClose, children }: { open?: boolean; title?: string; onClose?: () => void; children?: ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000] p-3">
      <div className="w-full max-w-[520px] bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-border">
          <div className="text-[13px] font-medium text-text">{title}</div>
          <button onClick={onClose} className="bg-transparent border-none text-muted cursor-pointer text-base leading-none">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export const Section = ({ title, children }: { title?: string; children?: ReactNode }) => (
  <div className="mb-5">
    {title && <div className="text-[10px] text-dim mb-2.5 uppercase tracking-[0.1em]">{title}</div>}
    {children}
  </div>
);
