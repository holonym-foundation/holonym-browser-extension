import { CryptoController } from "./CryptoController";

window.onload = function () {
  const cryptoController = new CryptoController();

  const registerFormEl = document.getElementById("register-form");
  registerFormEl.onsubmit = async (event) => {
    event.preventDefault();
    const password = event.target.password.value;
    const loginSuccess = await cryptoController.login(password);
    console.log(`loginSuccess: ${loginSuccess}`);
    registerFormEl.password.value = "";
  };

  const changePwFormEl = document.getElementById("change-password-form");
  changePwFormEl.onsubmit = async (event) => {
    event.preventDefault();
    const oldPassword = event.target["old-password"].value;
    const newPassword = event.target["new-password"].value;
    const changePwSuccess = await cryptoController.changePassword(
      oldPassword,
      newPassword
    );
    console.log(`changePwSuccess: ${changePwSuccess}`);
    changePwFormEl["old-password"].value = "";
    changePwFormEl["new-password"].value = "";
  };
};
