import { useEffect } from 'react';
import { useStore } from './store';

import Header from './components/Header';
import HeritagePanel from './components/HeritagePanel';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import ExportModal from './components/ExportModal';

function App() {
  const exportOpen = useStore((state) => state.exportOpen);
  const closeExport = useStore((state) => state.closeExport);
  const candidates = useStore((state) => state.candidates);
  const candidateIndex = useStore((state) => state.candidateIndex);
  const activeCandidate = candidates[candidateIndex];
  // const fetchCandidates = useStore(state => state.fetchCandidates);
  // const isLoading = useStore(state => state.isLoading);

  // useEffect(() => {
  //   fetchCandidates();
  // }, [fetchCandidates]);

  // if (isLoading) {
  //   return (
  //     <div className="h-screen w-screen relative flex items-center justify-center bg-bg font-body text-text">
  //       <div className="flex flex-col items-center gap-4">
  //         <div className="w-8 h-8 rounded-full border-4 border-accent border-t-transparent animate-spin" />
  //         <p className="font-mono text-sm text-muted animate-pulse">Carregando dados eleitorais...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      {exportOpen && activeCandidate && (
        <ExportModal
          candidate={activeCandidate}
          onClose={closeExport}
        />
      )}
      <div className="h-screen w-screen relative flex flex-col bg-bg overflow-hidden font-body text-text">
        <Header />
        <HeritagePanel />
        <MapView />
        <Sidebar />
        <Toast />
      </div>
    </>
  );
}

export default App;
