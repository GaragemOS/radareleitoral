import { useState, useEffect, useMemo } from 'react';
import { useStore, CANDIDATE_COLORS } from '../store';
import { fetchCandidatoCompleto } from '../elections';
import { X, Download } from 'lucide-react';
import PieChart from './PieChart';
import './ExportModal.css';

const TABS = ['Geral', 'Municípios', 'Zonas', 'Seções'];

export default function ExportModal() {
    const exportOpen = useStore(s => s.exportOpen);
    const closeExport = useStore(s => s.closeExport);
    const favorites = useStore(s => s.favorites);
    const activeFavoriteIndex = useStore(s => s.activeFavoriteIndex);
    const ano = useStore(s => s.ano);
    const compareCandidates = useStore(s => s.compareCandidates);

    const [tab, setTab] = useState('Geral');
    const [data, setData] = useState(null);
    const [compareDataList, setCompareDataList] = useState([]);
    const [loading, setLoading] = useState(false);

    const activeFav = favorites[activeFavoriteIndex];
    const isComparing = compareCandidates.length > 0;

    const [filterMunicipio, setFilterMunicipio] = useState('');
    const [filterZona, setFilterZona] = useState('');

    // ── Load complete data for all candidates ─────────
    useEffect(() => {
        if (!exportOpen || !activeFav) return;
        setLoading(true);
        setData(null);
        setCompareDataList([]);

        const promises = [
            fetchCandidatoCompleto(activeFav.numero, activeFav.cargo, ano),
            ...compareCandidates.map(c => fetchCandidatoCompleto(c.numero, c.cargo || activeFav.cargo, ano)),
        ];

        Promise.all(promises).then(results => {
            setData(results[0]);
            setCompareDataList(results.slice(1));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [exportOpen, activeFav, ano, compareCandidates]);

    // ── All candidates data sources ─────────────────
    const allData = useMemo(() => {
        const items = [];
        if (data) items.push({ fav: activeFav, data, colorIdx: 0 });
        compareCandidates.forEach((comp, i) => {
            if (compareDataList[i]) items.push({ fav: comp, data: compareDataList[i], colorIdx: i + 1 });
        });
        return items;
    }, [data, compareDataList, activeFav, compareCandidates]);

    const municipios = useMemo(() =>
        [...new Set(data?.por_municipio?.map(m => m.NM_MUNICIPIO) || [])].sort(),
        [data]);

    const zonas = useMemo(() => {
        if (!data?.por_zona) return [];
        let z = data.por_zona;
        if (filterMunicipio) z = z.filter(r => r.NM_MUNICIPIO === filterMunicipio);
        return [...new Set(z.map(r => r.NR_ZONA))].sort((a, b) => a - b);
    }, [data, filterMunicipio]);

    const filteredSecoes = useMemo(() => {
        if (!data?.por_secao) return [];
        let s = data.por_secao;
        if (filterMunicipio) s = s.filter(r => r.NM_MUNICIPIO === filterMunicipio);
        if (filterZona) s = s.filter(r => String(r.NR_ZONA) === String(filterZona));
        return s;
    }, [data, filterMunicipio, filterZona]);

    const handleExportCSV = () => {
        const rows = filteredSecoes.map(s => ({
            Municipio: s.NM_MUNICIPIO,
            Zona: s.NR_ZONA,
            Secao: s.NR_SECAO,
            Votos: s.QT_VOTOS,
            Aptos: s.QT_APTOS || '',
            Comparecimento: s.QT_COMPARECIMENTO || '',
        }));
        const header = Object.keys(rows[0] || {}).join(',');
        const csv = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeFav?.fullName || 'candidato'}_${ano}_secoes.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!exportOpen) return null;

    return (
        <div className="export-overlay" onClick={closeExport}>
            <div className={`export-modal ${isComparing ? 'export-modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="export-header">
                    <div>
                        <h2 className="export-title">
                            {isComparing ? 'Comparativo de Candidatos' : activeFav?.fullName || 'Candidato'}
                        </h2>
                        <span className="export-subtitle">
                            {isComparing
                                ? `${activeFav?.fullName} vs ${compareCandidates.map(c => c.nome?.split(' ')[0]).join(' vs ')}`
                                : `${activeFav?.cargo} · ${activeFav?.partido} · ${ano}`}
                        </span>
                    </div>
                    <button className="export-close" onClick={closeExport}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="export-tabs">
                    {TABS.map(t => (
                        <button
                            key={t}
                            className={`export-tab ${tab === t ? 'active' : ''}`}
                            onClick={() => setTab(t)}
                        >{t}</button>
                    ))}
                </div>

                {/* Content */}
                <div className="export-content">
                    {loading ? (
                        <div className="export-loading">Carregando dados...</div>
                    ) : !data ? (
                        <div className="export-loading">Nenhum dado disponível</div>
                    ) : (
                        <>
                            {tab === 'Geral' && (
                                <div className="export-geral">
                                    {isComparing ? (
                                        <>
                                            {/* Comparative pie chart */}
                                            <div className="export-compare-pie">
                                                <PieChart
                                                    data={allData.map(item => ({
                                                        label: item.fav.name || item.fav.nome?.split(' ')[0],
                                                        value: item.data.totais?.votos || 0,
                                                        colorIdx: item.colorIdx,
                                                    }))}
                                                    size={200}
                                                />
                                            </div>

                                            {/* Side by side stats */}
                                            <div className="export-compare-grid">
                                                {allData.map(item => (
                                                    <div key={item.fav.numero} className="export-compare-card" style={{ borderTop: `3px solid ${CANDIDATE_COLORS[item.colorIdx]}` }}>
                                                        <h4 className="export-compare-card-name" style={{ color: CANDIDATE_COLORS[item.colorIdx] }}>
                                                            {item.data.candidato?.nome || item.fav.nome || item.fav.fullName}
                                                        </h4>
                                                        <span className="export-compare-card-meta">
                                                            {item.data.partido?.sigla || item.fav.partido} · Nº {item.fav.numero}
                                                        </span>
                                                        <div className="export-compare-stats">
                                                            <div className="export-compare-stat">
                                                                <span>Total de Votos</span>
                                                                <strong>{item.data.totais?.votos?.toLocaleString('pt-BR') || '—'}</strong>
                                                            </div>
                                                            <div className="export-compare-stat">
                                                                <span>Aptos</span>
                                                                <strong>{item.data.totais?.aptos?.toLocaleString('pt-BR') || '—'}</strong>
                                                            </div>
                                                            <div className="export-compare-stat">
                                                                <span>Comparecimento</span>
                                                                <strong>{item.data.totais?.comparecimento?.toLocaleString('pt-BR') || '—'}</strong>
                                                            </div>
                                                            <div className="export-compare-stat">
                                                                <span>Abstenções</span>
                                                                <strong>{item.data.totais?.abstencoes?.toLocaleString('pt-BR') || '—'}</strong>
                                                            </div>
                                                            <div className="export-compare-stat">
                                                                <span>Municípios</span>
                                                                <strong>{item.data.por_municipio?.length || 0}</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="export-stat-grid">
                                                <div className="export-stat">
                                                    <span className="export-stat-label">Total de Votos</span>
                                                    <span className="export-stat-value">{data.totais?.votos?.toLocaleString('pt-BR')}</span>
                                                </div>
                                                <div className="export-stat">
                                                    <span className="export-stat-label">Aptos</span>
                                                    <span className="export-stat-value">{data.totais?.aptos?.toLocaleString('pt-BR')}</span>
                                                </div>
                                                <div className="export-stat">
                                                    <span className="export-stat-label">Comparecimento</span>
                                                    <span className="export-stat-value">{data.totais?.comparecimento?.toLocaleString('pt-BR')}</span>
                                                </div>
                                                <div className="export-stat">
                                                    <span className="export-stat-label">Abstenções</span>
                                                    <span className="export-stat-value">{data.totais?.abstencoes?.toLocaleString('pt-BR')}</span>
                                                </div>
                                            </div>
                                            <div className="export-info-grid">
                                                <div className="export-info-item">
                                                    <span className="export-info-label">Candidato</span>
                                                    <span>{data.candidato?.nome}</span>
                                                </div>
                                                <div className="export-info-item">
                                                    <span className="export-info-label">Partido</span>
                                                    <span>{data.partido?.sigla} — {data.partido?.nome}</span>
                                                </div>
                                                <div className="export-info-item">
                                                    <span className="export-info-label">Cargo</span>
                                                    <span>{data.candidato?.cargo}</span>
                                                </div>
                                                <div className="export-info-item">
                                                    <span className="export-info-label">UF</span>
                                                    <span>{data.candidato?.uf}</span>
                                                </div>
                                                <div className="export-info-item">
                                                    <span className="export-info-label">Eleição</span>
                                                    <span>{data.eleicao?.ds_eleicao} — {data.eleicao?.dt_pleito}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {tab === 'Municípios' && (
                                <div className="export-table-wrapper">
                                    <table className="export-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Município</th>
                                                {isComparing ? (
                                                    allData.map(item => (
                                                        <th key={item.fav.numero} style={{ color: CANDIDATE_COLORS[item.colorIdx] }}>
                                                            {item.fav.name || item.fav.nome?.split(' ')[0]}
                                                        </th>
                                                    ))
                                                ) : (
                                                    <>
                                                        <th>Votos</th>
                                                        <th>Aptos</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isComparing ? (() => {
                                                // Merge all municipalities
                                                const muniMap = {};
                                                allData.forEach(item => {
                                                    item.data.por_municipio?.forEach(m => {
                                                        if (!muniMap[m.NM_MUNICIPIO]) muniMap[m.NM_MUNICIPIO] = {};
                                                        muniMap[m.NM_MUNICIPIO][item.fav.numero] = m.total_votos;
                                                    });
                                                });
                                                return Object.entries(muniMap)
                                                    .sort((a, b) => a[0].localeCompare(b[0]))
                                                    .map(([muni, votes], i) => (
                                                        <tr key={muni}>
                                                            <td>{i + 1}</td>
                                                            <td>{muni}</td>
                                                            {allData.map(item => {
                                                                const v = votes[item.fav.numero] || 0;
                                                                const maxV = Math.max(...Object.values(votes));
                                                                return (
                                                                    <td key={item.fav.numero} style={v === maxV && v > 0 ? { fontWeight: 700, color: CANDIDATE_COLORS[item.colorIdx] } : {}}>
                                                                        {v.toLocaleString('pt-BR')}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ));
                                            })() : (
                                                data.por_municipio?.map((m, i) => (
                                                    <tr key={m.NM_MUNICIPIO}>
                                                        <td>{i + 1}</td>
                                                        <td>{m.NM_MUNICIPIO}</td>
                                                        <td>{m.total_votos?.toLocaleString('pt-BR')}</td>
                                                        <td>{m.total_aptos?.toLocaleString('pt-BR')}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {tab === 'Zonas' && (
                                <div className="export-table-wrapper">
                                    <table className="export-table">
                                        <thead>
                                            <tr>
                                                <th>Município</th>
                                                <th>Zona</th>
                                                {isComparing ? (
                                                    allData.map(item => (
                                                        <th key={item.fav.numero} style={{ color: CANDIDATE_COLORS[item.colorIdx] }}>
                                                            {item.fav.name || item.fav.nome?.split(' ')[0]}
                                                        </th>
                                                    ))
                                                ) : (
                                                    <th>Votos</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isComparing ? (() => {
                                                const zonaMap = {};
                                                allData.forEach(item => {
                                                    item.data.por_zona?.forEach(z => {
                                                        const k = `${z.NM_MUNICIPIO}|${z.NR_ZONA}`;
                                                        if (!zonaMap[k]) zonaMap[k] = { muni: z.NM_MUNICIPIO, zona: z.NR_ZONA, votes: {} };
                                                        zonaMap[k].votes[item.fav.numero] = z.total_votos;
                                                    });
                                                });
                                                return Object.values(zonaMap).map((z, i) => (
                                                    <tr key={`${z.muni}-${z.zona}`}>
                                                        <td>{z.muni}</td>
                                                        <td>{z.zona}</td>
                                                        {allData.map(item => {
                                                            const v = z.votes[item.fav.numero] || 0;
                                                            const maxV = Math.max(...Object.values(z.votes));
                                                            return (
                                                                <td key={item.fav.numero} style={v === maxV && v > 0 ? { fontWeight: 700, color: CANDIDATE_COLORS[item.colorIdx] } : {}}>
                                                                    {v.toLocaleString('pt-BR')}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ));
                                            })() : (
                                                data.por_zona?.map((z, i) => (
                                                    <tr key={`${z.NM_MUNICIPIO}-${z.NR_ZONA}`}>
                                                        <td>{z.NM_MUNICIPIO}</td>
                                                        <td>{z.NR_ZONA}</td>
                                                        <td>{z.total_votos?.toLocaleString('pt-BR')}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {tab === 'Seções' && (
                                <div>
                                    <div className="export-filters">
                                        <select
                                            className="export-filter-select"
                                            value={filterMunicipio}
                                            onChange={e => { setFilterMunicipio(e.target.value); setFilterZona(''); }}
                                        >
                                            <option value="">Todos os Municípios</option>
                                            {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <select
                                            className="export-filter-select"
                                            value={filterZona}
                                            onChange={e => setFilterZona(e.target.value)}
                                        >
                                            <option value="">Todas as Zonas</option>
                                            {zonas.map(z => <option key={z} value={z}>Zona {z}</option>)}
                                        </select>
                                        <button className="export-csv-btn" onClick={handleExportCSV}>
                                            <Download size={14} />
                                            Exportar CSV
                                        </button>
                                    </div>
                                    <div className="export-table-wrapper">
                                        <table className="export-table">
                                            <thead>
                                                <tr>
                                                    <th>Município</th>
                                                    <th>Zona</th>
                                                    <th>Seção</th>
                                                    <th>Votos</th>
                                                    <th>Aptos</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredSecoes.slice(0, 200).map((s, i) => (
                                                    <tr key={`${s.NM_MUNICIPIO}-${s.NR_ZONA}-${s.NR_SECAO}`}>
                                                        <td>{s.NM_MUNICIPIO}</td>
                                                        <td>{s.NR_ZONA}</td>
                                                        <td>{s.NR_SECAO}</td>
                                                        <td>{s.QT_VOTOS}</td>
                                                        <td>{s.QT_APTOS}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredSecoes.length > 200 && (
                                            <p className="export-truncated">Mostrando 200 de {filteredSecoes.length} seções.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}