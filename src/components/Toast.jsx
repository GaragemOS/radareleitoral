import { useEffect, useState } from 'react';
import { useStore } from '../store';
import './Toast.css';

export default function Toast() {
    const activeFavoriteIndex = useStore(s => s.activeFavoriteIndex);
    const isLoading = useStore(s => s.isLoading);

    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isLoading) {
            setMessage('Carregando dados...');
            setVisible(true);
        } else {
            const t = setTimeout(() => setVisible(false), 1500);
            return () => clearTimeout(t);
        }
    }, [isLoading, activeFavoriteIndex]);

    return (
        <div className={`toast ${visible ? 'visible' : ''}`}>
            {message}
        </div>
    );
}
