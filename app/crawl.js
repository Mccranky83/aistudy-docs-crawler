import navigate from "./navigate.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";
import { promises as fs } from "node:fs";
import path from "node:path";

export default async (subjectIndex, downloadRange) => {
  const { browser, page, sitemapName } = await navigate(subjectIndex);
  const menuPageModel = new MenuPageModel(page, config);

  let sitemap = await menuPageModel.structureSitemap(downloadRange);
  sitemap = await menuPageModel.populateSitemap(sitemap, downloadRange);

  await fs
    .writeFile(
      path.join(config.paths.sitemaps(), sitemapName),
      JSON.stringify(sitemap, null, 2),
      {
        encoding: "utf-8",
      },
    )
    .then(() => {
      console.log("\nSitemap has been saved.");
    });

  await browser.close();

  return sitemapName;
};
