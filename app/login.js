import puppeteer from "puppeteer";
import config from "./config.js";
import LoginPageModel from "./pom/LoginPageModel.js";

export default async () => {
  const browser = await puppeteer.launch(config.launchOptions);
  const page = await browser.newPage();
  const loginPageModel = new LoginPageModel(page, config);

  const waitForFullRender = new Promise((res) => {
    setTimeout(res, config.timeout);
  });
  loginPageModel.go();
  await waitForFullRender;

  // Hit login button
  await loginPageModel.click("xpath/.//a[text()='登录']");

  // Faculty entrance
  await loginPageModel.click("#tab1");

  await loginPageModel.inputCredentials();

  // Slide to unlock
  await loginPageModel.slideToUnlock();

  console.log("This ends the login phase...\n");

  return { browser, page, loginPageModel };
};
