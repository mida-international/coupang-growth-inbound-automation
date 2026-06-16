import fs from "fs/promises";
import os from "os";
import path from "path";

export function getShoplingWmsWorkRoot(): string {
  const override = process.env.SHOPLING_WMS_WORK_DIR?.trim();

  if (override) {
    return path.isAbsolute(override)
      ? override
      : path.join(process.cwd(), override);
  }

  if (process.env.VERCEL === "1") {
    return path.join("/tmp", "shopling-wms");
  }

  return path.join(os.tmpdir(), "shopling-wms");
}

export function getShoplingWmsRunDir(runId: string): string {
  return path.join(getShoplingWmsWorkRoot(), runId);
}

export function getShoplingWmsDownloadDir(runDir: string): string {
  return path.join(runDir, "download");
}

export function getShoplingWmsOutputDir(runDir: string): string {
  return path.join(runDir, "output");
}

export type ShoplingWmsRunPaths = {
  runDir: string;
  downloadDir: string;
  outputDir: string;
};

export async function createShoplingWmsRunDirs(
  runId: string,
): Promise<ShoplingWmsRunPaths> {
  const runDir = getShoplingWmsRunDir(runId);
  const downloadDir = getShoplingWmsDownloadDir(runDir);
  const outputDir = getShoplingWmsOutputDir(runDir);

  await fs.mkdir(downloadDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  return { runDir, downloadDir, outputDir };
}
