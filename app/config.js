import { join } from "node:path";

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
      defaultViewport: {
        width: 1440,
        height: 900,
        isMobile: false,
        hasTouch: false,
      },
    },
    goOptions: { waitUntil: "load" },
    clickOptions: {
      button: "left",
      clickCount: 1,
      delay: 100,
    },
    customOptions: {
      visible: false,
      number: 0,
    },
    curlFlags: [
      "--speed-limit",
      "300",
      "--speed-time",
      "5",
      "--max-time",
      "999999",
      "--retry",
      "3",
    ],
    paths: {
      data: "./data",
      profiles: "./profiles",
      linkmaps: function () {
        return join(this.data, "linkmaps");
      },
      sitemaps: function () {
        return join(this.data, "sitemaps");
      },
    },
  },
}[process.env.TESTENV || "local"];
