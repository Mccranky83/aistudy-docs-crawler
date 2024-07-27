import GenericPageModel from "./GenericPageModel.js";

export default class MenuPageModel extends GenericPageModel {
  constructor(page, config) {
    super(page, config);
    this.menuOptions = this.config.menuOptions;
    this.sitemap = {};
    /**
     * For unknown reasons, 下 has to be placed before 上
     */
    this.semesters = ["下", "上"];
  }

  /**
   * Both reselectCourses and expandGradeScope can cause involuntary page refresh,
   * which also removes elements from the DOM :(
   */
  async reselectCourses() {
    const btn_xpath = "xpath/.//span[text()='重选课时']";
    await this.wait("xpath/.//span[text()='重选课时']");
    const message = await this.page.$eval(btn_xpath, (button) => {
      button.click();
      return `${button.innerText || "Component"} successfully loaded...`;
    });
    console.log(message);
  }

  async search() {
    await Promise.all([
      this.click("xpath/.//span[text()='检索']"),
      this.page.waitForNetworkIdle({ idleTime: 300 }),
    ]);
  }

  async selectMenu(selector, number) {
    await this.wait(selector);
    const dropdownMenu = await this.click(selector, null, {
      ...this.config.customOptions,
      number: number || 0,
    });
    return dropdownMenu;
  }

  async reload() {
    const close = await this.wait("xpath/.//div[text()='选择课时']/../button");
    await close.click();
  }

  async expandGradeScope() {
    const menu_xpath = "xpath/.//span[@class='ant-form-item-children']";
    const menu = await this.selectMenu(menu_xpath, 1);
    const menu_label = await (
      await menu.$("xpath/.//div[@class='ant-select-selection-selected-value']")
    ).evaluate((e) => e.innerText.trim());

    let number = undefined;
    switch (menu_label[0]) {
      case "一":
        number = 5;
        break;
      case "二":
        number = 4;
        break;
      case "三":
        number = 3;
        break;
      case "四":
        number = 2;
        break;
      case "五":
        number = 1;
        break;
      case "不":
        number = 0;
        break;
      default:
        break;
    }

    number
      ? await this.navigateDropdown(number)
      : await this.page.keyboard.press("Enter");

    /**
     * Press search before entering shared courses panel
     * No need to follow up with more delays
     */
    await this.search();
    await this.click("xpath/.//*[text()[contains(.,'共享课程')]]");
  }

  async selectSemester(semester) {
    const menu_xpath = "xpath/.//span[@class='ant-form-item-children']";
    const menu = await this.selectMenu(menu_xpath, 2);
    const menu_label = await (
      await menu.$("xpath/.//div[@class='ant-select-selection-selected-value']")
    ).evaluate((e) => e.innerText.trim());

    let number = undefined;
    switch (menu_label[0]) {
      case "上":
        if (semester === "上") number = 0;
        else number = 1;
        break;
      case "下":
        if (semester === "下") number = 0;
        else number = 2;
        break;
      case "全":
        if (semester === "上") number = 1;
        else number = 2;
        break;
      default:
        break;
    }

    number
      ? await this.navigateDropdown(number)
      : await this.page.keyboard.press("Enter");
  }

  async getSidebarItems() {
    const sidebar = await this.page.$(
      "xpath/.//div[@class='ant-layout-sider-children']",
    );
    const sidebarItems = await sidebar.$$(
      "xpath/.//div[@class[contains(.,'ant-collapse-item')]]",
    );
    return sidebarItems;
  }

  async getUnitElements(sidebarItem) {
    await this.clickSidebarItem(sidebarItem);
    await sidebarItem.waitForSelector("xpath/.//*[@class='ant-tag']", {
      visible: true,
    });
    const unitHandles = await sidebarItem.$$(
      "xpath/.//span[text()[contains(., '年级') and string-length(.) > string-length('年级')]]",
    );

    const unitNames = await Promise.all(
      unitHandles.map(async (cur) => {
        return await (
          await cur.$("xpath/.//ancestor::div[@class='unit-title']")
        ).evaluate((e) => e.innerText.split(":")[1]);
      }),
    );

    const gradeNames = (
      await Promise.all(
        unitHandles.map((cur) => cur.evaluate((e) => e.innerText)),
      )
    ).filter((cur, i, self) => {
      return self.slice(i + 1).find((n) => n === cur) ? false : true;
    });

    return { unitHandles, unitNames, gradeNames };
  }

  async getCourseElements(unitHandle) {
    /**
     * Without this timeout, the second iteration will fail
     */
    await this.timeout(0.05); // Wait for unitHandle to be visible
    await unitHandle.click();
    const courses_xpath = "xpath/.//div[@class[contains(., 'lesson-card')]]";
    const courseHandles = await this.page.$$(courses_xpath);
    const courseNames = await Promise.all(
      courseHandles.map((cur) => {
        return new Promise(async (res) => {
          res(
            (await cur.$("xpath/.//span[@class='editable-span']")).evaluate(
              (e) => e.innerText,
            ),
          );
        });
      }),
    );
    return { courseHandles, courseNames };
  }

