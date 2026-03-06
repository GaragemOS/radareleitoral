import { useStore } from './store';
import Header from './components/Header';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import ExportModal from './components/ExportModal';
import SecoesModal from './components/SecoesModal';

export default function App() {
  const exportOpen = useStore(s => s.exportOpen);
  const secoesModalOpen = useStore(s => s.secoesModalOpen);

  return (
    <>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <MapView />
        <Sidebar />
      </div>
      <Toast />
      {exportOpen && <ExportModal />}
      {secoesModalOpen && <SecoesModal />}
    </>
  );
}
