import { useStore } from '../store';
import { cn } from '../lib/utils';

export default function RankBar({ municipalityName, candidateIndex }) {
    const municipalData = useStore(state => state.municipalData);
    const candidates = useStore(state => state.candidates);
    const data = municipalData[municipalityName];
    if (!data) return null;

    // Create an array mapping candidates to their votes in this municipality
    const rankings = candidates.map((cand, idx) => ({
        ...cand,
        index: idx,
        votes: data.votes[idx] || 0,
    })).sort((a, b) => b.votes - a.votes); // Sort descending by votes

    const maxVotes = rankings[0]?.votes || 1;

    return (
        <div className="flex flex-col gap-3 mt-4">
            {rankings.map((item, rankIndex) => {
                const isActive = item.index === candidateIndex;
                const percentage = Math.round((item.votes / maxVotes) * 100);

                return (
                    <div key={item.index} className="flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-mono text-xs w-4",
                                    isActive ? "text-accent font-bold" : "text-muted"
                                )}>
                                    {rankIndex + 1}º
                                </span>
                                <span className={cn(
                                    "font-body text-sm",
                                    isActive ? "text-text font-semibold" : "text-muted"
                                )}>
                                    {item.name}
                                </span>
                            </div>
                            <span className={cn(
                                "font-mono text-xs",
                                isActive ? "text-text" : "text-muted"
                            )}>
                                {item.votes.toLocaleString('pt-BR')}
                            </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isActive ? "bg-accent" : "bg-border"
                                )}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
