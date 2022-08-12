import { CryptoController } from "./CryptoController";

window.onload = function () {
  const cryptoController = new CryptoController();

  const formEl = document.getElementById("register-form");
  formEl.onsubmit = async (event) => {
    event.preventDefault();
    const password = event.target.password.value;
    const loginSuccess = await cryptoController.login(password);
    console.log(`loginSuccess: ${loginSuccess}`);
    formEl.password.value = "";
  };
};
