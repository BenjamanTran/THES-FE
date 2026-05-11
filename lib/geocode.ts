const MAPBOX_GEOCODE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

const cache = new Map<string, string>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached) return cached;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const url = `${MAPBOX_GEOCODE_URL}/${lng},${lat}.json?access_token=${token}&language=vi&limit=1&types=address,poi,neighborhood,locality,place`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    const placeName = feature?.place_name ?? null;
    if (placeName) cache.set(key, placeName);
    return placeName;
  } catch {
    return null;
  }
}
