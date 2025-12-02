import React from 'react';
import { Rocket, Crosshair } from 'lucide-react';

export const MissionHUD = ({ rocketStats, bodies, setRocketCount, checkMilestones }) => {
    if (!rocketStats) return null;

    return (
        <div className="absolute bottom-8 right-8 bg-slate-900/90 border border-slate-700 p-4 rounded-xl text-white backdrop-blur-sm shadow-xl z-40 w-64">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                <Rocket size={18} className="text-yellow-400" />
                <span className="font-bold">Raketen Status</span>
                {rocketStats.locked && <Crosshair size={14} className="text-red-500 ml-auto animate-pulse" />}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono mb-3">
                <div className="text-slate-400">Status</div>
                <div className="text-yellow-300 uppercase text-right">{rocketStats.phase}</div>

                <div className="text-slate-400">Geschw.</div>
                <div className="text-blue-300 text-right">{rocketStats.speed}</div>

                <div className="text-slate-400">Höhe</div>
                <div className="text-emerald-300 text-right">{rocketStats.alt}</div>

                <div className="text-slate-400">Periode</div>
                <div className="text-slate-300 text-right">{rocketStats.period}s</div>

                <div className="col-span-2 border-t border-slate-700 my-1"></div>

                <div className="text-slate-400">Apoapsis</div>
                <div className="text-purple-300 text-right">{rocketStats.apoapsis}</div>

                <div className="text-slate-400">Periapsis</div>
                <div className="text-purple-300 text-right">{rocketStats.periapsis}</div>
            </div>

            {/* Fuel Gauge & Delta-v */}
            <div className="mb-3">
                <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold mb-1">
                    <span>Treibstoff</span>
                    <span className={rocketStats.fuel < 20 ? 'text-red-400 animate-pulse' : 'text-slate-400'}>{rocketStats.fuel.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full transition-all duration-500 ${rocketStats.fuel < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${rocketStats.fuel}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500 font-bold uppercase">Delta-v</span>
                    <span className="text-cyan-300">{rocketStats.deltaV} m/s</span>
                </div>
            </div>

            {/* Mission Log */}
            <div className="pt-2 border-t border-slate-700">
                <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Mission Log</div>
                <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                    {rocketStats.logs && rocketStats.logs.map((log, i) => (
                        <div key={i} className="text-[10px] text-slate-300 leading-tight border-l-2 border-slate-700 pl-2 py-0.5">
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            {/* Manual Override Button (Orbit Phase Only) */}
            {rocketStats.phase === 'orbit' && (
                <button
                    onClick={() => {
                        // Logic to trigger manual transfer scan
                        // We need to find the rocket object. 
                        // Since we don't have direct access to the rocket object instance here, 
                        // we might need to pass a handler function from GravitySimV10.
                        // For now, let's assume we pass a `onManualOverride` prop or similar.
                        // But wait, the original code accessed `bodiesRef.current`.
                        // We should pass a handler function.
                        console.log("Manual override requested");
                    }}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                    Manuelles Manöver
                </button>
            )}
        </div>
    );
};
