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
    console.log(
      `${await (await this.page.waitForSelector(selector)).evaluate((e) => e.innerText || "Component")} successfully loaded...`,
    );
  }

  async go() {
    await Promise.all([
      this.page.goto(this.config.baseUrl, this.config.gotoOptions),
      this.timeout(1),
    ]);
  }

  async click(selector) {
    await this.wait(selector);
    await this.page.click(selector, this.config.clickOptions);
  }
}