  async clickSidebarItem(sidebarItem) {
    const outerHTML = await sidebarItem.evaluate((e) => e.outerHTML);
    if (outerHTML.includes("active") == false) await sidebarItem.click();
  }

  async structureSitemap() {
    const semesters = this.semesters;

    let activePromises = 0; // apply a lock mechanism

    for (let semester of semesters) {
      await this.page.waitForNetworkIdle({ idleTime: 300 });
      await this.reselectCourses();

      await this.page.waitForNetworkIdle({ idleTime: 300 });
      await this.selectSemester(semester);
      await this.expandGradeScope();

      // No need to wait for network idle here
      const sidebarItems = await this.getSidebarItems();

      await Promise.all(
        /**
         * These promises should resolve sequentially;
         * therefore, can't predefine then iterate
         */
        sidebarItems.map((cur) => {
          return new Promise(async (res) => {
            while (activePromises > 0) {
              await this.timeout(); // Put on hold until the lock is released
            }

            activePromises++; // lock

            const { unitHandles, unitNames, gradeNames } =
              await this.getUnitElements(cur);

            if (!semesters.indexOf(semester)) {
              gradeNames.forEach((grade) => {
                Object.assign(this.sitemap, {
                  [grade]: {
                    [semester]: {
                      unitNames: [],
                    },
                  },
                });
              });
            } else {
              gradeNames.forEach((grade) => {
                // gradeNames of either semester may not include all grades
                if (!this.sitemap[grade]) this.sitemap[grade] = {};
                this.sitemap[grade][semester] = { unitNames: [] };
              });
            }

            // Refrain from using forEach as it runs operations in parallel
            for (const gradeName of gradeNames) {
              for (let unitHandle of unitHandles) {
                const { courseNames } =
                  await this.getCourseElements(unitHandle);
                this.sitemap[gradeName][semester] &&
                  this.sitemap[gradeName][semester].unitNames.push({
                    unitName: unitNames[unitHandles.indexOf(unitHandle)],
                    courseNames,
                    courseUrls: [],
                  });
              }
            }

            activePromises--; // unlock

            res();
          });
        }),
      );
      await this.timeout(0.1); // For smoother closing animation
      await this.reload();
    }
    return this.sitemap;
  }

  // Doesn't support mismatched gradeNames
  async populateSitemap(sitemap) {
    const gradesIterator = async (sidebarIndex = 0) => {
      const gradeLevel = Object.keys(sitemap);
      if (sidebarIndex === gradeLevel.length) return;

      const semesterIterator = async (semesterIndex = 0) => {
        const semesterLevel = Object.keys(sitemap[gradeLevel[sidebarIndex]]);
        if (semesterIndex === semesterLevel.length) return;

        const unitsIterator = async (unitIndex = 0) => {
          const unitLevel =
            sitemap[gradeLevel[sidebarIndex]][semesterLevel[semesterIndex]]
              .unitNames;
          if (unitIndex === unitLevel.length) return;

          const coursesIterator = async (courseIndex = 0) => {
            const courseLevel = unitLevel[unitIndex].courseNames;
            if (courseIndex === courseLevel.length) return;

            await this.page.waitForNetworkIdle({ idleTime: 300 });
            await this.reselectCourses();

            await this.page.waitForNetworkIdle({ idleTime: 300 });
            await this.selectSemester(semesterLevel[semesterIndex]);
            await this.expandGradeScope();

            // No need to wait for network idle here
            const sidebarItem = (await this.getSidebarItems())[sidebarIndex];

            const { unitHandles } = await this.getUnitElements(sidebarItem);

            await this.timeout(0.1); // Wait for dropdown animation to finish

            const unitHandle = await unitHandles[unitIndex];
            const { courseHandles } = await this.getCourseElements(unitHandle);
            const confirmButton = await courseHandles[courseIndex].$("button", {
              visible: true,
            });
            await confirmButton.click();

            await this.page.waitForNetworkIdle({ idleTime: 300 });
            /**
             * Note that some units don't have download buttons
             */
            let courseUrl = "";
            try {
              courseUrl = await (
                await this.page.waitForSelector(
                  "xpath/.//a[@class='button-download']",
                  { timeout: 1000 },
                )
              ).evaluate((e) => e.getAttribute("href"));
            } catch (e) {
              console.error(e.message);
            }
            unitLevel[unitIndex].courseUrls.push(courseUrl); // Write to sitemap

            /**
             * Keep the await keyword to prevent each iteration from running in parallel
             */
            await coursesIterator(courseIndex + 1);
            // await coursesIterator(courseIndex + courseLevel.length); // For debugging
          };
          await coursesIterator();
          await unitsIterator(unitIndex + 1);
        };
        await unitsIterator();
        await semesterIterator(semesterIndex + 1);
      };
      await semesterIterator();
      await gradesIterator(sidebarIndex + 1);
    };
    await gradesIterator();
    return sitemap;
  }
}
