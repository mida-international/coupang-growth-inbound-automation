import fs from "fs/promises";
import path from "path";

const LOCAL_DATA_DIR = ".data";
const SHOPLING_WMS_DIR = "shopling-wms";
const RUNS_DIR = "runs";

export function getShoplingWmsWorkRoot(): string {
  if (process.env.VERCEL === "1") {
    return path.join("/tmp", SHOPLING_WMS_DIR);
  }

  const override = process.env.SHOPLING_WMS_WORK_DIR?.trim();
  if (override) {
    return path.join(process.cwd(), LOCAL_DATA_DIR, override);
  }

  return path.join(process.cwd(), LOCAL_DATA_DIR, SHOPLING_WMS_DIR);
}

export function getShoplingWmsRunDir(runId: string): string {
  return path.join(getShoplingWmsWorkRoot(), RUNS_DIR, runId);
}

export function getShoplingWmsDownloadDir(runId: string): string {
  return path.join(getShoplingWmsWorkRoot(), RUNS_DIR, runId, "download");
}

export function getShoplingWmsOutputDir(runId: string): string {
  return path.join(getShoplingWmsWorkRoot(), RUNS_DIR, runId, "output");
}

export type ShoplingWmsRunPaths = {
  runId: string;
  runDir: string;
  downloadDir: string;
  outputDir: string;
};

export async function createShoplingWmsRunDirs(
  runId: string,
): Promise<ShoplingWmsRunPaths> {
  const runDir = getShoplingWmsRunDir(runId);
  const downloadDir = getShoplingWmsDownloadDir(runId);
  const outputDir = getShoplingWmsOutputDir(runId);

  await fs.mkdir(downloadDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  return { runId, runDir, downloadDir, outputDir };
}
