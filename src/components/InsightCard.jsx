import { useStore, prevVotes } from '../store';

export default function InsightCard({ municipalityName, mode, candidateIndex, refCandidateIndex }) {
    const municipalData = useStore(state => state.municipalData);
    const candidates = useStore(state => state.candidates);
    const data = municipalData[municipalityName];
    if (!data) return null;

    // Calculate current rank
    const rankings = candidates.map((cand, idx) => ({
        index: idx,
        votes: data.votes[idx] || 0,
    })).sort((a, b) => b.votes - a.votes);

    const currentRank = rankings.findIndex(r => r.index === candidateIndex) + 1;

    // Calculate Delta
    const currentVotes = data.votes[candidateIndex] || 0;
    const previousVotes = prevVotes(municipalityName, candidateIndex, municipalData);
    const delta = currentVotes - previousVotes;

    let highlightText = "";

    if (mode === 'heritage' && refCandidateIndex !== null) {
        const refVotes = data.votes[refCandidateIndex];
        if (refVotes === 0) {
            highlightText = "Base do candidato referência é nula neste município.";
        } else {
            const captureRate = currentVotes / refVotes;
            if (captureRate < 0.20) {
                highlightText = "Maior potencial de herança. Prioridade máxima.";
            } else if (captureRate <= 0.60) {
                highlightText = "Oportunidade moderada. Vale intensificar.";
            } else {
                highlightText = "Base bem capturada. Manter presença.";
            }
        }
    } else {
        // HEATMAP or COMPARE mode (default logic)
        if (currentRank === 1) {
            highlightText = "Território consolidado. Estratégia: manter presença.";
        } else if (delta > 0) {
            highlightText = "Zona de crescimento. Intensificar campanha.";
        } else {
            highlightText = "Perda de território. Investigar causas.";
        }
    }

    return (
        <div className="mt-4 border-l-2 border-accent bg-accent/10 p-4 rounded-r flex items-start">
            <p className="font-body text-sm text-text leading-relaxed">
                {highlightText}
            </p>
        </div>
    );
}
