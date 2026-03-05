import { cn } from '../lib/utils';

export default function StatCard({ label, value, sub, accentColor = 'accent' }) {
    return (
        <div className="flex flex-col rounded-lg border border-border bg-surface p-4">
            <span className={cn(
                "font-mono text-[10px] uppercase tracking-wider mb-1",
                `text-${accentColor}`
            )}>
                {label}
            </span>
            <div className="font-display text-2xl font-bold text-text leading-none mb-1">
                {value}
            </div>
            {sub && (
                <span className="font-mono text-[11px] text-muted leading-tight">
                    {sub}
                </span>
            )}
        </div>
    );
}
