import GenericPageModel from "./GenericPageModel.js";

export default class MenuPageModel extends GenericPageModel {
  constructor(page, config) {
    super(page, config);
    this.menuOptions = this.config.menuOptions;
  }

  async reselectCourse() {
    await this.click(this.menuOptions.reselect, this.config.clickOptions);
  }

  async getCourseMenu() {
    await this.page.waitForSelector(this.menuOptions.confirm);
    return await this.page.$$(this.menuOptions.confirm);
  }
}
