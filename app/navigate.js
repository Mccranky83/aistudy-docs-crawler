import login from "./login.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";

export default async (subjectIndex) => {
  const { browser, page, loginPageModel } = await login();
  const pageModel = new MenuPageModel(page, config);

  const waitForButtonToRender = new Promise((res) => {
    page.on("response", (r) => {
      if (r.request().resourceType() == "script") res();
    });
  });

  loginPageModel.click("#btn_submit"); // Submit
  await waitForButtonToRender;

  await pageModel.mouseClick(
    "xpath/.//img[@src='common/i/icon-bkzs.jpg']",
    null,
    config.customOptions,
  );

  // Subject Menu
  const subjects = await page.$$(
    "xpath/.//div[@id='blk_modal_bkzs']//a[contains(@href, 'dolearning')]",
  );
  const subjectNames = await Promise.all(
    subjects.map((cur) => {
      return new Promise(async (res) => {
        res(await cur.evaluate((e) => e.innerText));
      });
    }),
  );

  // Navigate to new page
  const [newPage] = await Promise.all([
    new Promise((res) => {
      page.on("popup", (p) => {
        browser.once("targetcreated", res(p));
      });
    }),
    await subjects[subjectIndex].click(),
  ]);

  const newPageModel = new MenuPageModel(newPage, config);
  await newPageModel.selectMenu(".ant-select-selection-selected-value");

  // Navigate the dropdown menu
  await newPageModel.navigateDropdown(1); // 数学建模活动学校

  await newPageModel
    .mouseClick("xpath/.//label[contains(@title, '选择注册机构')]")
    .then(async () => {
      await newPageModel.click("button", { clickCount: 2 });
    });

  console.log("\nThis ends the navigation phase...\n");

  return {
    browser,
    page: newPage,
    sitemapName: `${subjectNames[subjectIndex]} - ${subjectIndex}.json`,
  };
};
