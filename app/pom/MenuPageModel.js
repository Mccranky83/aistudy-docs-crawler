import GenericPageModel from "./GenericPageModel.js";

export default class MenuPageModel extends GenericPageModel {
  constructor(page, config) {
    super(page, config);
    this.sitemap = {};
    this.semesters = ["上", "下"];
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
    await this.page.reload(this.config.goOptions); // Reload page due to jammy dropdown buttons
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
      case "六":
        number = 4;
        break;
      case "七":
        number = 3;
        break;
      case "八":
        number = 2;
        break;
      case "九":
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
    await this.page.waitForNetworkIdle({ idleTime: 100 }); // Wait for search to finish
    const sharedCourses_xpath = "xpath/.//*[text()[contains(.,'共享课程')]]";
    await this.page.waitForSelector(sharedCourses_xpath, { timeout: 10_000 });
    await this.click(sharedCourses_xpath);
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
    const sidebar_xpath = "xpath/.//div[@class='ant-layout-sider-children']";
    await this.page.waitForSelector(sidebar_xpath, { timeout: 10_000 });
    const sidebar = await this.page.$(sidebar_xpath);
    const sidebarItems_xpath =
      "xpath/.//div[@class[contains(.,'ant-collapse-item')]]";
    await this.page.waitForSelector(sidebarItems_xpath, { timeout: 10_000 });
    const sidebarItems = await sidebar.$$(sidebarItems_xpath);
    return sidebarItems;
  }

