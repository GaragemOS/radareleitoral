import { useState, useEffect } from 'react';
import { useStore, CANDIDATE_COLORS } from '../store';
import { fetchCandidatoSecoes } from '../elections';
import { X } from 'lucide-react';
import './SecoesModal.css';

export default function SecoesModal() {
    const secoesModalOpen = useStore(s => s.secoesModalOpen);
    const closeSecoesModal = useStore(s => s.closeSecoesModal);
    const favorites = useStore(s => s.favorites);
    const activeFavoriteIndex = useStore(s => s.activeFavoriteIndex);
    const selectedMunicipality = useStore(s => s.selectedMunicipality);
    const compareCandidates = useStore(s => s.compareCandidates);
    const ano = useStore(s => s.ano);

    const [secoesMain, setSecoesMain] = useState(null);
    const [secoesCompare, setSecoesCompare] = useState({});
    const [loading, setLoading] = useState(false);

    const activeFav = favorites[activeFavoriteIndex];
    const isComparing = compareCandidates.length > 0;

    // ── Load seções on open ───────────────────────────
    useEffect(() => {
        if (!secoesModalOpen || !activeFav || !selectedMunicipality) return;

        setLoading(true);
        const muni = selectedMunicipality.toUpperCase();

        const promises = [
            fetchCandidatoSecoes(activeFav.numero, activeFav.cargo, muni, ano),
        ];

        compareCandidates.forEach(comp => {
            promises.push(
                fetchCandidatoSecoes(comp.numero, comp.cargo || activeFav.cargo, muni, ano)
            );
        });

        Promise.all(promises)
            .then(results => {
                setSecoesMain(results[0]?.secoes || []);
                const compData = {};
                compareCandidates.forEach((comp, i) => {
                    compData[comp.numero] = results[i + 1]?.secoes || [];
                });
                setSecoesCompare(compData);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [secoesModalOpen, activeFav, selectedMunicipality, compareCandidates, ano]);

    if (!secoesModalOpen) return null;

    // ── Build unified section list for comparison ─────
    const buildComparisonRows = () => {
        if (!isComparing || !secoesMain) return null;

        const comp = compareCandidates[0]; // Primary comparison
        const compSecoes = secoesCompare[comp?.numero] || [];

        // Build lookup by zona+secao
        const mainLookup = {};
        secoesMain.forEach(s => { mainLookup[`${s.NR_ZONA}-${s.NR_SECAO}`] = s; });
        const compLookup = {};
        compSecoes.forEach(s => { compLookup[`${s.NR_ZONA}-${s.NR_SECAO}`] = s; });

        // All unique keys
        const allKeys = new Set([...Object.keys(mainLookup), ...Object.keys(compLookup)]);
        const rows = [];
        allKeys.forEach(key => {
            const m = mainLookup[key];
            const c = compLookup[key];
            const [zona, secao] = key.split('-');
            rows.push({
                zona: parseInt(zona),
                secao: parseInt(secao),
                votesMain: m?.total_votos || 0,
                votesComp: c?.total_votos || 0,
            });
        });

        rows.sort((a, b) => a.zona - b.zona || a.secao - b.secao);
        return rows;
    };

    const comparisonRows = isComparing ? buildComparisonRows() : null;

    return (
        <div className="secoes-overlay" onClick={closeSecoesModal}>
            <div className="secoes-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="secoes-header">
                    <div>
                        <h2 className="secoes-title">Seções Eleitorais</h2>
                        <span className="secoes-subtitle">{selectedMunicipality} · {ano}</span>
                    </div>
                    <button className="secoes-close" onClick={closeSecoesModal}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="secoes-content">
                    {loading ? (
                        <div className="secoes-loading">Carregando seções...</div>
                    ) : isComparing && comparisonRows ? (
                        /* Comparison mode: side-by-side */
                        <div className="secoes-comparison">
                            <div className="secoes-comparison-header">
                                <div className="secoes-comparison-col-label" style={{ color: CANDIDATE_COLORS[0] }}>
                                    {activeFav?.name}
                                </div>
                                <div className="secoes-comparison-col-center">Zona / Seção</div>
                                <div className="secoes-comparison-col-label" style={{ color: CANDIDATE_COLORS[1] }}>
                                    {compareCandidates[0]?.nome?.split(' ')[0]}
                                </div>
                            </div>
                            <div className="secoes-comparison-body">
                                {comparisonRows.map((row, i) => {
                                    const mainWins = row.votesMain > row.votesComp;
                                    const compWins = row.votesComp > row.votesMain;
                                    return (
                                        <div key={i} className="secoes-comparison-row">
                                            <div className={`secoes-comparison-cell left ${mainWins ? 'winner' : ''}`}
                                                style={mainWins ? { color: CANDIDATE_COLORS[0] } : {}}>
                                                {row.votesMain}
                                            </div>
                                            <div className="secoes-comparison-cell center">
                                                Z{row.zona} / S{row.secao}
                                            </div>
                                            <div className={`secoes-comparison-cell right ${compWins ? 'winner' : ''}`}
                                                style={compWins ? { color: CANDIDATE_COLORS[1] } : {}}>
                                                {row.votesComp}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Summary */}
                            <div className="secoes-comparison-summary">
                                <div style={{ color: CANDIDATE_COLORS[0] }}>
                                    <strong>{comparisonRows.filter(r => r.votesMain > r.votesComp).length}</strong> seções
                                </div>
                                <span className="secoes-comparison-vs">vs</span>
                                <div style={{ color: CANDIDATE_COLORS[1] }}>
                                    <strong>{comparisonRows.filter(r => r.votesComp > r.votesMain).length}</strong> seções
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Single candidate mode */
                        <table className="secoes-table">
                            <thead>
                                <tr>
                                    <th>Zona</th>
                                    <th>Seção</th>
                                    <th>Votos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(secoesMain || []).map((s, i) => (
                                    <tr key={i}>
                                        <td>{s.NR_ZONA}</td>
                                        <td>{s.NR_SECAO}</td>
                                        <td>{s.total_votos}</td>
                                    </tr>
                                ))}
                                {(!secoesMain || secoesMain.length === 0) && (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--texto-muted)' }}>
                                            Nenhuma seção encontrada
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
