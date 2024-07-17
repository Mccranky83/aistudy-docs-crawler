export default class {
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

  async go() {
    await Promise.all([
      this.page.goto(this.config.baseUrl, this.config.gotoOptions),
      this.timeout(),
    ]);
  }

  async click(selector) {
    await Promise.all([
      this.page.click(selector, this.config.clickOptions),
      this.timeout(),
    ]);
  }

  async inputCredentials() {
    let credentials = this.config.credentials;
    for (const i in credentials) {
      await this.page.type(`#${i}`, `${credentials[i]}`, { delay: 50 });
    }
  }

  async slideToUnlock() {
    const lable = await this.page.$("#lable");
    const box = await lable.boundingBox();

    const slider = await this.page.$("#slider");
    const slider_box = await slider.boundingBox();

    const initPosition = {
      x: box.x + box.width / 2,
      y: box.y,
    };
    const finalPosition = {
      x: initPosition.x + slider_box.width,
      y: initPosition.y,
    };

    await Promise.race([
      this.page.mouse.drag(initPosition, finalPosition),
      this.timeout(1),
    ]);

    await this.page.mouse.up({ button: "left" }); // manual release mouse key after drag
  }
}
