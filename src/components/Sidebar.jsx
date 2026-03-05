import { X, MapPin, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useStore, prevVotes } from '../store';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import StatCard from './StatCard';
import DeltaBadge from './DeltaBadge';
import RankBar from './RankBar';
import InsightCard from './InsightCard';

export default function Sidebar() {
    // ── Todos os hooks PRIMEIRO, antes de qualquer return ────────────────────
    const sidebarOpen = useStore((s) => s.sidebarOpen);
    const selectedMunicipality = useStore((s) => s.selectedMunicipality);
    const closeSidebar = useStore((s) => s.closeSidebar);
    const candidateIndex = useStore((s) => s.candidateIndex);
    const candidates = useStore((s) => s.candidates);
    const mode = useStore((s) => s.mode);
    const refCandidateIndex = useStore((s) => s.refCandidateIndex);
    const municipalData = useStore((s) => s.municipalData);
    const openExport = useStore((s) => s.openExport);

    const [secoes, setSecoes] = useState([]);
    const [secoesOpen, setSecoesOpen] = useState(false);
    const [secoesLoading, setSecoesLoading] = useState(false);

    const activeCandidate = candidates[candidateIndex];
    const munName = selectedMunicipality?.name;

    useEffect(() => {
        if (!munName || !activeCandidate) return;
        setSecoes([]);
        setSecoesOpen(false);
    }, [munName, candidateIndex]);
    // ────────────────────────────────────────────────────────────────────────

    const loadSecoes = async () => {
        if (secoes.length > 0) { setSecoesOpen(o => !o); return; }
        setSecoesLoading(true);
        try {
            const cargo = encodeURIComponent(activeCandidate.cargo);
            const mun = encodeURIComponent(munName.toUpperCase());
            const res = await fetch(
                `http://localhost:8000/candidato/secoes?ano=${activeCandidate.ano}&numero=${activeCandidate.numero}&cargo=${cargo}&municipio=${mun}`
            );
            const data = await res.json();
            setSecoes(data.secoes || []);
            setSecoesOpen(true);
        } catch (e) {
            console.error("Erro ao carregar seções", e);
        } finally {
            setSecoesLoading(false);
        }
    };

    // ── Early returns DEPOIS de todos os hooks ───────────────────────────────
    if (!selectedMunicipality) {
        return (
            <aside className="fixed right-0 top-14 bottom-0 w-[340px] bg-bg border-l border-border z-[900] shadow-2xl translate-x-full" />
        );
    }

    const data = municipalData[munName];

    if (!data) {
        return (
            <aside className={cn(
                "fixed right-0 top-14 bottom-0 w-[340px] bg-bg border-l border-border z-[900] shadow-2xl transition-transform duration-350 ease-[cubic-bezier(0.4,0,0.2,1)]",
                sidebarOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <h2 className="font-display font-bold text-lg text-text">{munName}</h2>
                        <button onClick={closeSidebar} className="text-muted hover:text-text p-1">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-muted">Dados não encontrados para este município.</p>
                </div>
            </aside>
        );
    }
    // ────────────────────────────────────────────────────────────────────────

    const currentVotes = data.votes[candidateIndex] || 0;
    const oldVotes = prevVotes(munName, candidateIndex, municipalData);
    const delta = currentVotes - oldVotes;
    const pctElectorate = ((currentVotes / data.eleitores) * 100).toFixed(1);

    const rankings = candidates
        .map((_, idx) => ({ index: idx, votes: data.votes[idx] || 0 }))
        .sort((a, b) => b.votes - a.votes);
    const currentRank = rankings.findIndex((r) => r.index === candidateIndex) + 1;

    return (
        <aside className={cn(
            "fixed right-0 top-14 bottom-0 w-[340px] bg-bg border-l border-border z-[900] shadow-2xl",
            "transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto flex flex-col",
            sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="flex-none p-5 border-b border-border bg-surface2/30 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-display font-bold text-xl text-text leading-tight flex items-center gap-2">
                            <MapPin className="text-accent w-4 h-4" />
                            {munName}
                        </h2>
                        <span className="font-mono text-[11px] text-muted uppercase tracking-wider">
                            {activeCandidate?.name} · {activeCandidate?.cargo}
                        </span>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="text-muted hover:text-text hover:bg-surface2 p-1.5 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-5 flex flex-col gap-5 flex-1">

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        label="Votos Totais"
                        value={currentVotes.toLocaleString('pt-BR')}
                        accentColor="accent"
                    />
                    <div className="flex flex-col rounded-lg border border-border bg-surface p-4 justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-green">% Eleitorado</span>
                        <div className="font-display text-2xl font-bold text-text leading-none mt-1">
                            {pctElectorate}%
                        </div>
                        <div className="mt-2 text-left">
                            <DeltaBadge delta={delta} />
                        </div>
                    </div>
                </div>

                {/* Sub Stats */}
                <div className="grid grid-cols-2 gap-3 border-y border-border py-4">
                    <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] text-muted uppercase">Posição Local</span>
                        <span className="font-body font-semibold text-text">{currentRank}º lugar</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-body font-semibold text-text">
                            {data.pop?.toLocaleString('pt-BR')} eleitores
                        </span>
                    </div>
                </div>

                {/* Heritage Block */}
                {mode === 'heritage' && refCandidateIndex !== null && (
                    <div className="bg-surface rounded-lg p-4 border border-blue/40 flex flex-col gap-3">
                        <h4 className="font-mono text-[11px] text-blue uppercase tracking-wider font-semibold">
                            Análise de Base: {candidates[refCandidateIndex]?.name}
                        </h4>
                        {data.votes[refCandidateIndex] === 0 ? (
                            <span className="font-body text-sm text-text">Referência não tem votos registrados aqui.</span>
                        ) : (
                            <>
                                <div className="flex justify-between font-body text-sm text-text">
                                    <span className="text-muted">Conversão de Base:</span>
                                    <span className="font-semibold">
                                        {((currentVotes / data.votes[refCandidateIndex]) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 bg-blue"
                                        style={{ width: `${Math.min((currentVotes / data.votes[refCandidateIndex]) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="font-mono text-[10px] text-muted mt-1 leading-relaxed">
                                    Referência obteve {data.votes[refCandidateIndex].toLocaleString('pt-BR')} votos aqui.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Rank Bar */}
                <div className="flex flex-col gap-1 mt-2">
                    <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">Resultado no Município</h3>
                    <RankBar municipalityName={munName} candidateIndex={candidateIndex} />
                </div>

                {/* Seções */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={loadSecoes}
                        className="flex items-center justify-between w-full font-mono text-[11px] uppercase tracking-wider text-muted hover:text-text transition-colors"
                    >
                        <span>Seções Eleitorais</span>
                        {secoesLoading
                            ? <span className="text-[10px] animate-pulse">carregando...</span>
                            : secoesOpen
                                ? <ChevronUp className="w-3 h-3" />
                                : <ChevronDown className="w-3 h-3" />
                        }
                    </button>

                    {secoesOpen && secoes.length > 0 && (
                        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-lg border border-border">
                            <div className="grid grid-cols-3 px-3 py-1.5 bg-surface2/50 font-mono text-[10px] text-muted uppercase tracking-wider sticky top-0">
                                <span>Zona</span>
                                <span>Seção</span>
                                <span className="text-right">Votos</span>
                            </div>
                            {secoes.map((s, i) => (
                                <div key={i} className="grid grid-cols-3 px-3 py-1.5 font-mono text-[11px] text-text hover:bg-surface2/30 transition-colors">
                                    <span className="text-muted">{s.NR_ZONA}</span>
                                    <span>{s.NR_SECAO}</span>
                                    <span className="text-right text-accent font-medium">{s.total_votos.toLocaleString('pt-BR')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botão Exportar */}
                {activeCandidate && (
                    <button
                        onClick={openExport}
                        className={cn(
                            "flex items-center justify-center gap-2 w-full py-2 rounded-lg border transition-all duration-200",
                            "border-border bg-surface hover:bg-surface2 hover:border-accent/40",
                            "font-mono text-[11px] uppercase tracking-wider text-muted hover:text-accent group"
                        )}
                    >
                        <Download className="w-3.5 h-3.5 group-hover:text-accent transition-colors" />
                        Ver dados completos
                    </button>
                )}

                {/* AI Insight */}
                <InsightCard
                    municipalityName={munName}
                    mode={mode}
                    candidateIndex={candidateIndex}
                    refCandidateIndex={refCandidateIndex}
                />

            </div>
        </aside>
    );
}

// import { X, MapPin, ChevronDown, ChevronUp, Download } from 'lucide-react'; import { useStore, prevVotes } from '../store';
// import { cn } from '../lib/utils';
// import { useState, useEffect } from 'react';
// import StatCard from './StatCard';
// import DeltaBadge from './DeltaBadge';
// import RankBar from './RankBar';
// import InsightCard from './InsightCard';
// import ExportModal from './ExportModal';

// export default function Sidebar() {
//     const sidebarOpen = useStore((state) => state.sidebarOpen);
//     const selectedMunicipality = useStore((state) => state.selectedMunicipality);
//     const closeSidebar = useStore((state) => state.closeSidebar);
//     const candidateIndex = useStore((state) => state.candidateIndex);
//     const candidates = useStore((state) => state.candidates);
//     const mode = useStore((state) => state.mode);
//     const refCandidateIndex = useStore((state) => state.refCandidateIndex);
//     const municipalData = useStore((state) => state.municipalData);
//     const [secoes, setSecoes] = useState([]);
//     const [secoesOpen, setSecoesOpen] = useState(false);
//     const [secoesLoading, setSecoesLoading] = useState(false);
//     const [ranking, setRanking] = useState([]);
//     // const [currentRank, setCurrentRank] = useState(null); // ✅ subiu para cá
//     const activeCandidate = candidates[candidateIndex]; // ✅ subiu para cá

//     const [exportOpen, setExportOpen] = useState(false);

//     const munName = selectedMunicipality?.name;


//     // Carrega seções quando município/candidato muda
//     useEffect(() => {
//         if (!munName || !activeCandidate) return;
//         setSecoes([]);
//         setSecoesOpen(false);
//     }, [munName, candidateIndex]);


//     const loadSecoes = async () => {
//         if (secoes.length > 0) { setSecoesOpen(o => !o); return; }
//         setSecoesLoading(true);
//         try {
//             const cargo = encodeURIComponent(activeCandidate.cargo);
//             const mun = encodeURIComponent(munName.toUpperCase());
//             const res = await fetch(
//                 `http://localhost:8000/candidato/secoes?numero=${activeCandidate.numero}&cargo=${cargo}&municipio=${mun}`
//             );
//             const data = await res.json();
//             setSecoes(data.secoes || []);
//             setSecoesOpen(true);
//         } catch (e) {
//             console.error("Erro ao carregar seções", e);
//         } finally {
//             setSecoesLoading(false);
//         }
//     };

//     if (!selectedMunicipality) {
//         return (
//             <aside className={cn(
//                 "fixed right-0 top-14 bottom-0 w-[340px] bg-bg border-l border-border z-[900] shadow-2xl transition-transform duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] translate-x-full"
//             )} />
//         );
//     }

//     const data = municipalData[munName];
//     // if (!activeCandidate) return null;

//     if (!data) {
//         return (
//             <aside className={cn(
//                 "fixed right-0 top-14 bottom-0 w-[340px] bg-bg border-l border-border z-[900] shadow-2xl transition-transform duration-350 ease-[cubic-bezier(0.4,0,0.2,1)]",
//                 sidebarOpen ? "translate-x-0" : "translate-x-full"
//             )}>
//                 <div className="p-4 flex flex-col gap-4">
//                     <div className="flex justify-between items-start">
//                         <h2 className="font-display font-bold text-lg text-text">{munName}</h2>
//                         <button onClick={closeSidebar} className="text-muted hover:text-text p-1"><X className="w-5 h-5" /></button>
//                     </div>
//                     <p className="text-sm text-muted">Dados não encontrados para este município.</p>
//                 </div>
//             </aside>
//         );
//     }

//     const currentVotes = data.votes[candidateIndex] || 0;
//     const oldVotes = prevVotes(munName, candidateIndex, municipalData);
//     const delta = currentVotes - oldVotes;
//     const pctElectorate = ((currentVotes / data.eleitores) * 100).toFixed(1);
//     const openExport = useStore((state) => state.openExport);

//     // Local Rank
//     const rankings = candidates.map((cand, idx) => ({
//         index: idx,
//         votes: data.votes[idx] || 0,
//     })).sort((a, b) => b.votes - a.votes);
//     const currentRank = rankings.findIndex((r) => r.index === candidateIndex) + 1;

//     return (
//         <aside className={cn(
//             "fixed right-0 top-14 bottom-0 w-[340px] bg-bg border-l border-border z-[900] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto flex flex-col",
//             sidebarOpen ? "translate-x-0" : "translate-x-full"
//         )}>
//             {/* Header */}
//             <div className="flex-none p-5 border-b border-border bg-surface2/30 sticky top-0 z-10 backdrop-blur-md">
//                 <div className="flex justify-between items-start">
//                     <div className="flex flex-col gap-1">
//                         <h2 className="font-display font-bold text-xl text-text leading-tight flex items-center gap-2">
//                             <MapPin className="text-accent w-4 h-4" />
//                             {munName}
//                         </h2>
//                         <span className="font-mono text-[11px] text-muted uppercase tracking-wider">
//                             {activeCandidate?.name} · {activeCandidate?.cargo}
//                         </span>
//                     </div>
//                     <button
//                         onClick={closeSidebar}
//                         className="text-muted hover:text-text hover:bg-surface2 p-1.5 rounded-full transition-colors"
//                     >
//                         <X className="w-4 h-4" />
//                     </button>
//                 </div>
//             </div>

//             <div className="p-5 flex flex-col gap-5 flex-1">

//                 {/* Main Stats */}
//                 <div className="grid grid-cols-2 gap-3">
//                     <StatCard
//                         label="Votos Totais"
//                         value={currentVotes.toLocaleString('pt-BR')}
//                         accentColor="accent"
//                     />
//                     <div className="flex flex-col rounded-lg border border-border bg-surface p-4 justify-between">
//                         <div className="flex justify-between items-start">
//                             <span className="font-mono text-[10px] uppercase tracking-wider text-green">
//                                 % Eleitorado
//                             </span>
//                         </div>
//                         <div className="font-display text-2xl font-bold text-text leading-none mt-1">
//                             {pctElectorate}%
//                         </div>
//                         <div className="mt-2 text-left">
//                             <DeltaBadge delta={delta} />
//                         </div>
//                     </div>
//                 </div>

//                 {/* 2-Column Sub Stats limit */}
//                 <div className="grid grid-cols-2 gap-3 border-y border-border py-4">
//                     <div className="flex flex-col gap-1">
//                         <span className="font-mono text-[10px] text-muted uppercase">Posição Local</span>
//                         <span className="font-body font-semibold text-text">{currentRank}º lugar</span>
//                     </div>
//                     <div className="flex flex-col gap-1">
//                         <span className="font-body font-semibold text-text">
//                             {data.pop.toLocaleString('pt-BR')} eleitores
//                             {/* {data.pop && (
//                                 <span className="text-muted text-xs font-normal ml-1">
//                                     / {data.pop.toLocaleString('pt-BR')} hab
//                                 </span>
//                             )} */}
//                         </span>
//                     </div>
//                 </div>

//                 {/* Heritage Detail Block */}
//                 {mode === 'heritage' && refCandidateIndex !== null && (
//                     <div className="bg-surface rounded-lg p-4 border border-blue/40 flex flex-col gap-3">
//                         <h4 className="font-mono text-[11px] text-blue uppercase tracking-wider font-semibold">Análise de Base: {candidates[refCandidateIndex].name}</h4>

//                         {data.votes[refCandidateIndex] === 0 ? (
//                             <span className="font-body text-sm text-text">Referência não tem votos registrados aqui.</span>
//                         ) : (
//                             <>
//                                 <div className="flex justify-between font-body text-sm text-text">
//                                     <span className="text-muted">Conversão de Base:</span>
//                                     <span className="font-semibold">{((currentVotes / data.votes[refCandidateIndex]) * 100).toFixed(1)}%</span>
//                                 </div>

//                                 <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden mt-1">
//                                     <div
//                                         className="h-full rounded-full transition-all duration-500 bg-blue"
//                                         style={{ width: `${Math.min((currentVotes / data.votes[refCandidateIndex]) * 100, 100)}%` }}
//                                     />
//                                 </div>
//                                 <p className="font-mono text-[10px] text-muted mt-1 leading-relaxed">
//                                     Referência obteve {data.votes[refCandidateIndex].toLocaleString('pt-BR')} votos aqui na rodada {candidates[refCandidateIndex].ano}.
//                                 </p>
//                             </>
//                         )}
//                     </div>
//                 )}

//                 {/* Breakdown */}
//                 <div className="flex flex-col gap-1 mt-2">
//                     <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">Resultado no Município</h3>
//                     <RankBar municipalityName={munName} candidateIndex={candidateIndex} />
//                 </div>

//                 <div className="flex flex-col gap-2">
//                     <button
//                         onClick={loadSecoes}
//                         className="flex items-center justify-between w-full font-mono text-[11px] uppercase tracking-wider text-muted hover:text-text transition-colors"
//                     >
//                         <span>Seções Eleitorais</span>
//                         {secoesLoading
//                             ? <span className="text-[10px] animate-pulse">carregando...</span>
//                             : secoesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
//                         }
//                     </button>

//                     {secoesOpen && secoes.length > 0 && (
//                         <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-lg border border-border">
//                             {/* Cabeçalho */}
//                             <div className="grid grid-cols-3 px-3 py-1.5 bg-surface2/50 font-mono text-[10px] text-muted uppercase tracking-wider sticky top-0">
//                                 <span>Zona</span>
//                                 <span>Seção</span>
//                                 <span className="text-right">Votos</span>
//                             </div>
//                             {secoes.map((s, i) => (
//                                 <div
//                                     key={i}
//                                     className="grid grid-cols-3 px-3 py-1.5 font-mono text-[11px] text-text hover:bg-surface2/30 transition-colors"
//                                 >
//                                     <span className="text-muted">{s.NR_ZONA}</span>
//                                     <span>{s.NR_SECAO}</span>
//                                     <span className="text-right text-accent font-medium">{s.total_votos.toLocaleString('pt-BR')}</span>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>

//                 {/* AI insight component */}
//                 <InsightCard
//                     municipalityName={munName}
//                     mode={mode}
//                     candidateIndex={candidateIndex}
//                     refCandidateIndex={refCandidateIndex}
//                 />

//                 {/* Botão Exportar */}
//                 <button
//                     onClick={openExport}
//                     className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-border bg-surface hover:bg-surface2 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-text transition-colors"
//                 >
//                     <Download className="w-3.5 h-3.5" />
//                     Exportar dados
//                 </button>

//             </div>
//         </aside>
//     );
// }
