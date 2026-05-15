import { create } from 'zustand';

interface MapState {
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  setViewState: (viewState: Partial<MapState['viewState']>) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewState: {
    longitude: 106.8272, // Jakarta roughly
    latitude: -6.1751,
    zoom: 11,
  },
  setViewState: (newViewState) => set((state) => ({ 
    viewState: { ...state.viewState, ...newViewState } 
  })),
  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
}));
