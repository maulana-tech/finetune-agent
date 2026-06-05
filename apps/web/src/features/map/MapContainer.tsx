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

interface HoveredPin {
  name: string;
  x: number;
  y: number;
}

export function MapContainer({ leads }: { leads: Lead[] }) {
  const mapRef = React.useRef<MapRef>(null);
  const { viewState, setViewState, setSelectedLeadId, selectedLeadId, flyToLeadId, setFlyToLeadId } = useMapStore();
  const [hoveredPin, setHoveredPin] = React.useState<HoveredPin | null>(null);

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
      const id = feature.properties?.id ?? null;
      setSelectedLeadId(id);
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
      const currentZoom = mapRef.current?.getMap()?.getZoom() ?? 11;
      mapRef.current?.getMap()?.flyTo({
        center: [lng, lat],
        zoom: Math.max(currentZoom, 14),
        duration: 350,
      });
    }
  }, [setSelectedLeadId]);

  const onMouseMove = React.useCallback((e: MapLayerMouseEvent) => {
    const canvas = mapRef.current?.getMap()?.getCanvas();
    if (!canvas) return;
    const feature = e.features?.[0];
    if (!feature) {
      canvas.style.cursor = '';
      setHoveredPin(null);
      return;
    }
    if (feature.properties?.cluster) {
      canvas.style.cursor = 'zoom-in';
      setHoveredPin(null);
    } else {
      canvas.style.cursor = 'pointer';
      setHoveredPin({ name: feature.properties?.name ?? '', x: e.point.x, y: e.point.y });
    }
  }, []);

  const onMouseLeave = React.useCallback(() => {
    const canvas = mapRef.current?.getMap()?.getCanvas();
    if (canvas) canvas.style.cursor = '';
    setHoveredPin(null);
  }, []);

  // Fly to a lead when flyToLeadId is set (e.g. from scrape page)
  React.useEffect(() => {
    if (!flyToLeadId) return;
    const lead = leads.find((l) => l.id === flyToLeadId);
    if (!lead || lead.lat == null || lead.lng == null) {
      setFlyToLeadId(null);
      return;
    }
    setSelectedLeadId(lead.id);
    mapRef.current?.flyTo({
      center: [lead.lng, lead.lat],
      zoom: 15,
      duration: 1200,
    });
    setFlyToLeadId(null);
  }, [flyToLeadId, leads, setSelectedLeadId, setFlyToLeadId]);

  return (
    <div className="w-full h-full relative bg-muted">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={['clusters', 'unclustered', 'unclustered-selected']}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
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
          <Layer
            id="unclustered-selected"
            type="circle"
            filter={['==', ['get', 'id'], selectedLeadId ?? '']}
            paint={{
              'circle-color': '#4f46e5',
              'circle-radius': 10,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 1,
            }}
          />
        </Source>
      </Map>

      {hoveredPin && (
        <div
          className="absolute z-10 pointer-events-none bg-background border border-border px-2.5 py-1.5 shadow-md whitespace-nowrap flex flex-col gap-0.5"
          style={{ left: hoveredPin.x + 14, top: hoveredPin.y - 40 }}
        >
          <span className="text-[10px] font-bold">{hoveredPin.name}</span>
          <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Click to view details</span>
        </div>
      )}
    </div>
  );
}
