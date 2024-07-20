export default class PageModel {
  constructor(page, config) {
    this.page = page;
    this.config = config;
  }

  async timeout(number) {
    return new Promise((res) => {
      let multiplier = arguments.length ? number : 1;
      setTimeout(res, this.config.timeout * multiplier);
    });
  }

  async wait(selector) {
    const element = await this.page.waitForSelector(selector);
    console.log(
      `${await element.evaluate((e) => e.innerText || "Component")} successfully loaded...`,
    );
    return element;
  }

  async go() {
    await this.page.goto(this.config.baseUrl, this.config.gotoOptions);
  }

  async position(selector) {
    const element = await this.wait(selector);
    const { x, y, width, height } = await element.boundingBox();
    return {
      x: x + width / 2,
      y: y + height / 2,
      width,
      height,
    };
  }

  async click(selector, options) {
    await this.wait(selector);
    await this.page.click(
      selector,
      Object.assign({}, this.config.clickOptions, options),
    );
  }

  async mouseClick(selector, options) {
    await this.wait(selector);
    const { x, y } = await this.position(selector);
    await this.page.mouse.click(
      x,
      y,
      Object.assign({}, this.config.clickOptions, options),
    );
  }

  async navigateDropdown(number) {
    await Promise.all(
      [...Array(number + 1)].map((_, i) =>
        i != number
          ? new Promise((res) => {
              setTimeout(() => {
                this.page.keyboard.press("ArrowDown");
                res();
              }, i * 10);
            })
          : new Promise((res) => {
              setTimeout(() => {
                this.page.keyboard.press("Enter");
                res();
              }, i * 10);
            }),
      ),
    );
  }
}
