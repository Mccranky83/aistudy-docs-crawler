import navigate from "./navigate.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";

(async () => {
  let sitemap = {};
  const { browser, page } = await navigate();
  const menuPageModel = new MenuPageModel(page, config);
  await page.waitForNetworkIdle({ idleTime: 500 });
  await menuPageModel.reselectCourses();

  await menuPageModel.timeout();
  await menuPageModel.expandGradeScope();

  await menuPageModel.timeout();
  const sidebar = await page.$(
    "xpath/.//div[@class='ant-layout-sider-children']",
  );
  const sidebarItems = await sidebar.$$(
    "xpath/.//div[@class[contains(.,'ant-collapse-item')]]",
  );

  // Populate sitemap with elementHandles
  await Promise.all(
    sidebarItems.map((cur, i) => {
      return new Promise((res) => {
        setTimeout(
          async () => {
            const outerHTML = await cur.evaluate((e) => e.outerHTML);
            if (outerHTML.includes("active") == false) await cur.click();

            await cur.waitForSelector("xpath/.//*[@class='ant-tag']", {
              visible: true,
            });
            const unitHandles = await cur.$$(
              "xpath/.//span[text()[contains(., '年级') and string-length(.) > string-length('年级')]]",
            );

            // print each handle to console
            //
            /* await Promise.all(
              unitHandles.map((cur, i) => {
                return new Promise((res) => {
                  setTimeout(
                    async () => {
                      console.log(await cur.evaluate((e) => e.innerText));
                      res();
                    },
                    (i + 1) * 50,
                  );
                });
              }),
            ); */

            (
              await Promise.all(
                unitHandles.map((cur) => cur.evaluate((e) => e.innerText)),
              )
            )
              .filter((cur, i, self) => {
                return self.slice(i + 1).find((n) => n === cur) ? false : true;
              })
              .forEach((grade) => {
                Object.assign(sitemap, { [grade]: { unitHandles: [] } });
              });

            for (const unitHandle of unitHandles) {
              const gradeName = await unitHandle.evaluate((e) => e.innerText);
              sitemap[gradeName].unitHandles.push(unitHandle);
            }
            res();
          },
          (i + 1) * 3000,
        );
      });
    }),
  );
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
