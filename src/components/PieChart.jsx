import { useMemo } from 'react';
import { CANDIDATE_COLORS } from '../store';
import './PieChart.css';

export default function PieChart({ data, size = 160 }) {
    // data: [{ label, value, colorIdx }]
    const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

    const slices = useMemo(() => {
        if (total === 0) return [];
        let cumulative = 0;
        return data.map(d => {
            const pct = d.value / total;
            const startAngle = cumulative * 2 * Math.PI;
            cumulative += pct;
            const endAngle = cumulative * 2 * Math.PI;
            return { ...d, pct, startAngle, endAngle };
        });
    }, [data, total]);

    const r = size / 2 - 8;
    const cx = size / 2;
    const cy = size / 2;

    const getArcPath = (startAngle, endAngle) => {
        const x1 = cx + r * Math.sin(startAngle);
        const y1 = cy - r * Math.cos(startAngle);
        const x2 = cx + r * Math.sin(endAngle);
        const y2 = cy - r * Math.cos(endAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    if (total === 0) return null;

    return (
        <div className="pie-wrapper">
            <svg width={size} height={size} className="pie-svg">
                {slices.map((s, i) => (
                    <path
                        key={i}
                        d={getArcPath(s.startAngle, s.endAngle)}
                        fill={CANDIDATE_COLORS[s.colorIdx] || '#ccc'}
                        stroke="#fff"
                        strokeWidth={2}
                    />
                ))}
                {/* Center hole for donut */}
                <circle cx={cx} cy={cy} r={r * 0.5} fill="var(--cor-primaria)" />
                <text x={cx} y={cy - 6} textAnchor="middle" className="pie-total-label">Total</text>
                <text x={cx} y={cy + 12} textAnchor="middle" className="pie-total-value">
                    {total.toLocaleString('pt-BR')}
                </text>
            </svg>
            <div className="pie-legend">
                {slices.map((s, i) => (
                    <div key={i} className="pie-legend-item">
                        <span className="pie-legend-dot" style={{ background: CANDIDATE_COLORS[s.colorIdx] }} />
                        <span className="pie-legend-label">{s.label}</span>
                        <span className="pie-legend-pct">{(s.pct * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
