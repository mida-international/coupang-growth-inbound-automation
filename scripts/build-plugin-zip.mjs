/**
 * extension/ 폴더를 public/shopling-session-plugin.zip 으로 묶는다.
 * (배포 다운로드용 플러그인 zip 생성. 확장 수정 시 다시 실행: npm run plugin:zip)
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "extension");
const outFile = join(root, "public", "shopling-session-plugin.zip");
const ZIP_ROOT = "shopling-session-plugin";

const zip = new JSZip();
const folder = zip.folder(ZIP_ROOT);
for (const name of readdirSync(srcDir)) {
  folder.file(name, readFileSync(join(srcDir, name)));
}

const buf = await zip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
});
writeFileSync(outFile, buf);
console.log(`✅ ${outFile} 생성 (${buf.length} bytes)`);
