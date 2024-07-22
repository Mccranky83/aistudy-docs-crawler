import fs from "fs";

export default {
  local: {
    baseUrl: "https://sz-api.ai-study.net/home.html",
    timeout: 1000,
    credentials: {
      username: "LS2020000101",
      password: "SHedu@21297888",
    },
    launchOptions: {
      headless: false,
      product: "chrome",
      userDataDir: `${fs.mkdtempSync("./profiles/profile_")}`,
      defaultViewport: {
        width: 1440,
        height: 900,
        isMobile: false,
        hasTouch: false,
      },
    },
    gotoOptions: { waitUntil: "load" },
    clickOptions: {
      button: "left",
      clickCount: 1,
      delay: 100,
    },
    customOptions: {
      visible: false,
      number: 0,
    },
  },
}[process.env.TESTENV || "local"];
