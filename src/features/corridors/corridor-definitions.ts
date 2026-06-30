export type CorridorWaypoint = {
  label: string;
  latitude: number;
  longitude: number;
};

export type CorridorSegment = {
  from: CorridorWaypoint;
  to: CorridorWaypoint;
};

export type CorridorDefinition = {
  id: string;
  name: string;
  segments: CorridorSegment[];
};

/**
 * Hand-picked waypoints along major Polish highway corridors, in highway
 * driving order. Coordinates approximate the highway route near each city,
 * not the city center. This is a fallback dataset for fast iteration ahead
 * of a full PostGIS-backed route model (see m1-approach-a) - waypoint
 * placement is deliberately coarse and not meant as a precise routing input.
 */
export const CORRIDOR_DEFINITIONS: CorridorDefinition[] = [
  {
    id: "a2-warsaw-poznan",
    name: "A2: Warsaw → Poznań",
    segments: [
      {
        from: { label: "Warsaw", latitude: 52.1, longitude: 21.0 },
        to: { label: "Łódź", latitude: 51.8, longitude: 19.4 },
      },
      {
        from: { label: "Łódź", latitude: 51.8, longitude: 19.4 },
        to: { label: "Poznań", latitude: 52.4, longitude: 16.9 },
      },
    ],
  },
  {
    id: "a4-wroclaw-krakow",
    name: "A4: Wrocław → Kraków",
    segments: [
      {
        from: { label: "Wrocław", latitude: 51.1, longitude: 17.0 },
        to: { label: "Opole", latitude: 50.67, longitude: 17.93 },
      },
      {
        from: { label: "Opole", latitude: 50.67, longitude: 17.93 },
        to: { label: "Katowice", latitude: 50.26, longitude: 19.02 },
      },
      {
        from: { label: "Katowice", latitude: 50.26, longitude: 19.02 },
        to: { label: "Kraków", latitude: 50.06, longitude: 19.94 },
      },
    ],
  },
  {
    id: "s7-warsaw-gdansk",
    name: "S7: Warsaw → Gdańsk",
    segments: [
      {
        from: { label: "Warsaw", latitude: 52.1, longitude: 21.0 },
        to: { label: "Płońsk", latitude: 52.62, longitude: 20.38 },
      },
      {
        from: { label: "Płońsk", latitude: 52.62, longitude: 20.38 },
        to: { label: "Olsztynek", latitude: 53.51, longitude: 20.28 },
      },
      {
        from: { label: "Olsztynek", latitude: 53.51, longitude: 20.28 },
        to: { label: "Gdańsk", latitude: 54.35, longitude: 18.65 },
      },
    ],
  },
  {
    id: "a1-gdansk-czestochowa",
    name: "A1: Gdańsk → Częstochowa",
    segments: [
      {
        from: { label: "Gdańsk", latitude: 54.35, longitude: 18.65 },
        to: { label: "Toruń", latitude: 53.01, longitude: 18.6 },
      },
      {
        from: { label: "Toruń", latitude: 53.01, longitude: 18.6 },
        to: { label: "Łódź", latitude: 51.8, longitude: 19.4 },
      },
      {
        from: { label: "Łódź", latitude: 51.8, longitude: 19.4 },
        to: { label: "Częstochowa", latitude: 50.81, longitude: 19.12 },
      },
    ],
  },
  {
    id: "a18-a4-zgorzelec-krakow",
    name: "A18/A4: Zgorzelec → Kraków",
    segments: [
      {
        from: { label: "Zgorzelec", latitude: 51.15, longitude: 15.0 },
        to: { label: "Wrocław", latitude: 51.1, longitude: 17.0 },
      },
      {
        from: { label: "Wrocław", latitude: 51.1, longitude: 17.0 },
        to: { label: "Opole", latitude: 50.67, longitude: 17.93 },
      },
      {
        from: { label: "Opole", latitude: 50.67, longitude: 17.93 },
        to: { label: "Kraków", latitude: 50.06, longitude: 19.94 },
      },
    ],
  },
];
