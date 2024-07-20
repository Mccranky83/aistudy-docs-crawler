import navigate from "./navigate.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";

(async () => {
  const { browser, page } = await navigate();
  const menuPageModel = new MenuPageModel(page, config);
  await page.waitForNetworkIdle({ idleTime: 100 });
  await menuPageModel.reselectCourse();

  await page.waitForNetworkIdle({ idleTime: 100 });
  const confirmButtons = await menuPageModel.getCourseMenu();

  await confirmButtons[0].click();
})();
