import React from 'react';
import { FastForward, Play, Pause } from 'lucide-react';
import { useSimStore } from './store';

export const TimeControls = () => {
    const { timeScale, setTimeScale, isRunning, toggleRunning } = useSimStore();



    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 p-3 rounded-xl text-white flex items-center gap-4 backdrop-blur-sm shadow-xl z-50">

            {/* Play/Pause */}
            <button
                onClick={toggleRunning}
                className={`p-2 rounded-full transition-colors ${isRunning ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-green-600 hover:bg-green-500 text-white'}`}
            >
                {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <div className="h-8 w-px bg-slate-700 mx-1"></div>

            {/* Slider */}
            <div className="flex flex-col w-48 gap-1">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Speed</span>
                    <span className={`${timeScale < 0 ? 'text-red-400' : 'text-blue-300'}`}>
                        {timeScale.toFixed(1)}x
                    </span>
                </div>
                <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={timeScale}
                    onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${timeScale < 0 ? 'bg-red-900/50 accent-red-500' : 'bg-slate-700 accent-blue-500'}`}
                />
                <div className="flex justify-between text-[10px] text-slate-500 px-1">
                    <span>-5x</span>
                    <span>0x</span>
                    <span>5x</span>
                </div>
            </div>

            {/* Presets */}
            <div className="flex gap-1">
                {[-1, 1, 5, 20].map(val => (
                    <button
                        key={val}
                        onClick={() => setTimeScale(val)}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${timeScale === val ? (val < 0 ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        {val}x
                    </button>
                ))}
            </div>
        </div>
    );
};
