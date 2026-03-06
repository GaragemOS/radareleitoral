import { useStore } from '../store';
import './RankBar.css';

export default function RankBar({ municipalityName, candidateIndex }) {
    const municipalData = useStore(s => s.municipalData);
    const favorites = useStore(s => s.favorites);
    const data = municipalData[municipalityName];
    if (!data) return null;

    const rankings = favorites.map((fav, idx) => ({
        ...fav,
        index: idx,
        votes: data.votes[idx] || 0,
    })).sort((a, b) => b.votes - a.votes);

    const maxVotes = rankings[0]?.votes || 1;

    return (
        <div className="rankbar">
            {rankings.map((item, rankIndex) => {
                const isActive = item.index === candidateIndex;
                const pct = Math.round((item.votes / maxVotes) * 100);

                return (
                    <div key={item.index} className={`rankbar-item ${isActive ? 'active' : ''}`}>
                        <div className="rankbar-item-header">
                            <div className="rankbar-item-left">
                                <span className="rankbar-pos">{rankIndex + 1}º</span>
                                <span className="rankbar-name">{item.name}</span>
                            </div>
                            <span className="rankbar-votes">{item.votes.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="rankbar-bar-bg">
                            <div className="rankbar-bar-fill" style={{ width: `${pct}%`, background: isActive ? 'var(--cor-secundaria)' : 'var(--border)' }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
