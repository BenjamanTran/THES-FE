'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Layers, Zap, Navigation, Clock, MapPin, Users, Swords, X } from 'lucide-react';
import { fetchGamesSearch, type Game } from '@/lib/api';
import { format } from 'date-fns';

const TIER_LABELS: Record<string, string> = {
  bronze: 'Newbie',
  silver: 'Yếu +',
  gold: 'Trung bình',
  platinum: 'Trung bình khá',
  diamond: 'Bán chuyên',
  master: 'Chuyên nghiệp',
};

function tierLabel(tier: string | null): string {
  if (!tier) return '—';
  return TIER_LABELS[tier] || tier;
}

function radiusFromZoom(zoom: number): number {
  if (zoom >= 16) return 1;
  if (zoom >= 14) return 3;
  if (zoom >= 12) return 10;
  if (zoom >= 10) return 30;
  return 50;
}

const DEFAULT_CENTER: [number, number] = [106.6601, 10.7626]; // HCM

export function Mapbox3DMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
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

      fetchGamesSearch({
        lat: String(center.lat),
        lng: String(center.lng),
        radius: String(radius),
        status: 'open',
        per_page: '20',
      })
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
  }, []);

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
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('[v0] NEXT_PUBLIC_MAPBOX_TOKEN is not set');
      return;
    }
    mapboxgl.accessToken = token;
    if (!mapContainer.current) return;

    function initMap(center: [number, number]) {
      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: 15,
        pitch,
        bearing: -20,
        antialias: true,
      });

      map.current.on('load', () => {
        if (!map.current) return;

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
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          initMap([longitude, latitude]);
        },
        () => initMap(DEFAULT_CENTER)
      );
    } else {
      initMap(DEFAULT_CENTER);
    }

    return () => {
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setMapReady(false);
    };
  }, [pitch, showTerrain, showBuildings, loadGamesInView]);

  const gameMarkers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map.current) return;

    gameMarkers.current.forEach((m) => m.remove());
    gameMarkers.current = [];

    games.forEach((game) => {
      if (!game.lat || !game.lng) return;

      const el = document.createElement('div');
      el.className = 'cursor-pointer';

      const inner = document.createElement('div');
      inner.className = 'w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center border-2 border-white shadow-lg';

      if (game.match_type === 'doubles') {
        inner.className += ' bg-orange-500';
      } else {
        inner.className += ' bg-blue-500';
      }
      inner.innerHTML = `<span class="text-white text-sm font-bold">🏸</span>`;

      el.appendChild(inner);
      el.addEventListener('click', () => setSelectedGame(game));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([game.lng, game.lat])
        .addTo(map.current!);

      gameMarkers.current.push(marker);
    });
  }, [games]);

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

      {selectedGame && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-4 border border-border/30">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏸</span>
                <h3 className="font-bold text-base">
                  {selectedGame.match_type === 'singles' ? 'Đánh đơn' : 'Đánh đôi'}
                </h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  selectedGame.status === 'open'
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {selectedGame.status === 'open' ? 'Đang mở' : 'Đã đầy'}
                </span>
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{format(new Date(selectedGame.start_time), 'HH:mm')} – {format(new Date(selectedGame.end_time), 'HH:mm, dd/MM')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>{selectedGame.players_count}/{selectedGame.max_players} người chơi</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{selectedGame.location || 'Chưa rõ địa điểm'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Swords className="w-3.5 h-3.5 shrink-0" />
                <span>{tierLabel(selectedGame.min_tier)} – {tierLabel(selectedGame.max_tier)}</span>
              </div>
            </div>

            {selectedGame.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {selectedGame.description}
              </p>
            )}

            {selectedGame.host?.name && (
              <p className="text-xs text-muted-foreground mb-3">
                Host: <span className="font-medium text-foreground">{selectedGame.host.name}</span>
              </p>
            )}

            {selectedGame.status === 'open' && (
              <button className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors">
                Tham gia trận đấu
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
