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

  async expandSidebarMenu(containers_xpath, init_range, index) {
    await this.wait(containers_xpath);
    const containers = await this.page.$$(containers_xpath);

    let dropdown_btns = [];
    let element_titles = [];

    for (let container of containers) {
      const children_xpath = index < 1 ? "xpath/./div" : "xpath/./li";
      await container.waitForSelector(children_xpath);
      let elements = await container.$$(children_xpath);
      const range = index === 1 ? [] : this.rangeCheck(init_range, 0, elements);
      elements = elements.slice(...range);

      for (let e of elements) {
        const btn_selector = "svg";
        const title_xpath =
          index < 1
            ? "xpath/.//span[2]"
            : "xpath/.//span[@class='ant-tree-title']";
        const btn = await e.waitForSelector(btn_selector);
        dropdown_btns.push(btn);
        element_titles.push(await e.$eval(title_xpath, (e) => e.innerText));
      }

      let lock = false;
      await Promise.all(
        dropdown_btns.map((cur) => {
          return new Promise(async (res) => {
            while (lock) {
              await this.timeout();
            }
            lock = true;

            const container =
              index < 1
                ? await cur.$(
                    "xpath/.//ancestor::div[@class[contains(., 'saved-folder')]][1]",
                  )
                : await cur.$("xpath/.//ancestor::li[1]");
            !(
              await container.evaluate((e) => e.getAttribute("class"))
            ).includes(index < 1 ? "unfolded" : "open") && (await cur.click());
            lock = false;
            res();
          });
        }),
      );
    }

    return element_titles;
  }

  async structureFilePathname(downloadRange) {
    const container_xpaths = {
      grade_wrapper: "xpath/.//div[@class='list']",
    };
    container_xpaths.grade =
      container_xpaths.grade_wrapper +
      "//ul[@class[contains(., 'ant-tree-block-node')]]";
    container_xpaths.semester =
      container_xpaths.grade +
      "//ul[@class[contains(., 'ant-tree-child-tree')]]";
    container_xpaths.unit =
      container_xpaths.semester +
      "//ul[@class[contains(., 'ant-tree-child-tree')]]";

    const traverse = async (index = 0) => {
      if (index >= Object.keys(container_xpaths).length) return;
      const level_key = Object.keys(container_xpaths)[index];
      const range_key =
        Object.keys(downloadRange)[index == 0 ? index : index - 1];
      await this.expandSidebarMenu(
        container_xpaths[level_key],
        downloadRange[range_key],
        index,
      );
      await this.timeout(0.5); // Wait for dropdown menu to expand
      await traverse(index + 1);
    };
    await traverse();
  }
}
