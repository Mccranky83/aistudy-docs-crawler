import crawl from "./crawl.js";
import cleanup from "./cleanup.js";
import download from "./download.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import "zx/globals";
import config from "./config.js";

(async () => {
  const rl = readline.createInterface({ input, output });

  rl.on("close", () => {
    console.log("Exiting...");
    process.exit(0);
  });

  // PE (subjectIndex = 3) has mismatched gradeNames each semester
  const choice_one = (
    await rl.question("Directly download or crawl first? (d/C) ")
  )
    .trim()[0]
    ?.toLowerCase();
  if (choice_one === "c" || !choice_one) {
    const subjectIndex = Number(
      (await rl.question("subjectIndex [0-24]: ")).trim(),
    );
    const sitemapName = await crawl(subjectIndex);
    await cleanup(sitemapName);
    const choice_two = (await rl.question("Download now? (Y/n) "))
      .trim()[0]
      ?.toLowerCase();
    if (choice_two === "y" || !choice_two) {
      await download(sitemapName);
      process.exit(0);
    } else {
      console.log("Exiting...");
      process.exit(0);
    }
  } else {
    let flag = true;
    try {
      await $`test -d ${config.paths.linkmaps()}`;
    } catch (e) {
      flag = false;
      const exitCode = e.exitCode;
      echo`No linkmaps available!`;
      process.exit(exitCode);
    }

    if (flag) {
      console.log(
        (await $`/bin/ls -C ${config.paths.linkmaps()}`).stdout.trim(),
      );
      const sitemapName = (await rl.question("sitemapName: ")).trim();
      /**
       * Handle invalid input errors
       */
      try {
        await download(sitemapName);
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
    }
  }
})();
