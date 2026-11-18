import { cache } from "react";

import { getLatestPrecomputedStats, getLatestSnapshot } from "@/lib/snapshots/get-snapshots";

export const getCachedLatestSnapshot = cache(() => getLatestSnapshot());

export const getCachedPrecomputedStats = cache(() => getLatestPrecomputedStats());
