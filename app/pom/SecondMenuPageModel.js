import MenuPageModel from "./MenuPageModel.js";

export default class SecondMenuPageModel extends MenuPageModel {
  constructor(page, config) {
    super(page, config);
  }

  async gotoSharedResources() {
    await this.page.waitForNetworkIdle({ idleTime: 300 });
    const icon_xpath = "xpath/.//div[@class='do-header']//img";
    const iconElement = await this.wait(icon_xpath, { visible: true });
    await iconElement.click();
    await this.timeout(0.5); // Wait for side menu to appear
    const menu_xpath =
      "xpath/.//ul[@class[contains(., 'ant-menu ant-menu-vertical ant-menu-root ant-menu-light')]]";
    await this.wait(menu_xpath, { visible: true });
    const { x, y } = await this.position(menu_xpath + "/li[3]");
    await this.page.mouse.move(x, y);
    await this.timeout(0.5);
    await this.page.mouse.move(x + 140, y);
    await this.timeout(0.5);
    await this.page.mouse.click(x + 140, y);
  }

  async expandSidebarMenu(container_xpath) {
    await this.wait(container_xpath + "/div");
    const elements = await this.page.$$(container_xpath + "/div");
    console.log(elements.length);
    console.log(elements);
  }

  async structureFilePathname() {
    const container_xpaths = {
      grade_wrapper: "xpath/.//div[@class='list']",
    };
    for (let container in container_xpaths) {
      await this.expandSidebarMenu(container_xpaths[container]);
    }
  }
}
