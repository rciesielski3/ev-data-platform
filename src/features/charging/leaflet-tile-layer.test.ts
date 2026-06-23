import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type * as LeafletNamespace from "leaflet";

type FakeElement = {
  style: Record<string, string>;
  classList: { add: () => void; remove: () => void; contains: () => boolean };
  children: FakeElement[];
  appendChild: (child: FakeElement) => void;
  setAttribute: () => void;
  addEventListener: () => void;
  removeEventListener: () => void;
  getElementsByTagName: () => FakeElement[];
};

const createFakeElement = (): FakeElement => {
  const element: FakeElement = {
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    children: [],
    appendChild: (child) => element.children.push(child),
    setAttribute: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementsByTagName: () => [],
  };
  return element;
};

beforeAll(() => {
  const documentElement = createFakeElement();
  const fakeDocument = {
    documentElement,
    createElement: () => createFakeElement(),
    createElementNS: () => createFakeElement(),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const fakeWindow = {
    document: fakeDocument,
    navigator: { platform: "", userAgent: "node" },
    screen: { deviceXDPI: 1, logicalXDPI: 1 },
    setTimeout,
    clearTimeout,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  Object.assign(globalThis, {
    window: fakeWindow,
    document: fakeDocument,
    navigator: fakeWindow.navigator,
  });
});

afterAll(() => {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { document?: unknown }).document;
  delete (globalThis as { navigator?: unknown }).navigator;
});

type DivIconOptions = {
  className?: string;
  html?: string | false;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
  popupAnchor?: [number, number];
};

const getOptions = (icon: LeafletNamespace.DivIcon) =>
  icon.options as DivIconOptions;

describe("buildStationMarkerIcon", () => {
  it("includes the count badge when count is provided", async () => {
    const leaflet = (await import("leaflet")) as typeof LeafletNamespace;
    const { buildStationMarkerIcon } = await import(
      "@/features/charging/leaflet-tile-layer"
    );

    const options = getOptions(buildStationMarkerIcon(leaflet, { count: 5 }));

    expect(options.html).toContain("5");
    expect(options.html).toContain("station-map-marker-cluster");
  });

  it("omits the count badge when count is not provided", async () => {
    const leaflet = (await import("leaflet")) as typeof LeafletNamespace;
    const { buildStationMarkerIcon } = await import(
      "@/features/charging/leaflet-tile-layer"
    );

    const options = getOptions(buildStationMarkerIcon(leaflet));

    expect(options.html).not.toContain("station-map-marker-cluster");
    expect(options.html).toBe(`<span class="station-map-marker"></span>`);
  });

  it("matches the multi-marker call site's iconSize/iconAnchor/popupAnchor", async () => {
    const leaflet = (await import("leaflet")) as typeof LeafletNamespace;
    const { buildStationMarkerIcon } = await import(
      "@/features/charging/leaflet-tile-layer"
    );

    const options = getOptions(buildStationMarkerIcon(leaflet, { count: 3 }));

    expect(options.className).toBe("station-map-marker-wrapper");
    expect(options.iconSize).toEqual([34, 34]);
    expect(options.iconAnchor).toEqual([17, 17]);
    expect(options.popupAnchor).toEqual([0, -14]);
  });

  it("matches the single-marker call site's iconSize/iconAnchor", async () => {
    const leaflet = (await import("leaflet")) as typeof LeafletNamespace;
    const { buildStationMarkerIcon } = await import(
      "@/features/charging/leaflet-tile-layer"
    );

    const icon = buildStationMarkerIcon(leaflet);
    const options = getOptions(icon);

    expect(options.className).toBe("station-map-marker-wrapper");
    expect(options.iconSize).toEqual([34, 34]);
    expect(options.iconAnchor).toEqual([17, 17]);
    expect(Object.prototype.hasOwnProperty.call(icon.options, "popupAnchor")).toBe(
      false,
    );
  });

  it("renders a single station's count (1) without the cluster class", async () => {
    const leaflet = (await import("leaflet")) as typeof LeafletNamespace;
    const { buildStationMarkerIcon } = await import(
      "@/features/charging/leaflet-tile-layer"
    );

    const options = getOptions(buildStationMarkerIcon(leaflet, { count: 1 }));

    expect(options.html).not.toContain("station-map-marker-cluster");
    expect(options.html).toBe(`<span class="station-map-marker"></span>`);
  });
});
