import login from "./login.js";
import MenuPageModel from "./pom/MenuPageModel.js";
import config from "./config.js";

export default async (subjectIndex, headless) => {
  const { browser, page, loginPageModel } = await login(headless);
  while (1) {
    // Faculty entrance
    await loginPageModel.click("#tab1", null, {
      ...config.customOptions,
      visible: true,
    });

    /**
     * Exit if the user cancels login
     */
    const status_code = await loginPageModel.inputCredentials().catch((e) => {
      console.log(e.message);
      return 1;
    });
    status_code && (await page.close(), await browser.close(), process.exit(0));

    await loginPageModel.slideToUnlock();

    const promise = new Promise((res) => {
      browser.on("targetchanged", () => {
        res("targetchanged");
      });
    });
    await loginPageModel.click("#btn_submit");
    const error_message_xpath = "xpath/.//div[@class='error_message']";
    const message = await Promise.race([
      promise,
      page.waitForSelector(error_message_xpath),
    ]);
    const error_number =
      message === "targetchanged"
        ? 0
        : await message.evaluate((e) => e.children.length);
    console.error(`\nError number: ${error_number}`);
    if (error_number) {
      console.error("\nIncorrect credentials, retrying...\n");
      await page.goBack(config.goOptions);
      continue;
    } else {
      console.log("\nLogin successful!\n");
      break;
    }
  }

  const pageModel = new MenuPageModel(page, config);
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

  /**
   * Ensure that the process is not cut off in high-latency networks
   */
  newPage.setDefaultTimeout(60_000);

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
    sitemapName: `${subjectNames[subjectIndex]} - ${subjectIndex + 1}.json`,
  };
};
