import { promises as fs } from "node:fs";
import path from "node:path";
import config from "./config.js";

export default async (sitemapName) => {
  const sitemapPath = config.paths.sitemaps();
  const linkmapsPath = config.paths.linkmaps();
  const sitemap = JSON.parse(
    await fs.readFile(`${sitemapPath}/${sitemapName}`, {
      encoding: "utf-8",
    }),
  );

  let downloadMap = {
    downloadLinks: [],
    filePaths: [],
  };
  const traverse = async (obj, filepath) => {
    for (let prop in obj) {
      if (typeof obj[prop] === "object" && !Array.isArray(obj[prop])) {
        const newpath = path.join(filepath, prop);
        await traverse(obj[prop], newpath);
      } else if (Array.isArray(obj[prop])) {
        for (let i of obj[prop]) {
          if (typeof i === "object") {
            const newpath = path.join(filepath, i[Object.keys(i)[0]]);
            await traverse(i, newpath);
          } else {
            if (i.includes("http") || i === "") {
              downloadMap.downloadLinks.push(i);
            } else {
              const newpath = path.join(filepath, i);
              downloadMap.filePaths.push(newpath);
            }
          }
        }
      }
    }
  };
  await traverse(sitemap, "");

  downloadMap = Object.fromEntries(
    downloadMap.filePaths.map((cur, i) => {
      return [cur, downloadMap.downloadLinks[i]];
    }),
  );

  await fs
    .writeFile(
      `${linkmapsPath}/${sitemapName}`,
      JSON.stringify(downloadMap, null, 2),
      { encoding: "utf-8" },
    )
    .then(() => {
      console.log("\nLinkmaps has been saved.");
    });
};
