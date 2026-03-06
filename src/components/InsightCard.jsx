import { useStore } from '../store';
import './InsightCard.css';

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const INSIGHTS = {
    geral: {
        first: [
            "Território dominante. Estratégia: blindar a base e garantir comparecimento.",
            "Liderança sólida. Evitar comodismo.",
            "Reduto eleitoral confirmado. Maximizar presença para ampliar margem.",
        ],
        growing: [
            "Crescimento real detectado. Momento de dobrar o investimento aqui.",
            "Tendência positiva. Avaliar o que funciona e replicar em municípios similares.",
            "Zona de avanço. Eleitorado respondendo — manter ritmo.",
        ],
        default: [
            "Território com potencial. Avaliar estratégia de presença local.",
            "Eleitorado a conquistar. Presença constante pode fazer a diferença.",
        ],
    },
    penetracao: {
        alta: [
            "Alta penetração na população. Candidato tem presença real no cotidiano local.",
            "Índice expressivo per capita. Território com enraizamento sólido.",
        ],
        media: [
            "Penetração razoável. Há espaço para crescimento com trabalho de base.",
            "Presença moderada na população. Potencial não totalmente explorado.",
        ],
        baixa: [
            "Baixa penetração na população local. Município pouco trabalhado eleitoralmente.",
            "Território subexplorado. Investigar barreiras locais.",
        ],
    },
};

export default function InsightCard({ municipalityName }) {
    const municipalData = useStore(s => s.municipalData);
    const favorites = useStore(s => s.favorites);
    const activeFavoriteIndex = useStore(s => s.activeFavoriteIndex);
    const rankingData = useStore(s => s.rankingData);

    const data = municipalData[municipalityName];
    if (!data) return null;

    const currentVotes = data.votes[activeFavoriteIndex] || 0;
    const activeFav = favorites[activeFavoriteIndex];

    // Ranking-based insight
    let highlightText = '';
    if (rankingData && activeFav) {
        const pos = rankingData.findIndex(c => c.numero === activeFav.numero) + 1;
        if (pos === 1) highlightText = pickRandom(INSIGHTS.geral.first);
        else if (pos <= 5) highlightText = pickRandom(INSIGHTS.geral.growing);
        else highlightText = pickRandom(INSIGHTS.geral.default);
    }

    // Penetracao (if population data available)
    const populacao = data.pop || null;
    const penetracao = populacao ? currentVotes / populacao : null;
    let penetracaoText = '';
    if (penetracao !== null) {
        if (penetracao > 0.15) penetracaoText = pickRandom(INSIGHTS.penetracao.alta);
        else if (penetracao > 0.05) penetracaoText = pickRandom(INSIGHTS.penetracao.media);
        else penetracaoText = pickRandom(INSIGHTS.penetracao.baixa);
    }

    if (!highlightText && !penetracaoText) return null;

    return (
        <div className="insight-card">
            {highlightText && (
                <div className="insight-highlight">
                    <p>{highlightText}</p>
                </div>
            )}
            {penetracaoText && (
                <div className="insight-penetracao">
                    <p>{penetracaoText}</p>
                    {penetracao !== null && (
                        <span className="insight-pct">{(penetracao * 100).toFixed(1)}% da pop.</span>
                    )}
                </div>
            )}
        </div>
    );
}