import GenericPageModel from "./GenericPageModel.js";

export default class LoginPageModel extends GenericPageModel {
  constructor(page, config) {
    super(page, config);
  }

  async inputCredentials() {
    let credentials = this.config.credentials;
    for (const i in credentials) {
      // Fire and forget
      new Promise((res, rej) => {
        this.page.on("dialog", (d) => {
          setTimeout(async () => {
            try {
              await d.accept("");
              res("\nUsing default credentials...\n");
            } catch (e) {
              rej("\nPrompt already closed...\n");
            }
          }, 3000);
        });
      })
        .then((e) => console.log(e))
        .catch((e) => console.error(e));
      /**
       * "" : default credentials
       * null: user cancelled
       */
      let input = await this.page.evaluate(
        (p) => window.prompt(p),
        `Enter ${i}:`,
      );
      if (input === null)
        throw new Error("\nUser cancelled the login process!");
      input === "" && (input = credentials[i]);
      await this.wait(`#${i}`, { ...this.config.customOptions });
      await this.page.type(`#${i}`, input, { delay: 50 });
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
