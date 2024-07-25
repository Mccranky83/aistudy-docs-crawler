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

  async wait(selector, customOptions) {
    const waitOptions = { ...this.config.customOptions, ...customOptions };
    await this.page.waitForSelector(selector, {
      visible: waitOptions.visible,
    });
    const element = (await this.page.$$(selector))[waitOptions.number];
    console.log(
      JSON.stringify(
        {
          ...waitOptions,
          handlerName: `${await element.evaluate((e) => e.innerText || "Component")}`,
        },
        null,
        2,
      ),
      `successfully loaded...`,
    );
    return element;
  }

  async go() {
    await this.page.goto(this.config.baseUrl, this.config.goOptions);
  }

  async position(selector, customOptions) {
    const element = await this.wait(selector, customOptions);
    const { x, y, width, height } = await element.boundingBox();
    return {
      x: x + width / 2,
      y: y + height / 2,
      width,
      height,
    };
  }

  async click(selector, options, customOptions) {
    const element = await this.wait(selector, customOptions);
    await element.click({ ...this.config.clickOptions, options });
    return element;
  }

  async mouseClick(selector, options, customOptions) {
    await this.wait(selector, customOptions);
    const { x, y } = await this.position(selector, customOptions);
    await this.page.mouse.click(
      x,
      y,
      Object.assign({}, this.config.clickOptions, options),
    );
  }

  async navigateDropdown(number /* type: positive integer */) {
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
