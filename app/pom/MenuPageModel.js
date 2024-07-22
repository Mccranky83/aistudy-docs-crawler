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
}
