import navigate from "./navigate.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";
import { promises as fs } from "node:fs";

// PE (subjectIndex = 3) has mismatched gradeNames each semester
const subjectIndex = 4;

(async () => {
  const { browser, page, filename } = await navigate(subjectIndex);
  const menuPageModel = new MenuPageModel(page, config);

  let sitemap = await menuPageModel.structureSitemap();
  sitemap = await menuPageModel.populateSitemap(sitemap);

  await fs
    .writeFile(
      `./data/sitemaps/${filename}.json`,
      JSON.stringify(sitemap, null, 2),
      {
        encoding: "utf-8",
      },
    )
    .finally(() => {
      console.log("\nSitemap has been saved.\n");
    });

  await browser.close();
})();
