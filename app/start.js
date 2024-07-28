import crawl from "./crawl.js";
import cleanup from "./cleanup.js";
import download from "./download.js";

(async () => {
  // PE (subjectIndex = 3) has mismatched gradeNames each semester
  const sitemapName = await crawl(4);
  await cleanup(sitemapName);
  await download(sitemapName);
})();
