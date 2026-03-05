import { useState, useEffect } from "react";
import { fetchCandidateByNumber } from "../elections";

export const CandidateVotes = ({ numero, cargo }) => {
    const [candidateData, setCandidateData] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchCandidateByNumber(numero, cargo);
            setCandidateData(data);
        };
        loadData();
    }, [numero, cargo]);

    if (!candidateData) return <p>Carregando...</p>;

    return (
        <div>
            <h2>{candidateData.nome} ({candidateData.cargo})</h2>
            <p>Total de votos: {candidateData.total_geral}</p>
            <h3>Votos por município:</h3>
            <ul>
                {candidateData.por_municipio.map(m => (
                    <li key={m.NM_MUNICIPIO}>
                        {m.NM_MUNICIPIO}: {m.total_votos}
                    </li>
                ))}
            </ul>
        </div>
    );
};