import { promises as fs } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import config from "./config.js";
import "zx/globals";

export default async (sitemapName) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dataPath = config.paths.data;
  const subjectName = (await $`cut -d. -f1 <<<${sitemapName}`).stdout.trim();
  const linkmapPath = join(config.paths.linkmaps(), sitemapName);
  const json = JSON.parse(
    await fs.readFile(linkmapPath, { encoding: "utf-8" }),
  );
  for (let pathName in json) {
    const dirname = (await $`dirname ${pathName}`).stdout.trim();
    const filename = (await $`basename ${pathName}`).stdout.trim();
    const fullDirPath = resolve(
      __dirname,
      "..",
      dataPath,
      subjectName,
      dirname,
    );
    await fs.mkdir(fullDirPath, { recursive: true });
    cd(fullDirPath);
    if (!json[pathName]) continue;
    else {
      try {
        await $`curl -o ${filename}.docx --max-time 15 ${json[pathName]}`;
      } catch (e) {
        console.error(e.message);
      }
    }
  }
  console.log("\nDownloaded all files!");
};
