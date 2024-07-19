import puppeteer from "puppeteer";
import fs from "node:fs";

const options = {
  local: {
    timeout: 30000,
    launchOptions: {
      headless: false,
      userDataDir: `${fs.mkdtempSync("../profiles/profile_")}`,
    },
    goOptions: {
      waitUntil: "load",
    },
  },
};

(async () => {
  const browser = await puppeteer.launch(options.local.launchOptions);
  const page = await browser.newPage();

  page.setDefaultTimeout(options.local.timeout / 10);
  page.setDefaultNavigationTimeout(options.local.timeout);

  const promise = new Promise((res) => {
    page.on("response", (r) => {
      if (r.request().resourceType() == "image") {
        res(`Image URL: ${r.url()}`);
      }
    });
  }); // pending

  await Promise.all([page.goto("https://www.google.com"), await promise]);
  console.log(promise);

  // const picture = (await page.$$("img"))[0];
  // console.log(`innerHTML: ${await picture.evaluate((e) => e.innerHTML)}`);
  // console.log(picture.evaluate((e) => e.innerText)); // returns a pending promise

  const luckySearch = (
    await page.$$("xpath/.//div[@class='FPdoLc lJ9FBc']//input[2]")
  )[0];
  luckySearch.click();
})();
