import { create } from 'zustand';

export const useSimStore = create((set) => ({
  tool: 'planet',
  isRunning: true,
  showHelp: true,
  missionState: 'idle', // idle, selecting_start, selecting_target, ready
  missionConfig: { startBody: null, targetBody: null },
  timeScale: 1,
  selectedBody: null,
  showVectors: false,
  showHillSpheres: false,
  showOrbitPaths: false,
  currentScenario: null, // For signaling GravitySimV10

  setTool: (tool) => set({ tool }),
  setIsRunning: (isRunning) => set({ isRunning }),
  toggleRunning: () => set((state) => ({ isRunning: !state.isRunning })),
  setShowHelp: (showHelp) => set({ showHelp }),
  setMissionState: (missionState) => set({ missionState }),
  setMissionConfig: (missionConfig) => set((state) => ({ 
    missionConfig: { ...state.missionConfig, ...missionConfig } 
  })),
  resetMissionConfig: () => set({ missionConfig: { startBody: null, targetBody: null }, missionState: 'idle' }),
  setTimeScale: (timeScale) => set({ timeScale }),
  setSelectedBody: (selectedBody) => set({ selectedBody }),
  toggleShowVectors: () => set((state) => ({ showVectors: !state.showVectors })),
  toggleShowHillSpheres: () => set((state) => ({ showHillSpheres: !state.showHillSpheres })),
  toggleShowOrbitPaths: () => set((state) => ({ showOrbitPaths: !state.showOrbitPaths })),
  showShadows: false,
  toggleShowShadows: () => set((state) => ({ showShadows: !state.showShadows })),
  loadScenario: (scenario) => set({ currentScenario: scenario, isRunning: false, timeScale: 1, missionState: 'idle' }),
}));
