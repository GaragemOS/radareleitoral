import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { useStore } from '../store';

export default function Toast() {
    const mode = useStore(state => state.mode);
    const candidateIndex = useStore(state => state.candidateIndex);

    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setMessage("Atualizando mapa...");
        setVisible(true);

        const t = setTimeout(() => {
            setVisible(false);
        }, 2500);

        return () => clearTimeout(t);
    }, [mode, candidateIndex]);

    return (
        <div className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-surface2 border border-border rounded shadow-lg",
            "font-mono text-xs text-muted transition-all duration-300 pointer-events-none",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
            {message}
        </div>
    );
}
