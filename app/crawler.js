import navigate from "./navigate.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";

(async () => {
  const { browser, page } = await navigate();
  const menuPageModel = new MenuPageModel(page, config);
  await page.waitForNetworkIdle({ idleTime: 500 });
  await menuPageModel.reselectCourses();

  await menuPageModel.timeout();
  await menuPageModel.expandGradeScope();

  await menuPageModel.timeout();
  const { sitemap } = await menuPageModel.populateMapWithUnits();
  console.log(sitemap);

  /* 

  // Click each unit
  for (const grade in sitemap) {
    await Promise.all(
      sitemap[grade].unitHandles.map(
        (cur, i) =>
          new Promise((res) => {
            setTimeout(
              () => {
                cur.click(config.clickOptions);
                res();
              },
              config.timeout * 0.5 * (i + 1),
            );
          }),
      ),
    );
  } */
})();
