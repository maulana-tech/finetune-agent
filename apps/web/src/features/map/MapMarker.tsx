import { Marker } from 'react-map-gl/maplibre';
import { useMapStore } from './store';
import { MapPin } from 'lucide-react';

interface MapMarkerProps {
  id: string;
  longitude: number;
  latitude: number;
}

export function MapMarker({ id, longitude, latitude }: MapMarkerProps) {
  const selectedLeadId = useMapStore((state) => state.selectedLeadId);
  const setSelectedLeadId = useMapStore((state) => state.setSelectedLeadId);
  
  const isSelected = selectedLeadId === id;

  return (
    <Marker 
      longitude={longitude} 
      latitude={latitude} 
      anchor="bottom"
      onClick={e => {
        e.originalEvent.stopPropagation();
        setSelectedLeadId(id);
      }}
    >
      <div className={`cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125' : 'scale-100'}`}>
        <div className={`w-8 h-8 flex items-center justify-center border-2 border-primary ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'bg-background text-primary'} `}>
          <MapPin className="w-4 h-4" />
        </div>
        {/* strict flat design, no gradients, hard box shadows */}
        <div className="w-0 h-0 mx-auto border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary" />
      </div>
    </Marker>
  );
}
