import GenericPageModel from "./GenericPageModel.js";

export default class MenuPageModel extends GenericPageModel {
  constructor(page, config) {
    super(page, config);
    this.menuOptions = this.config.menuOptions;
  }

  // async getCourseMenu() {
  //   const confirm_btn_xpath = "xpath/.//span[contains(text(), '确 定')]/..";
  //   await this.page.waitForSelector(confirm_btn_xpath);
  //   return await this.page.$$(confirm_btn_xpath);
  // }

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

    await Promise.all([this.search(), this.timeout()]);
    await this.click("xpath/.//*[text()[contains(.,'共享课程')]]");
  }

  async populateMapWithUnits() {
    let sitemap = {};
    const sidebar = await this.page.$(
      "xpath/.//div[@class='ant-layout-sider-children']",
    );
    const sidebarItems = await sidebar.$$(
      "xpath/.//div[@class[contains(.,'ant-collapse-item')]]",
    );

    let activePromises = 0; // apple a lock mechanism

    const promise = await Promise.all(
      /* These promises should resolve sequentially;
       * therefore, can't predefine then iterate */
      sidebarItems.map((cur, i) => {
        return new Promise(async (res) => {
          while (activePromises > 0) {
            await this.timeout();
          }

          activePromises++; // lock

          const outerHTML = await cur.evaluate((e) => e.outerHTML);
          if (outerHTML.includes("active") == false) await cur.click();

          await cur.waitForSelector("xpath/.//*[@class='ant-tag']", {
            visible: true,
          });
          const unitHandles = await cur.$$(
            "xpath/.//span[text()[contains(., '年级') and string-length(.) > string-length('年级')]]",
          );

          const unitNames = await Promise.all(
            unitHandles.map(async (cur) => {
              return await (
                await cur.$("xpath/.//ancestor::div[@class='unit-title']")
              ).evaluate((e) => e.innerText.split(":")[1]);
            }),
          );

          await (async () => {
            for (let unitHandle of unitHandles) {
              await unitHandle.click();
              const courses_xpath =
                "xpath/.//div[@class[contains(., 'lesson-card')]]";
              await this.wait(courses_xpath);
              const courseHandles = await this.page.$$(courses_xpath);
              console.log(courseHandles.length);
            }
          })();

          // print each handle to console
          //
          /* await Promise.all(
              unitHandles.map((cur, i) => {
                return new Promise((res) => {
                  setTimeout(
                    async () => {
                      console.log(await cur.evaluate((e) => e.innerText));
                      res();
                    },
                    (i + 1) * 50,
                  );
                });
              }),
            ); */

          const gradeNames = (
            await Promise.all(
              unitHandles.map((cur) => cur.evaluate((e) => e.innerText)),
            )
          ).filter((cur, i, self) => {
            return self.slice(i + 1).find((n) => n === cur) ? false : true;
          });

          gradeNames.forEach((grade) => {
            Object.assign(sitemap, {
              [grade]: { unitHandles: [], unitNames: [] },
            });
          });

          for (const gradeName of gradeNames) {
            unitHandles.forEach((cur) => {
              sitemap[gradeName].unitHandles.push(cur);
            });
            unitNames.forEach((cur) => {
              sitemap[gradeName].unitNames.push(cur);
            });
          }

          activePromises--; // unlock

          res();
        });
      }),
    );
    return { promise, sitemap };
  }
}
