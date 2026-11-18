import type { StationDot } from "./station-dots";

export type MapBeacon = {
  x: number;
  y: number;
  radius: number;
  scale: number;
  durationSeconds: number;
  delaySeconds: number;
};

const mulberry32 = (seed: number) => {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const between = (random: () => number, min: number, max: number) => min + random() * (max - min);

export const pickMapBeacons = (dots: readonly StationDot[], count: number, seed = 20261118): MapBeacon[] => {
  const random = mulberry32(seed);
  const pool = [...dots];
  const picked: StationDot[] = [];

  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }

  return picked.map((dot) => {
    const durationSeconds = between(random, 6, 14);
    return {
      x: dot.x,
      y: dot.y,
      radius: between(random, 4, 9),
      scale: between(random, 2.2, 4.6),
      durationSeconds,
      delaySeconds: -random() * durationSeconds,
    };
  });
};
