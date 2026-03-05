import { create } from 'zustand';
import { fetchCandidateByNumber } from './elections';
import populationJson from './data/municipios_bahia.json';

// function mergePopulation(municipalData, nameToIbgeId, popMap) {
//   const updated = { ...municipalData };
//   Object.entries(nameToIbgeId).forEach(([name, ibgeId]) => {
//     if (updated[name] && popMap[ibgeId]) {
//       updated[name] = { ...updated[name], pop: popMap[ibgeId] };
//     }
//   });
//   return updated;
// }

const popByName = {};
populationJson.forEach(m => {
  const name = m["Município"].replace(/ - BA$/, "").trim();
  popByName[name] = m.pop_total;
});

function mergePopulation(municipalData) {
  const updated = { ...municipalData };
  Object.entries(updated).forEach(([name, m]) => {
    if (popByName[name]) {
      updated[name] = { ...m, pop: popByName[name] };
    }
  });
  return updated;
}

export const useStore = create((set, get) => ({
  candidateIndex: 0,
  mode: 'heatmap',
  refCandidateIndex: null,
  selectedMunicipality: null,
  sidebarOpen: false,

  isLoading: false,
  apiData: [],
  municipalData: {},

  candidates: [],
  candidateList: [],
  populationMap: {},
  nameToIbgeId: {},

  // ── Ano da eleição ────────────────────────────────
  ano: 2022,
  // Trocar de ano limpa todos os candidatos carregados
  setAno: (novoAno) => set({
    ano: novoAno,
    candidates: [],
    apiData: [],
    municipalData: {},
    candidateIndex: 0,
    selectedMunicipality: null,
    sidebarOpen: false,
  }),
  // ─────────────────────────────────────────────────

  // ── Export Modal ──────────────────────────────────
  exportOpen: false,
  openExport: () => set({ exportOpen: true }),
  closeExport: () => set({ exportOpen: false }),


  // ── Carregar candidato ────────────────────────────
  loadCandidateByNumber: async (numero, cargo) => {
    set({ isLoading: true });
    try {
      const { ano } = get(); // ← usa o ano do store
      const cData = await fetchCandidateByNumber(numero, cargo, ano);
      if (!cData) throw new Error("Candidato não encontrado");

      const state = get();
      const newCandidates = [...state.candidates];
      const newApiData = [...state.apiData];

      const nomeFormatado = cData.nome.split(" ")
        .map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
        .join(" ");
      const firstName = nomeFormatado.split(" ")[0];

      const newCandObj = {
        name: firstName,
        fullName: nomeFormatado,
        numero: numero,
        partido: "-",
        cargo: cData.cargo,
        ano: ano, // ← registra o ano no objeto do candidato
      };

      let idx = newCandidates.findIndex(c => c.name === newCandObj.name && c.cargo === newCandObj.cargo);
      if (idx === -1) {
        idx = newCandidates.length;
        newCandidates.push(newCandObj);
        newApiData.push(cData);
      } else {
        newApiData[idx] = cData;
      }

      const mData = { ...state.municipalData };
      if (cData.por_municipio) {
        cData.por_municipio.forEach(m => {
          const mName = m.NM_MUNICIPIO
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");

          if (!mData[mName]) {
            mData[mName] = { votes: new Array(newCandidates.length).fill(0), eleitores: 200000, pop: null };
          }
          while (mData[mName].votes.length < newCandidates.length) {
            mData[mName].votes.push(0);
          }
          mData[mName].votes[idx] = m.total_votos;
        });
      }

      Object.values(mData).forEach(m => {
        while (m.votes.length < newCandidates.length) {
          m.votes.push(0);
        }
      });

      set({
        candidates: newCandidates,
        apiData: newApiData,
        municipalData: mergePopulation(mData),
        isLoading: false,
        candidateIndex: idx
      });

      return cData;

    } catch (e) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  setCandidate: (idx) => set({ candidateIndex: idx, sidebarOpen: false }),
  setMode: (mode) => set({ mode }),
  setRefCandidate: (idx) => set({ refCandidateIndex: idx }),
  selectMunicipality: (name, props = {}) => set({ selectedMunicipality: { name, props }, sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),

  removeCandidate: (idx) => {
    const state = get();
    const newCandidates = [...state.candidates];
    const newApiData = [...state.apiData];
    const newMunicipalData = { ...state.municipalData };

    newCandidates.splice(idx, 1);
    newApiData.splice(idx, 1);

    Object.values(newMunicipalData).forEach(m => {
      m.votes.splice(idx, 1);
    });

    let newIndex;
    if (newCandidates.length === 0) {
      newIndex = null;
    } else if (idx === state.candidateIndex) {
      newIndex = Math.min(idx, newCandidates.length - 1);
    } else if (idx < state.candidateIndex) {
      newIndex = state.candidateIndex - 1;
    } else {
      newIndex = state.candidateIndex;
    }

    set({
      candidates: newCandidates,
      apiData: newApiData,
      municipalData: newMunicipalData,
      candidateIndex: newIndex,
      selectedMunicipality: null,
      sidebarOpen: newCandidates.length > 0
    });
  }
}));

// Função auxiliar de votos anteriores
const factors = [0.72, 0.85, 0.91, 0.98, 1.05, 1.12, 1.18, 1.22];
export const prevVotes = (munName, candIdx, dataStore) => {
  const data = dataStore[munName];
  if (!data) return 0;
  const baseVotes = data.votes[candIdx];
  const idx = (candIdx + munName.length) % 8;
  return Math.round(baseVotes * factors[idx]);
};



//   loadCandidateByNumber: async (numero, cargo) => {
//     set({ isLoading: true });
//     try {
//       const cData = await fetchCandidateByNumber(numero, cargo);
//       if (!cData) throw new Error("Candidato não encontrado");

//       const state = get();
//       const newCandidates = [...state.candidates];
//       const newApiData = [...state.apiData];

//       const nomeFormatado = cData.nome.split(" ")
//         .map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
//         .join(" ");
//       const firstName = nomeFormatado.split(" ")[0];

//       const newCandObj = {
//         name: firstName,
//         fullName: nomeFormatado,
//         numero: numero,
//         partido: "-",
//         cargo: cData.cargo,
//         ano: 2022
//       };

//       let idx = newCandidates.findIndex(c => c.name === newCandObj.name && c.cargo === newCandObj.cargo);
//       if (idx === -1) {
//         idx = newCandidates.length;
//         newCandidates.push(newCandObj);
//         newApiData.push(cData);
//       } else {
//         newApiData[idx] = cData;
//       }

//       const mData = { ...state.municipalData };
//       if (cData.por_municipio) {
//         cData.por_municipio.forEach(m => {
//           const mName = m.NM_MUNICIPIO
//             .split(" ")
//             .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
//             .join(" ");

//           if (!mData[mName]) {
//             mData[mName] = { votes: new Array(newCandidates.length).fill(0), eleitores: 200000, pop: null };
//           }
//           while (mData[mName].votes.length < newCandidates.length) {
//             mData[mName].votes.push(0);
//           }
//           mData[mName].votes[idx] = m.total_votos;
//         });
//       }

//       Object.values(mData).forEach(m => {
//         while (m.votes.length < newCandidates.length) {
//           m.votes.push(0);
//         }
//       });

//       set({
//         candidates: newCandidates,
//         apiData: newApiData,
//         municipalData: mergePopulation(mData), // ✅ mescla população local
//         isLoading: false,
//         candidateIndex: idx
//       });

//       return cData;

//     } catch (e) {
//       console.error(e);
//       set({ isLoading: false });
//       throw e;
//     }
//   },


//   setCandidate: (idx) => set({ candidateIndex: idx, sidebarOpen: false }),
//   setMode: (mode) => set({ mode }),
//   setRefCandidate: (idx) => set({ refCandidateIndex: idx }),
//   selectMunicipality: (name, props = {}) => set({ selectedMunicipality: { name, props }, sidebarOpen: true }),
//   closeSidebar: () => set({ sidebarOpen: false }),

//   removeCandidate: (idx) => {
//     const state = get();
//     const newCandidates = [...state.candidates];
//     const newApiData = [...state.apiData];
//     const newMunicipalData = { ...state.municipalData };

//     newCandidates.splice(idx, 1);
//     newApiData.splice(idx, 1);

//     Object.values(newMunicipalData).forEach(m => {
//       m.votes.splice(idx, 1);
//     });

//     let newIndex;
//     if (newCandidates.length === 0) {
//       newIndex = null;
//     } else if (idx === state.candidateIndex) {
//       newIndex = Math.min(idx, newCandidates.length - 1);
//     } else if (idx < state.candidateIndex) {
//       newIndex = state.candidateIndex - 1;
//     } else {
//       newIndex = state.candidateIndex;
//     }

//     set({
//       candidates: newCandidates,
//       apiData: newApiData,
//       municipalData: newMunicipalData,
//       candidateIndex: newIndex,
//       selectedMunicipality: null,
//       sidebarOpen: newCandidates.length > 0
//     });
//   }
// }));

// // Função auxiliar de votos anteriores
// const factors = [0.72, 0.85, 0.91, 0.98, 1.05, 1.12, 1.18, 1.22];
// export const prevVotes = (munName, candIdx, dataStore) => {
//   const data = dataStore[munName];
//   if (!data) return 0;

//   const baseVotes = data.votes[candIdx];
//   const idx = (candIdx + munName.length) % 8;
//   return Math.round(baseVotes * factors[idx]);
// };















// export const useStore = create((set, get) => ({
//   candidateIndex: 0,
//   mode: 'heatmap',
//   refCandidateIndex: null,
//   selectedMunicipality: null,
//   sidebarOpen: false,

//   isLoading: false,
//   apiData: [],
//   municipalData: {},

//   candidates: [
//     // { name: "ACM Neto", partido: "União Brasil", cargo: "Governador", ano: 2022 },
//     // { name: "Jerônimo", partido: "PT", cargo: "Governador", ano: 2022 },
//   ],

//   candidateList: [], // só para candidatos buscados
//   populationMap: {}, // { ibgeId: população }
//   nameToIbgeId: {},  // { "Salvador": "2927408", ... }
//   // 🔹 Busca candidato por número
//   loadCandidateByNumber: async (numero, cargo) => {
//     set({ isLoading: true });
//     try {
//       const cData = await fetchCandidateByNumber(numero, cargo);
//       if (!cData) throw new Error("Candidato não encontrado");

//       const state = get();
//       const newCandidates = [...state.candidates];
//       const newApiData = [...state.apiData];

//       const nomeFormatado = cData.nome.split(" ")
//         .map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
//         .join(" ");
//       const firstName = nomeFormatado.split(" ")[0];

//       const newCandObj = {
//         name: firstName,
//         fullName: nomeFormatado,
//         partido: "-",
//         cargo: cData.cargo,
//         ano: 2022
//       };

//       let idx = newCandidates.findIndex(c => c.name === newCandObj.name && c.cargo === newCandObj.cargo);
//       if (idx === -1) {
//         idx = newCandidates.length;
//         newCandidates.push(newCandObj);
//         newApiData.push(cData);
//       } else {
//         newApiData[idx] = cData;
//       }

//       // Atualiza municipalData
//       const mData = { ...state.municipalData };
//       if (cData.por_municipio) {
//         cData.por_municipio.forEach(m => {
//           const mName = m.NM_MUNICIPIO.charAt(0).toUpperCase() + m.NM_MUNICIPIO.slice(1).toLowerCase();
//           if (!mData[mName]) {
//             mData[mName] = { votes: new Array(newCandidates.length).fill(0), eleitores: 200000, pop: "Estimado" };
//           }
//           while (mData[mName].votes.length < newCandidates.length) {
//             mData[mName].votes.push(0);
//           }
//           mData[mName].votes[idx] = m.total_votos;
//         });
//       }

//       Object.values(mData).forEach(m => {
//         while (m.votes.length < newCandidates.length) {
//           m.votes.push(0);
//         }
//       });

//       set({
//         candidates: newCandidates,
//         apiData: newApiData,
//         municipalData: mData,
//         isLoading: false,
//         candidateIndex: idx
//       });

//       return cData;

//     } catch (e) {
//       console.error(e);
//       set({ isLoading: false });
//       throw e;
//     }
//   },

//   setCandidate: (idx) => set({ candidateIndex: idx, sidebarOpen: false }),
//   setMode: (mode) => set({ mode }),
//   setRefCandidate: (idx) => set({ refCandidateIndex: idx }),
//   selectMunicipality: (name, props = {}) => set({ selectedMunicipality: { name, props }, sidebarOpen: true }),
//   closeSidebar: () => set({ sidebarOpen: false }),

// removeCandidate: (idx) => {
//   const state = get();
//   const newCandidates = [...state.candidates];
//   const newApiData = [...state.apiData];
//   const newMunicipalData = { ...state.municipalData };

//   // Remove candidato da lista
//   newCandidates.splice(idx, 1);
//   newApiData.splice(idx, 1);

//   // Atualiza os votos nas cidades
//   Object.values(newMunicipalData).forEach(m => {
//     m.votes.splice(idx, 1);
//   });

//   // Ajusta candidateIndex de forma segura
//   let newIndex;
//   if (newCandidates.length === 0) {
//     newIndex = null; // nenhum candidato
//   } else if (idx === state.candidateIndex) {
//     newIndex = Math.min(idx, newCandidates.length - 1);
//   } else if (idx < state.candidateIndex) {
//     newIndex = state.candidateIndex - 1;
//   } else {
//     newIndex = state.candidateIndex;
//   }

//   set({
//     candidates: newCandidates,
//     apiData: newApiData,
//     municipalData: newMunicipalData,
//     candidateIndex: newIndex,
//     selectedMunicipality: null,
//     sidebarOpen: newCandidates.length > 0 
//   });
// }

// }));

// // Função auxiliar de votos anteriores
// const factors = [0.72, 0.85, 0.91, 0.98, 1.05, 1.12, 1.18, 1.22];
// export const prevVotes = (munName, candIdx, dataStore) => {
//   const data = dataStore[munName];
//   if (!data) return 0;

//   const baseVotes = data.votes[candIdx];
//   const idx = (candIdx + munName.length) % 8;
//   return Math.round(baseVotes * factors[idx]);
// };


// function mergePopulation(municipalData, nameToIbgeId, popMap) {
//   const updated = { ...municipalData };
//   Object.entries(nameToIbgeId).forEach(([name, ibgeId]) => {
//     if (updated[name] && popMap[ibgeId]) {
//       updated[name] = { ...updated[name], pop: popMap[ibgeId] };
//     }
//   });
//   return updated;
// }
