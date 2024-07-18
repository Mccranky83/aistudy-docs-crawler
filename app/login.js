import puppeteer from "puppeteer";
import config from "./config.js";
import LoginPageModel from "./pom/LoginPageModel.js";

export default async () => {
  const browser = await puppeteer.launch(config.launchOptions);
  const page = await browser.newPage();
  const loginPageModel = new LoginPageModel(page, config);

  await loginPageModel.go();

  // Hit login button
  await loginPageModel.click("xpath/.//a[text()='登录']");

  // Faculty entrance
  await loginPageModel.click("#tab1");

  await loginPageModel.inputCredentials();

  // Slide to unlock
  await loginPageModel.slideToUnlock();

  // Submit
  await loginPageModel.click("#btn_submit");

  return { browser, page };
};
