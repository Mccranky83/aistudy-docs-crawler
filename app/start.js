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
    const choice_two = (
      await rl.question("Run in headless mode? (Y/n) ")
    ).trim();
    let headless = false;
    (choice_two === "y" || !choice_two) && (headless = true);

    const subjectIndex = Number(
      (await rl.question("subjectIndex [1-17]: ")).trim(),
    );
    try {
      if (!subjectIndex) throw new Error("This field cannot be empty!");
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }

    let downloadRange = {
      grade: undefined,
      semester: undefined,
      unit: undefined,
      course: undefined,
    };
    // Ask for download range
    for (let i in downloadRange) {
      let initIndex = (await rl.question(`Startup ${i} [Default: 0]: `)).trim();
      initIndex = initIndex ? Number(initIndex) : 0;
      /**
       * Assign a robust offset to ensure `roof == count` always stands in rangeCheck
       */
      let offset = (await rl.question("Offset [Default: 100]: ")).trim();
      offset = offset ? Number(offset) : 100;
      downloadRange[i] = [initIndex, initIndex + offset];
    }

    const sitemapName = await crawl(subjectIndex - 1, downloadRange, headless);
    await cleanup(sitemapName);

    /**
     * Automatically download if user doesn't respond within 1 minute
     */
    const signal = AbortSignal.timeout(60_000);
    let choice_three = "y";
    try {
      choice_three = (await rl.question("\nDownload now? (Y/n) ", { signal }))
        .trim()[0]
        ?.toLowerCase();
    } catch (e) {
      console.error(e.message);
    }
    if (choice_three === "y" || !choice_three) {
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
        process.exit(0);
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
    }
  }
})();
