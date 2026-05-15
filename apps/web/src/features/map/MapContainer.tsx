'use client';

import * as React from 'react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from './store';
import { MapMarker } from './MapMarker';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

interface Lead {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

export function MapContainer({ leads }: { leads: Lead[] }) {
  const { viewState, setViewState } = useMapStore();

  return (
    <div className="w-full h-full relative bg-muted">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        {leads.map(lead => (
          lead.lat && lead.lng && (
            <MapMarker 
              key={lead.id} 
              id={lead.id} 
              longitude={lead.lng} 
              latitude={lead.lat} 
            />
          )
        ))}
      </Map>
    </div>
  );
}
