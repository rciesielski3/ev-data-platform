import { runOpenEvImport } from "@/lib/sources/openev/importer";

const main = async () => {
  const result = await runOpenEvImport();

  console.log("OpenEV import finished");
  console.log(JSON.stringify(result, null, 2));

  if (result.status === "FAILED") {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error("OpenEV import failed:", error);
  process.exit(1);
});
