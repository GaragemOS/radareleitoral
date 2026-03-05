export const API_URL = import.meta.env.API_URL || "https://readareleitoral-api.up.railway.app";

export const fetchCandidateByNumber = async (numero, cargo, ano = 2022) => {
  try {
    const res = await fetch(
      `https://readareleitoral-api.up.railway.app/candidato?numero=${numero}&cargo=${encodeURIComponent(cargo)}&ano=${ano}`
    );
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Erro ao buscar candidato");
    }
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const fetchCandidatesList = async (cargo, ano = 2022) => {
  try {
    const res = await fetch(
      `https://readareleitoral-api.up.railway.app/candidatos/lista?cargo=${encodeURIComponent(cargo)}&ano=${ano}`
    );
    if (!res.ok) throw new Error("Erro ao listar candidatos");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};