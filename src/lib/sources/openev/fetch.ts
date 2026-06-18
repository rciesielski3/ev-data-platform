import type { OpenEvDataset } from "./types";

type GitHubRelease = {
  tag_name: string;
  assets: Array<{ name: string; browser_download_url: string }>;
};

const resolveOpenEvJsonUrl = async () => {
  if (process.env.OPENEV_DATA_URL) {
    return process.env.OPENEV_DATA_URL;
  }

  const response = await fetch(
    "https://api.github.com/repos/open-ev-data/open-ev-data-dataset/releases/latest",
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ev-data-platform-importer",
      },
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to resolve OpenEV release: HTTP ${response.status}`,
    );
  }

  const release = (await response.json()) as GitHubRelease;
  const jsonAsset = release.assets.find((asset) => asset.name.endsWith(".json"));

  if (!jsonAsset) {
    throw new Error(
      `OpenEV release ${release.tag_name} has no JSON asset to import`,
    );
  }

  return jsonAsset.browser_download_url;
};

export const fetchOpenEvDataset = async (): Promise<OpenEvDataset> => {
  const datasetUrl = await resolveOpenEvJsonUrl();

  const response = await fetch(datasetUrl, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`OpenEV dataset download failed: HTTP ${response.status}`);
  }

  return response.json() as Promise<OpenEvDataset>;
};
