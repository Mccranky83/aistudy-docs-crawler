import login from "./login.js";
import GenericPageModel from "./pom/GenericPageModel.js";
import config from "./config.js";

export default async () => {
  const { browser, page, loginPageModel } = await login();
  const pageModel = new GenericPageModel(page, config);

  // Check if new page has finished loading
  const waitForHomePage = new Promise((res) => {
    page.on("response", (r) => {
      if (r.request().resourceType() == "image") res(r);
    });
  });
  await loginPageModel.click("#btn_submit"); // Submit
  await waitForHomePage;

  await pageModel.mouseClick("xpath/.//img[@src='common/i/icon-bkzs.jpg']");

  // Subject Menu
  const subjects = await page.$$(
    "xpath/.//div[@id='blk_modal_bkzs']//a[contains(@href, 'dolearning')]",
  );

  // Navigate to new page
  const [newPage] = await Promise.all([
    new Promise((res) => {
      page.on("popup", (p) => {
        browser.once("targetcreated", res(p));
      });
    }),
    await subjects[0].click(),
  ]);

  const newPageModel = new GenericPageModel(newPage, config);
  const dropdownMenu = await newPageModel.wait(
    ".ant-select-selection-selected-value",
  );
  await dropdownMenu.click();

  // Move on with new institution
  await Promise.all([
    newPage.keyboard.press("ArrowDown"),
    new Promise((res) => {
      setTimeout(() => {
        newPage.keyboard.press("Enter");
        res();
      }, 300);
    }),
  ]);
  await newPageModel
    .mouseClick("xpath/.//label[contains(@title, '选择注册机构')]")
    .then(async () => {
      await newPageModel.click("button", { clickCount: 2 });
    });

  console.log("This ends the navigation phase...\n");

  return { browser, page: newPage, pageModel: newPageModel };
};
