import React, { useState, useEffect } from 'react';
import { X, Trash2, Camera, Activity, Scale, Move, Ruler } from 'lucide-react';
import { useSimStore } from './store';

export const ObjectInspector = ({ bodiesRef, cameraTargetRef }) => {
    const { selectedBody, setSelectedBody } = useSimStore();
    const [localUpdate, setLocalUpdate] = useState(0); // Force re-render for live values

    // Update live values periodically
    useEffect(() => {
        if (!selectedBody) return;
        const interval = setInterval(() => setLocalUpdate(n => n + 1), 100);
        return () => clearInterval(interval);
    }, [selectedBody]);

    if (!selectedBody) return null;

    // Ensure body still exists (it might have been deleted or merged)
    if (!bodiesRef.current.includes(selectedBody)) {
        setSelectedBody(null);
        return null;
    }

    const handleDelete = () => {
        selectedBody.mass = 0; // Will be cleaned up by physics loop
        setSelectedBody(null);
    };

    const handleFollow = () => {
        cameraTargetRef.current = selectedBody;
    };

    const speed = Math.sqrt(selectedBody.vx ** 2 + selectedBody.vy ** 2).toFixed(2);
    const mass = selectedBody.mass.toFixed(0);
    const radius = selectedBody.radius.toFixed(1);

    return (
        <div className="absolute bottom-8 left-8 bg-slate-900/90 border border-slate-700 p-4 rounded-xl text-white w-64 backdrop-blur-sm z-40 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-blue-400" />
                    <span className="font-bold truncate max-w-[120px]">{selectedBody.name || selectedBody.type}</span>
                </div>
                <button onClick={() => setSelectedBody(null)} className="text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Move size={14} /> <span>Geschw.</span>
                    </div>
                    <span className="font-mono text-blue-300">{speed}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Scale size={14} /> <span>Masse</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => selectedBody.mass = Math.max(1, selectedBody.mass * 0.9)}
                            className="px-1 bg-slate-800 rounded hover:bg-slate-700 text-xs"
                        >-</button>
                        <span className="font-mono text-emerald-300">{mass}</span>
                        <button
                            onClick={() => selectedBody.mass *= 1.1}
                            className="px-1 bg-slate-800 rounded hover:bg-slate-700 text-xs"
                        >+</button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Ruler size={14} /> <span>Radius</span>
                    </div>
                    <span className="font-mono text-purple-300">{radius}</span>
                </div>

                <div className="flex gap-2 mt-4 pt-2 border-t border-slate-700">
                    <button onClick={handleFollow} className="flex-1 bg-blue-600 hover:bg-blue-500 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1">
                        <Camera size={14} /> Verfolgen
                    </button>
                    <button onClick={handleDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 border border-red-700/50 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 text-red-200">
                        <Trash2 size={14} /> Löschen
                    </button>
                </div>
            </div>
        </div>
    );
};
