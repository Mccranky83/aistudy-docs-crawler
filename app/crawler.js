import login from "./login.js";

(async () => {
  const { browser, page } = await login();
})();
