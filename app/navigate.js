import login from "./login.js";
import GenericPageModel from "./pom/GenericPageModel.js";
import config from "./config.js";

export default async () => {
  const { browser, page, loginPageModel } = await login();
  const pageModel = new GenericPageModel(page, config);

  const waitForButtonToRender = new Promise((res) => {
    page.on("response", (r) => {
      if (r.request().resourceType() == "script") res();
    });
  });

  loginPageModel.click("#btn_submit"); // Submit
  await waitForButtonToRender;

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

  // Navigate the dropdown menu (2 item down)
  await newPageModel.navigateDropdown(2);

  await newPageModel
    .mouseClick("xpath/.//label[contains(@title, '选择注册机构')]")
    .then(async () => {
      await newPageModel.click("button", { clickCount: 2 });
    });

  console.log("This ends the navigation phase...\n");

  return { browser, page: newPage };
};
