import GenericPageModel from "./GenericPageModel.js";

export default class LoginPageModel extends GenericPageModel {
  constructor(page, config) {
    super(page, config);
  }

  async inputCredentials() {
    let credentials = this.config.credentials;
    for (const i in credentials) {
      await this.wait(`#${i}`, { ...this.config.customOptions });
      await this.page.type(`#${i}`, `${credentials[i]}`, { delay: 50 });
    }
  }

  async slideToUnlock() {
    const lablePos = await this.position("#lable");
    const sliderPos = await this.position("#slider");

    const initPosition = lablePos;

    const finalPosition = {
      x: initPosition.x + sliderPos.width,
      y: initPosition.y,
    };

    await Promise.race([
      this.page.mouse.drag(initPosition, finalPosition),
      this.timeout(0.1),
    ]);

    await this.page.mouse.up({ button: "left" }); // manual release mouse key after drag
  }
}
