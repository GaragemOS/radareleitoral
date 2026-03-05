import { cn } from '../lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function DeltaBadge({ delta }) {
    const isPositive = delta > 0;
    const isNegative = delta < 0;

    if (!delta && delta !== 0) return null;

    return (
        <div className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium",
            isPositive && "bg-green/20 text-green",
            isNegative && "bg-red/20 text-red",
            !isPositive && !isNegative && "bg-surface2 text-muted"
        )}>
            {isPositive && <ArrowUp className="h-3 w-3" />}
            {isNegative && <ArrowDown className="h-3 w-3" />}
            {!isPositive && !isNegative && <span className="text-[10px]">—</span>}
            {isPositive ? '+' : ''}{delta}
        </div>
    );
}
