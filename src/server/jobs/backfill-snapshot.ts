import { captureSnapshot } from "@/lib/snapshots/capture-snapshot";

const main = async () => {
  const result = await captureSnapshot();

  console.log("Snapshot backfill finished");
  console.log(JSON.stringify(result, null, 2));

  if (result.status === "failed") {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error("Snapshot backfill failed:", error);
  process.exit(1);
});
