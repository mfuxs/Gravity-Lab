import React from 'react';
import {
    MousePointer2, Move, Sun, Circle, Disc, Rocket,
    CircleDot, Crosshair, Target, Activity, Zap, Repeat, Star, Anchor, Eclipse, Hand
} from 'lucide-react';

export const Toolbar = ({
    tool, setTool,
    highPrecision, setHighPrecision,
    showOrbitPreview, setShowOrbitPreview,
    showLagrange, setShowLagrange,
    unlockedAchievements,
    // View Settings Props
    showVectors, toggleShowVectors,
    showHillSpheres, toggleShowHillSpheres,
    showOrbitPaths, toggleShowOrbitPaths,
    showShadows, toggleShowShadows,

    isOpen, // New prop
    onFocus // New prop
}) => {

    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'move', icon: Hand, label: 'Move' },
        { id: 'sun_system', icon: Sun, label: 'Sonne' },
        { id: 'binary', icon: Repeat, label: 'Binär' },
        { id: 'planet', icon: Circle, label: 'Planet' },
        { id: 'whitedwarf', icon: Star, label: 'W. Zwerg' },
        { id: 'asteroid', icon: Disc, label: 'Asteroid' },
        { id: 'blackhole', icon: CircleDot, label: 'Black Hole' },
        { id: 'rocket', icon: Rocket, label: 'Rakete' },
    ];

    if (!isOpen) return null;

    return (
        <div className="absolute top-24 left-4 flex flex-col gap-4 z-40 animate-in slide-in-from-left duration-200">
            {/* Main Tools */}
            <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-xl backdrop-blur-sm shadow-xl flex flex-col gap-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Werkzeuge</div>
                <div className="grid grid-cols-2 gap-1">
                    {tools.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTool(t.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tool === t.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <t.icon size={14} />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Toggles & Options */}
            <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-xl backdrop-blur-sm shadow-xl flex flex-col gap-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Optionen</div>

                <button
                    onClick={() => setHighPrecision(!highPrecision)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${highPrecision ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <Zap size={14} />
                    <span>High Precision</span>
                </button>

                <button
                    onClick={() => setShowOrbitPreview(!showOrbitPreview)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showOrbitPreview ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <Activity size={14} />
                    <span>Orbit Planer</span>
                </button>

                <button
                    onClick={() => {
                        setShowLagrange(!showLagrange);
                        if (!showLagrange) setTool('lagrange_pilot');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showLagrange ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <Crosshair size={14} />
                    <span>Lagrange Pilot</span>
                </button>

                <button
                    onClick={onFocus}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                    <Target size={14} />
                    <span>Fokus</span>
                </button>

                <div className="h-px bg-slate-700 my-1"></div>

                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Ansicht</div>

                <button
                    onClick={toggleShowVectors}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showVectors ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <Move size={14} />
                    <span>Vektoren</span>
                </button>

                <button
                    onClick={toggleShowHillSpheres}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showHillSpheres ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <CircleDot size={14} />
                    <span>Hill Sphären</span>
                </button>

                <button
                    onClick={toggleShowOrbitPaths}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showOrbitPaths ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <Activity size={14} />
                    <span>Orbit Pfade</span>
                </button>

                <button
                    onClick={toggleShowShadows}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showShadows ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <Eclipse size={14} />
                    <span>Schatten</span>
                </button>
            </div>
        </div>
    );
};
