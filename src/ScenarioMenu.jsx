import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useSimStore } from './store';
import { SCENARIOS } from './scenarios';

export const ScenarioMenu = () => {
    const { loadScenario } = useSimStore();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-xl text-white backdrop-blur-sm shadow-xl hover:bg-slate-800 transition-colors"
            >
                <BookOpen size={18} className="text-blue-400" />
                <span className="font-semibold">Szenarien</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
                    {SCENARIOS.map(scenario => (
                        <button
                            key={scenario.id}
                            onClick={() => {
                                loadScenario(scenario);
                                setIsOpen(false);
                            }}
                            className="w-full text-left p-3 hover:bg-slate-800 border-b border-slate-800 last:border-0 transition-colors group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{scenario.name}</span>
                                <Play size={14} className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{scenario.description}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
