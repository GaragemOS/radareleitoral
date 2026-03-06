import { ArrowUp, ArrowDown } from 'lucide-react';
import './DeltaBadge.css';

export default function DeltaBadge({ delta }) {
    const isPositive = delta > 0;
    const isNegative = delta < 0;

    if (delta === null || delta === undefined) return null;

    return (
        <div className={`delta-badge ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
            {isPositive && <ArrowUp size={12} />}
            {isNegative && <ArrowDown size={12} />}
            {!isPositive && !isNegative && <span>—</span>}
            {isPositive ? '+' : ''}{delta}
        </div>
    );
}
