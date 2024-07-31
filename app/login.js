import puppeteer from "puppeteer";
import config from "./config.js";
import LoginPageModel from "./pom/LoginPageModel.js";
import fs from "node:fs";

export default async (headless) => {
  for (let i in config.paths) {
    fs.mkdirSync(
      typeof config.paths[i] === "string" ? config.paths[i] : config.paths[i](),
      { recursive: true },
    );
  }
  const launchOptions = {
    ...config.launchOptions,
    userDataDir: fs.mkdtempSync(`${config.paths.profiles}/profile_`),
    headless,
  };
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  const loginPageModel = new LoginPageModel(page, config);

  const waitForFullRender = new Promise((res) => {
    page.on("load", async () => {
      await loginPageModel.timeout();
      res();
    });
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
