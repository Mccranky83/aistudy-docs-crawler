import GeneralPageModel from "./GeneralPageModel.js";

export default class LoginPageModel extends GeneralPageModel {
  constructor(page, config) {
    super(page, config);
  }

  async inputCredentials() {
    let credentials = this.config.credentials;
    for (const i in credentials) {
      await this.wait(`#${i}`);
      await this.page.type(`#${i}`, `${credentials[i]}`, { delay: 50 });
    }
  }

  async slideToUnlock() {
    await this.wait("#lable");
    const lable = await this.page.$("#lable");
    const box = await lable.boundingBox();

    await this.wait("#slider");
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
      this.timeout(),
    ]);

    await this.page.mouse.up({ button: "left" }); // manual release mouse key after drag
  }
}
