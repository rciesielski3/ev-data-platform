import { runEipaImport } from "@/lib/sources/eipa/importer";

const main = async () => {
  const result = await runEipaImport();

  console.log("EIPA import finished");
  console.log(JSON.stringify(result, null, 2));

  if (result.status === "FAILED") {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error("EIPA import failed:", error);
  process.exit(1);
});
