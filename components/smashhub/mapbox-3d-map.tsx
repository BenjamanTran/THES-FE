'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Layers, Zap, Navigation } from 'lucide-react';
import { fetchGamesSearch, type Game } from '@/lib/api';

import {
  CITY_CENTERS,
  HCM_CENTER,
  type MapGameStatusFilter,
} from './map/constants';
import { groupKey, radiusFromZoom, type GameGroup } from './map/utils';
import { MapGroupBottomSheet } from './map/map-group-bottom-sheet';

export type { MapGameStatusFilter } from './map/constants';

interface Mapbox3DMapProps {
  city?: 'HCM' | 'HN';
  statusFilter?: MapGameStatusFilter;
  onOpenGame?: (id: number) => void;
}

export function Mapbox3DMap({
  city = 'HCM',
  statusFilter = 'all',
  onOpenGame,
}: Mapbox3DMapProps = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [pitch, setPitch] = useState(45);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadGamesInView = useCallback(() => {
    if (!map.current) return;

    if (fetchTimer.current) clearTimeout(fetchTimer.current);

    fetchTimer.current = setTimeout(() => {
      const center = map.current!.getCenter();
      const zoom = map.current!.getZoom();
      const radius = radiusFromZoom(zoom);

      const params: Record<string, string> = {
        lat: String(center.lat),
        lng: String(center.lng),
        radius: String(radius),
        time_scope: 'active',
        per_page: '50',
      };
      if (statusFilter === 'open') params.status = 'open';
      if (statusFilter === 'not_full') params.not_full = 'true';

      fetchGamesSearch(params)
        .then((res) => {
          const newGames: Game[] = [];
          const mergedIds = new Set<number>();

          res.games.forEach((g) => {
            mergedIds.add(g.id);
            newGames.push(g);
          });

          setGames((prev) => {
            const kept = prev.filter((g) => !mergedIds.has(g.id));
            return [...kept, ...newGames];
          });
        })
        .catch(() => {});
    }, 300);
  }, [statusFilter]);

  useEffect(() => {
    setGames([]);
    setSelectedGroupKey(null);
    if (mapReady) loadGamesInView();
  }, [statusFilter, city, mapReady, loadGamesInView]);

  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              duration: 1500,
            });
          }
          setIsLoadingLocation(false);
        },
        () => {
          console.error('[v0] Failed to get current location');
          setIsLoadingLocation(false);
        }
      );
    }
  };

  useEffect(() => {
    let cancelled = false;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('[v0] NEXT_PUBLIC_MAPBOX_TOKEN is not set');
      return;
    }
    mapboxgl.accessToken = token;
    if (!mapContainer.current) return;

    function initMap(center: [number, number]) {
      if (cancelled || !mapContainer.current) return;

      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      const container = mapContainer.current;
      container.replaceChildren();

      map.current = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: 15,
        pitch,
        bearing: -20,
        antialias: true,
      });

      map.current.on('load', () => {
        if (cancelled || !map.current) return;

        if (showTerrain && !map.current.getSource('mapbox-dem')) {
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
          map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        }

        if (!map.current.getLayer('sky')) map.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'gradient',
            'sky-gradient': [
              'interpolate', ['linear'], ['sky-radial-progress'],
              0.8, 'rgba(135, 206, 235, 1)',
              1, 'rgba(0, 0, 0, 0.1)',
            ],
            'sky-gradient-center': [0, 0],
            'sky-gradient-radius': 90,
            'sky-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0, 5, 0.3, 8, 1],
          },
        });

        if (showBuildings && !map.current.getLayer('add-3d-buildings')) {
          map.current.addLayer(
            {
              id: 'add-3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate', ['linear'], ['zoom'],
                  15, 0, 15.05, ['get', 'height'],
                ],
                'fill-extrusion-base': [
                  'interpolate', ['linear'], ['zoom'],
                  15, 0, 15.05, ['get', 'min_height'],
                ],
                'fill-extrusion-opacity': 0.6,
              },
            },
            'waterway-label'
          );
        }

        setMapReady(true);
        loadGamesInView();
      });

      map.current.on('moveend', loadGamesInView);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          initMap([longitude, latitude]);
        },
        () => {
          if (cancelled) return;
          initMap(CITY_CENTERS[city] || HCM_CENTER);
        }
      );
    } else {
      initMap(CITY_CENTERS[city] || HCM_CENTER);
    }

    return () => {
      cancelled = true;
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (mapContainer.current) {
        mapContainer.current.replaceChildren();
      }
      setMapReady(false);
    };
  }, [pitch, showTerrain, showBuildings, loadGamesInView]);

  const prevCity = useRef(city);
  useEffect(() => {
    if (city === prevCity.current) return;
    prevCity.current = city;
    if (!map.current) return;
    const center = CITY_CENTERS[city] || HCM_CENTER;
    map.current.flyTo({ center, zoom: 13, duration: 1500 });
  }, [city]);

  const groups = useMemo<GameGroup[]>(() => {
    const map = new Map<string, GameGroup>();
    games.forEach((g) => {
      const lat = typeof g.lat === 'string' ? parseFloat(g.lat) : g.lat;
      const lng = typeof g.lng === 'string' ? parseFloat(g.lng) : g.lng;
      if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const key = groupKey(lat, lng);
      const existing = map.get(key);
      if (existing) {
        existing.games.push(g);
      } else {
        map.set(key, { key, lat, lng, games: [g] });
      }
    });
    map.forEach((grp) => {
      grp.games.sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );
    });
    return Array.from(map.values());
  }, [games]);

  const selectedGroup = useMemo(
    () => (selectedGroupKey ? groups.find((g) => g.key === selectedGroupKey) ?? null : null),
    [groups, selectedGroupKey],
  );

  const gameMarkers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map.current) return;

    gameMarkers.current.forEach((m) => m.remove());
    gameMarkers.current = [];

    groups.forEach((group) => {
      const count = group.games.length;
      const sample = group.games[0];

      const el = document.createElement('div');
      el.className = 'cursor-pointer relative';

      const inner = document.createElement('div');
      inner.className =
        'w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center border-2 border-white shadow-lg ' +
        (count > 1
          ? 'bg-purple-600'
          : sample.match_type === 'doubles'
            ? 'bg-orange-500'
            : 'bg-blue-500');
      inner.innerHTML = `<span class="text-white text-sm font-bold">🏸</span>`;
      el.appendChild(inner);

      if (count > 1) {
        const badge = document.createElement('div');
        badge.className =
          'absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-orange-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center shadow';
        badge.textContent = String(count);
        el.appendChild(badge);
      }

      el.addEventListener('click', () => setSelectedGroupKey(group.key));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([group.lng, group.lat])
        .addTo(map.current!);

      gameMarkers.current.push(marker);
    });
  }, [groups]);

  const userMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarker.current) {
      userMarker.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'relative flex items-center justify-center';

    el.innerHTML = `
      <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg z-10"></div>
      <div class="absolute w-10 h-10 bg-blue-500/30 rounded-full animate-ping"></div>
    `;

    userMarker.current = new mapboxgl.Marker({ element: el })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
  }, [userLocation]);

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setShowTerrain(!showTerrain)}
          className={`px-4 py-2 rounded-full backdrop-blur-md transition-all font-medium text-sm flex items-center gap-2 ${
            showTerrain
              ? 'bg-orange-500 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Layers className="w-4 h-4" />
          Terrain
        </button>
        <button
          onClick={() => setShowBuildings(!showBuildings)}
          className={`px-4 py-2 rounded-full backdrop-blur-md transition-all font-medium text-sm flex items-center gap-2 ${
            showBuildings
              ? 'bg-orange-500 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Zap className="w-4 h-4" />
          Buildings
        </button>
      </div>

      {/* Current Location Button */}
      <button
        onClick={handleGetCurrentLocation}
        disabled={isLoadingLocation}
        className={`absolute right-4 bottom-24 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isLoadingLocation
            ? 'bg-black/40 text-white/50'
            : 'bg-black/60 backdrop-blur-md text-white hover:bg-black/80'
        } disabled:cursor-not-allowed`}
        title="Vị trí hiện tại"
      >
        <Navigation className={`w-5 h-5 ${isLoadingLocation ? 'animate-spin' : ''}`} />
      </button>

      {/* Pitch Control */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 bg-white/10 backdrop-blur-md rounded-lg p-2">
        <button
          onClick={() => setPitch(Math.min(85, pitch + 5))}
          className="w-10 h-10 rounded hover:bg-white/20 transition-all flex items-center justify-center text-white"
        >
          ↑
        </button>
        <div className="text-white text-xs text-center font-medium">{pitch}°</div>
        <button
          onClick={() => setPitch(Math.max(0, pitch - 5))}
          className="w-10 h-10 rounded hover:bg-white/20 transition-all flex items-center justify-center text-white"
        >
          ↓
        </button>
      </div>

      {selectedGroup && (
        <MapGroupBottomSheet
          group={selectedGroup}
          onClose={() => setSelectedGroupKey(null)}
          onOpenGame={onOpenGame}
        />
      )}
    </div>
  );
}
