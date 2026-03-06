import './StatCard.css';

export default function StatCard({ label, value, sub, accent = false }) {
    return (
        <div className={`stat-card ${accent ? 'accent' : ''}`}>
            <span className="stat-card-label">{label}</span>
            <div className="stat-card-value">{value}</div>
            {sub && <span className="stat-card-sub">{sub}</span>}
        </div>
    );
}
