import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={[
        'rounded-2xl border border-[#9B2020]/[0.18] bg-[#200606]/55 shadow-xl shadow-black/50 backdrop-blur-sm',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <div className="border-b border-[#9B2020]/[0.15] px-6 py-4">
      <div className="text-base font-semibold text-white/90">{title}</div>
      {subtitle != null ? (
        <div className="mt-0.5 text-sm text-white/40">{subtitle}</div>
      ) : null}
    </div>
  );
}

// ── Form elements ─────────────────────────────────────────────────────────────

export function FieldLabel({
  children,
  htmlFor,
}: LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-white/60"
    >
      {children}
    </label>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        'w-full resize-y rounded-xl border border-white/[0.08] bg-black/35 px-3.5 py-2.5 text-sm text-white/85 placeholder:text-white/20 outline-none transition',
        'focus:border-[#8B1A1A]/50 focus:ring-2 focus:ring-[#8B1A1A]/12',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

// ── Button ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'ghost';

export function Button({
  variant = 'primary',
  loading,
  children,
  disabled,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1A1A]/50';

  const styles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#6B0F1A] text-white/90 hover:bg-[#7d1220] active:scale-[0.98] shadow-sm shadow-red-950/60',
    ghost:
      'border border-white/[0.08] bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white/85 hover:border-white/[0.12] active:scale-[0.98]',
  };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={[base, styles[variant], className ?? ''].join(' ')}
    >
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/25 border-t-white/75 animate-spin" />
      )}
      {children}
    </button>
  );
}

// ── Pill / badge ──────────────────────────────────────────────────────────────

type PillVariant = 'default' | 'green' | 'amber' | 'red' | 'blue';

const pillStyles: Record<PillVariant, string> = {
  default: 'border-white/[0.10] bg-white/[0.04] text-white/50',
  green: 'border-emerald-600/30 bg-emerald-700/[0.10] text-emerald-400',
  amber: 'border-amber-600/30 bg-amber-700/[0.10] text-amber-400',
  red: 'border-red-700/30 bg-red-900/[0.12] text-red-400',
  blue: 'border-amber-600/25 bg-amber-700/[0.08] text-amber-400',
};

export function Pill({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: PillVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${pillStyles[variant]}`}
    >
      {children}
    </span>
  );
}

// ── MetricRow ─────────────────────────────────────────────────────────────────

export function MetricRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-sm text-white/38">{label}</span>
      <span className={`font-mono text-sm ${accent ? 'text-amber-400' : 'text-white/65'}`}>
        {value}
      </span>
    </div>
  );
}

// ── ScoreBar ──────────────────────────────────────────────────────────────────

export function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color =
    pct >= 65 ? 'bg-emerald-600' : pct >= 40 ? 'bg-amber-600' : 'bg-red-800';
  const label =
    pct >= 65 ? 'Strong match' : pct >= 40 ? 'Moderate match' : 'Weak match';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/32">{label}</span>
        <span className="font-mono text-white/40">
          {score} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
