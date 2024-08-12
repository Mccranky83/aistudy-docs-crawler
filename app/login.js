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
  try {
    await loginPageModel.go();
  } catch (e) {
    console.error(e.message);
    await page.reload(config.goOptions);
  }
  await waitForFullRender;

  // Hit the login button
  await loginPageModel.click("xpath/.//a[text()='登录']", null, {
    visible: true,
  });

  return { browser, page, loginPageModel };
};
