import fs from "node:fs";
import fsp from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import config from "./config.js";
import "zx/globals";

const $$ = $({
  shell: (await $`which zsh`).stdout.trim(),
});

export default async (sitemapName) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dataPath = config.paths.data;
  const subjectName = (await $$`cut -d. -f1 <<<${sitemapName}`).stdout.trim();
  const linkmapPath = join(config.paths.linkmaps(), sitemapName);
  const json = JSON.parse(
    await fsp.readFile(linkmapPath, { encoding: "utf-8" }),
  );
  for (let pathName in json) {
    const dirname = (await $$`dirname ${pathName}`).stdout.trim();
    let filename = (await $$`basename ${pathName}`).stdout.trim();
    const fullDirPath = resolve(
      __dirname,
      "..",
      dataPath,
      subjectName,
      dirname,
    );
    await fsp.mkdir(fullDirPath, { recursive: true });
    cd(fullDirPath);
    if (!json[pathName]) continue;
    else {
      try {
        const url = json[pathName].split("?")[0];
        const sections = url.split(".");
        const ext = sections[sections.length - 1];
        filename = `${filename}.${ext}`;
        const flags = config.curlFlags;
        !fs.existsSync(filename)
          ? (await $$`curl -o ${filename} ${flags} ${json[pathName]}`,
            console.log("Downloaded", filename))
          : console.log("Skipping", filename);
      } catch (e) {
        console.error(e.message);
      }
    }
  }
  console.log("\nDownloaded all files!");
};
