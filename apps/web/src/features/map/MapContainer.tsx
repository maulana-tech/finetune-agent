'use client';

import * as React from 'react';
import Map, { Source, Layer, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from './store';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

interface Lead {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

export function MapContainer({ leads }: { leads: Lead[] }) {
  const mapRef = React.useRef<MapRef>(null);
  const { viewState, setViewState, setSelectedLeadId } = useMapStore();

  const geojson: GeoJSON.FeatureCollection = React.useMemo(() => ({
    type: 'FeatureCollection',
    features: leads
      .filter((l) => l.lat != null && l.lng != null)
      .map((l) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [l.lng!, l.lat!] },
        properties: { id: l.id, name: l.name },
      })),
  }), [leads]);

  const onClick = React.useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;

    if (feature.properties?.cluster) {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
      const clusterId = feature.properties.cluster_id;
      const source = map.getSource('leads') as
        | { getClusterExpansionZoom: (id: number, cb: (err: unknown, zoom: number | undefined) => void) => void }
        | undefined;
      if (source?.getClusterExpansionZoom) {
        source.getClusterExpansionZoom(clusterId, (_err: unknown, zoom: number | undefined) => {
          if (zoom != null) {
            map.flyTo({ center: [lng, lat], zoom });
          }
        });
      }
    } else {
      setSelectedLeadId(feature.properties?.id ?? null);
    }
  }, [setSelectedLeadId]);

  return (
    <div className="w-full h-full relative bg-muted">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={['clusters', 'unclustered']}
        onClick={onClick}
      >
        <Source
          id="leads"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#6366f1',
              'circle-radius': ['step', ['get', 'point_count'], 20, 10, 28, 50, 36],
              'circle-opacity': 0.15,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#6366f1',
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 12,
            }}
            paint={{
              'text-color': '#6366f1',
            }}
          />
          <Layer
            id="unclustered"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': '#6366f1',
              'circle-radius': 6,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
