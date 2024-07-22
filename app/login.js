import puppeteer from "puppeteer";
import config from "./config.js";
import LoginPageModel from "./pom/LoginPageModel.js";

export default async () => {
  const browser = await puppeteer.launch(config.launchOptions);
  const page = await browser.newPage();
  const loginPageModel = new LoginPageModel(page, config);

  const waitForFullRender = new Promise((res) => {
    page.on("load", res);
  });
  loginPageModel.go();
  await waitForFullRender;

  // Hit the login button
  await loginPageModel.click("xpath/.//a[text()='登录']", null, {
    visible: true,
  });

  // Faculty entrance
  await loginPageModel.click("#tab1", null, {
    ...config.customOptions,
    visible: true,
  });

  await loginPageModel.inputCredentials();
  await loginPageModel.slideToUnlock();

  console.log("\nThis ends the login phase...\n");

  return { browser, page, loginPageModel };
};
