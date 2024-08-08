import navigate from "./navigate.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import SecondMenuPageModel from "./pom/SecondMenuPageModel.js";
import config from "./config.js";
import { promises as fs } from "node:fs";
import path from "node:path";

export default async (
  subjectIndex,
  downloadRange,
  { choice_three, headless },
) => {
  const { browser, page, sitemapName } = await navigate(subjectIndex, headless);
  const flag = choice_three === "d" || !choice_three;
  const menuPageModel = flag
    ? new MenuPageModel(page, config)
    : new SecondMenuPageModel(page, config);

  if (flag) {
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
  } else {
    await menuPageModel.gotoSharedResources();

    await page.waitForNetworkIdle({ idleTime: 300 });
    await menuPageModel.structureFilePathname(downloadRange);
  }
};