  async getUnitElements(sidebarItem) {
    await this.clickSidebarItem(sidebarItem);
    await sidebarItem.waitForSelector("xpath/.//*[@class='ant-tag']", {
      visible: true,
      timeout: 10_000,
    });
    const unitHandles_xpath =
      "xpath/.//span[text()[contains(., '年级') and string-length(.) > string-length('年级')]]";
    const unitHandles = await sidebarItem.$$(unitHandles_xpath);

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
    await this.page.waitForSelector(courses_xpath, { timeout: 10_000 });
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

  async clickTab(number) {
    await this.page.waitForNetworkIdle({ idleTime: 300 });
    const tab_xpath = "xpath/.//div[@class='ant-tabs-nav-scroll']//button";
    await this.page.waitForSelector(tab_xpath);
    const tab = (await this.page.$$(tab_xpath))[number || 0];
    await tab.click();
  }

  async clickSidebarItem(sidebarItem) {
    const outerHTML = await sidebarItem.evaluate((e) => e.outerHTML);
    if (outerHTML.includes("active") == false) await sidebarItem.click();
  }

  async structureSitemap(downloadRange, number) {
    const { grade, semester, unit, course } = downloadRange;
    const semesterRange = this.rangeCheck(semester, 0, this.semesters);
    const semesters = this.semesters.slice(...semesterRange);

    let activePromises = 0; // apply a lock mechanism

    for (let semester of semesters) {
      await this.page.waitForNetworkIdle({ idleTime: 300 });
      await this.clickTab(number);
      await this.reselectCourses();

      await this.page.waitForNetworkIdle({ idleTime: 300 });
      await this.selectSemester(semester);
      await this.expandGradeScope();

      // No need to wait for network idle here
      let sidebarItems = await this.getSidebarItems();
      const gradeRange = this.rangeCheck(grade, 0, sidebarItems);
      sidebarItems = sidebarItems.slice(...gradeRange);

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

            let { unitHandles, unitNames, gradeNames } =
              await this.getUnitElements(cur);
            const unitRange = this.rangeCheck(unit, 0, unitHandles);
            unitHandles = unitHandles.slice(...unitRange);
            unitNames = unitNames.slice(...unitRange);

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
                let { courseNames } = await this.getCourseElements(unitHandle);
                const courseRange = this.rangeCheck(course, 0, courseNames);
                courseNames = courseNames.slice(...courseRange);
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

  rangeCheck(section, index, level, lock) {
    const count = level.length;
    let roof = count;
    // Implement a lock flag to reassign index variable the first time
    !lock && section[0] < count && section[0] >= 0 && (index = section[0]);
    // section[1] in range
    section[1] <= count && section[1] > 0 && (roof = section[1]);
    return [index, roof];
  }

  // Doesn't support mismatched gradeNames
  async populateSitemap(sitemap, downloadRange, number) {
    const { grade, semester, unit, course } = downloadRange;
    const gradesIterator = async (initIndex = 0, lock = false) => {
      const gradeLevel = Object.keys(sitemap);
      const [sidebarIndex, maxGrade] = this.rangeCheck(
        grade,
        initIndex,
        gradeLevel,
        lock,
      );
      if (sidebarIndex >= maxGrade) return;

      const semesterIterator = async (initIndex = 0, lock = false) => {
        const semesterLevel = Object.keys(sitemap[gradeLevel[sidebarIndex]]);
        const [semesterIndex, maxSemester] = this.rangeCheck(
          semester,
          initIndex,
          semesterLevel,
          lock,
        );
        if (semesterIndex >= maxSemester) return;

        const unitsIterator = async (initIndex = 0, lock = false) => {
          const unitLevel =
            sitemap[gradeLevel[sidebarIndex]][semesterLevel[semesterIndex]]
              .unitNames;
          const [unitIndex, maxUnit] = this.rangeCheck(
            unit,
            initIndex,
            unitLevel,
            lock,
          );
          if (unitIndex >= maxUnit) return;

          const coursesIterator = async (initIndex = 0, lock = false) => {
            const courseLevel = unitLevel[unitIndex].courseNames;
            const [courseIndex, maxCourse] = this.rangeCheck(
              course,
              initIndex,
              courseLevel,
              lock,
            );
            if (courseIndex >= maxCourse) return;

            let sidebarTimeout = false;
            try {
              await this.page.waitForNetworkIdle({ idleTime: 300 });
              await this.clickTab(number);
              await this.reselectCourses();

              await this.page.waitForNetworkIdle({ idleTime: 300 });
              await this.selectSemester(semesterLevel[semesterIndex]);
              await this.expandGradeScope();

              // No need to wait for network idle here

              const sidebarItem = (await this.getSidebarItems())[sidebarIndex];
              const { unitHandles } = await this.getUnitElements(sidebarItem);

              await this.timeout(0.1); // Wait for dropdown animation to finish

              const unitHandle = await unitHandles[unitIndex];
              const { courseHandles } =
                await this.getCourseElements(unitHandle);
              const confirmButton = await courseHandles[courseIndex].$(
                "button",
                {
                  visible: true,
                },
              );
              await confirmButton.click();
            } catch (e) {
              sidebarTimeout = true;
              console.log(e.message);
              await coursesIterator(courseIndex); // Reiterate course cycle
            }

            if (!sidebarTimeout) {
              await this.page.waitForNetworkIdle({ idleTime: 300 });
              /**
               * Note that some units don't have download buttons
               */
              let courseUrl;
              try {
                courseUrl = await (
                  await this.page.waitForSelector(
                    "xpath/.//a[@class='button-download']",
                    { timeout: 1000 },
                  )
                ).evaluate((e) => e.getAttribute("href"));
              } catch (e) {
                courseUrl = "";
                console.error(e.message);
              }
              unitLevel[unitIndex].courseUrls.push(courseUrl); // Write to sitemap

              /**
               * Keep the await keyword to prevent each iteration from running in parallel
               */
              await coursesIterator(courseIndex + 1, true);
              // await coursesIterator(courseIndex + courseLevel.length); // For debugging
            }
          };
          await coursesIterator();
          await unitsIterator(unitIndex + 1, true);
        };
        await unitsIterator();
        await semesterIterator(semesterIndex + 1, true);
      };
      await semesterIterator();
      await gradesIterator(sidebarIndex + 1, true);
    };
    await gradesIterator();
    return sitemap;
  }
}
