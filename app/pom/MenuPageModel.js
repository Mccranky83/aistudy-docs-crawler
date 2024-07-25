import GenericPageModel from "./GenericPageModel.js";

export default class MenuPageModel extends GenericPageModel {
  constructor(page, config) {
    super(page, config);
    this.menuOptions = this.config.menuOptions;
  }

  /**
   * Both reselectCourses and expandGradeScope can cause involuntary page refresh,
   * which also removes elements from the DOM :(
   */
  async reselectCourses() {
    const btn_xpath = "xpath/.//span[text()='重选课时']";
    const message = await this.page.$eval(btn_xpath, (button) => {
      button.click();
      return `${button.innerText || "Component"} successfully loaded...`;
    });
    console.log(message);
  }

  async search() {
    await this.click("xpath/.//span[text()='检索']");
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

    await this.click("xpath/.//*[text()[contains(.,'共享课程')]]");
    await this.timeout(0.5);
    await this.search();
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
    await unitHandle.click();
    const courses_xpath = "xpath/.//div[@class[contains(., 'lesson-card')]]";
    await this.wait(courses_xpath);
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

  async populateMapWithUnits() {
    let sitemap = {};

    let activePromises = 0; // apple a lock mechanism

    await this.page.waitForNetworkIdle({ idleTime: 300 });
    await this.reselectCourses();

    await this.timeout();
    await this.expandGradeScope();

    await this.timeout();
    const sidebarItems = await this.getSidebarItems();

    await Promise.all(
      /**
       * These promises should resolve sequentially;
       * therefore, can't predefine then iterate
       */
      sidebarItems.map((cur) => {
        return new Promise(async (res) => {
          while (activePromises > 0) {
            await this.timeout();
          }

          activePromises++; // lock

          const { unitHandles, unitNames, gradeNames } =
            await this.getUnitElements(cur);

          gradeNames.forEach((grade) => {
            Object.assign(sitemap, {
              [grade]: { unitNames: [] },
            });
          });

          // Refrain from using forEach as it runs operations in parallel
          for (const gradeName of gradeNames) {
            for (let unitHandle of unitHandles) {
              const { courseNames } = await this.getCourseElements(unitHandle);
              sitemap[gradeName].unitNames.push({
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
    await this.timeout();
    await this.reload();
    return sitemap;
  }

  async getCourseUrls() {
    const sitemap = await this.populateMapWithUnits();

    const gradesIterator = async (sidebarIndex = 0) => {
      const gradeLevel = Object.keys(sitemap);
      if (sidebarIndex === gradeLevel.length) return;

      const unitsIterator = async (unitIndex = 0) => {
        const unitLevel = sitemap[gradeLevel[sidebarIndex]].unitNames;
        if (unitIndex === unitLevel.length) return;

        const coursesIterator = async (courseIndex = 0) => {
          const courseLevel = unitLevel[unitIndex].courseNames;
          if (courseIndex === courseLevel.length) return;

          await this.page.waitForNetworkIdle({ idleTime: 100 });
          await this.reselectCourses();

          await this.timeout();
          await this.expandGradeScope();

          await this.page.waitForNetworkIdle({ idleTime: 100 });
          const sidebarItem = (await this.getSidebarItems())[sidebarIndex];

          const { unitHandles } = await this.getUnitElements(sidebarItem);

          await this.timeout(0.1); // Wait for dropdown animation to finish

          const unitHandle = await unitHandles[unitIndex];
          const { courseHandles } = await this.getCourseElements(unitHandle);
          const confirmButton = await courseHandles[courseIndex].$("button", {
            visible: true,
          });

          await confirmButton.click();
          await this.page.waitForNetworkIdle({ idleTime: 500 });
          const downloadButton = await this.wait(
            "xpath/.//a[@class='button-download']",
          );
          const courseUrl = await downloadButton.evaluate((e) =>
            e.getAttribute("href"),
          );

          unitLevel[unitIndex].courseUrls.push(courseUrl); // Write to sitemap

          await coursesIterator(courseIndex + 1);
        };
        await coursesIterator();
        await unitsIterator(unitIndex + 1);
      };
      await unitsIterator();
      await gradesIterator(sidebarIndex + 1);
    };
    await gradesIterator();
    return sitemap;
  }
}
