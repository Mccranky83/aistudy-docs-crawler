import navigate from "./navigate.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";
import { promises as fs } from "node:fs";

(async () => {
  const { browser, page } = await navigate();
  const menuPageModel = new MenuPageModel(page, config);

  const sitemap = await menuPageModel.getCourseUrls();

  await fs
    .writeFile("./sitemap.json", JSON.stringify(sitemap, null, 2), {
      encoding: "utf-8",
    })
    .finally(() => {
      console.log("\nSitemap has been saved.\n");
    });

  await browser.close();
})();
