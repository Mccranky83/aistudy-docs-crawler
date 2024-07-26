import navigate from "./navigate.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";
import { promises as fs } from "node:fs";

(async () => {
  const { browser, page, filename } = await navigate();
  const menuPageModel = new MenuPageModel(page, config);

  const sitemap = await menuPageModel.populateSitemap();

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
