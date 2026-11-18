export type DotStation = { latitude: number; longitude: number };

export type StationDot = { x: number; y: number; count: number };

export type StationDotMap = {
  width: number;
  height: number;
  maxCount: number;
  dots: StationDot[];
};

const POLAND_BOUNDS = { minLon: 14.0, maxLon: 24.2, minLat: 49.0, maxLat: 54.9 };
const MID_LATITUDE_COS = Math.cos((52 * Math.PI) / 180);
const MAP_WIDTH = 1000;

export const buildStationDots = (
  stations: readonly DotStation[],
  cellDegrees = 0.14,
): StationDotMap => {
  const { minLon, maxLon, minLat, maxLat } = POLAND_BOUNDS;
  const spanX = (maxLon - minLon) * MID_LATITUDE_COS;
  const spanY = maxLat - minLat;
  const scale = MAP_WIDTH / spanX;
  const height = Math.round(spanY * scale);
  const cells = new Map<string, { lon: number; lat: number; count: number }>();

  for (const { latitude, longitude } of stations) {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      longitude < minLon ||
      longitude > maxLon ||
      latitude < minLat ||
      latitude > maxLat
    ) {
      continue;
    }
    const col = Math.floor(longitude / cellDegrees);
    const row = Math.floor(latitude / cellDegrees);
    const key = `${col}:${row}`;
    const cell = cells.get(key);
    if (cell) {
      cell.count += 1;
    } else {
      cells.set(key, {
        lon: (col + 0.5) * cellDegrees,
        lat: (row + 0.5) * cellDegrees,
        count: 1,
      });
    }
  }

  const dots = [...cells.values()].map(({ lon, lat, count }) => ({
    x: Math.round((lon - minLon) * MID_LATITUDE_COS * scale * 10) / 10,
    y: Math.round((maxLat - lat) * scale * 10) / 10,
    count,
  }));

  return {
    width: MAP_WIDTH,
    height,
    maxCount: dots.reduce((max, dot) => Math.max(max, dot.count), 0),
    dots,
  };
};
