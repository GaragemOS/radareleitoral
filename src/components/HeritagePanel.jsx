import { useStore } from '../store';
import { Network } from 'lucide-react';

export default function HeritagePanel() {
    const mode = useStore(state => state.mode);
    const candidates = useStore(state => state.candidates);
    const refCandidateIndex = useStore(state => state.refCandidateIndex);
    const setRefCandidate = useStore(state => state.setRefCandidate);

    if (mode !== 'heritage') return null;

    return (
        <div className="absolute top-[72px] left-4 z-[500] w-[320px] bg-surface border border-blue/40 rounded-lg shadow-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-blue">
                <Network className="h-4 w-4" />
                <h3 className="font-display font-bold text-sm">Herança Eleitoral</h3>
            </div>

            <p className="font-body text-xs text-muted leading-relaxed">
                Selecione um candidato de referência para ver o potencial de transferência de base por município.
            </p>

            <div className="flex flex-col gap-2 relative">
                <select
                    value={refCandidateIndex === null ? "" : refCandidateIndex}
                    onChange={(e) => setRefCandidate(e.target.value === "" ? null : Number(e.target.value))}
                    className="appearance-none w-full bg-surface2 border border-border rounded px-3 py-2 font-mono text-sm text-text focus:outline-none focus:border-blue cursor-pointer"
                >
                    <option value="" disabled>Selecionar Referência...</option>
                    {candidates.map((cand, idx) => (
                        <option key={idx} value={idx}>{cand.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
