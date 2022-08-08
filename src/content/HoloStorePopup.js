class HoloStorePopup {
  constructor() {
    this.createElement();
    document.body.append(this.element);
    this.element.style.visibility = "hidden";
    this.creds = {
      unencryptedCreds: {},
      encryptedCreds: "",
    };
  }
  createElement() {
    this.element = document.createElement("div");
    this.element.setAttribute("id", "holo-store-popup");

    this.container = document.createElement("div");
    this.container.setAttribute("id", "holo-store-container");
    this.popupElement = this.createPopupParentDiv();
    this.container.append(this.popupElement);
    this.element.append(this.container);
  }

  setCreds(creds) {
    this.creds = creds;
    this.credsPara.replaceChildren();
    if (creds) {
      const credsEl = this.createCredsElement(creds.unencryptedCreds);
      this.credsPara.appendChild(credsEl);
    }
  }

  /**
   * Helper function for formatting creds object for display. For each
   * key-value pair in creds, a <p> element is created. All <p> elements
   * are appended to a single div.
   * @param {object} creds
   */
  createCredsElement(creds) {
    const parentDiv = document.createElement("div");
    for (const key of Object.keys(creds)) {
      const para = document.createElement("p");
      para.textContent = key + ": " + creds[key];
      parentDiv.appendChild(para);
    }
    return parentDiv;
  }

  open() {
    return new Promise((resolve, reject) => {
      this.closePopup = false;
      this.element.style.visibility = "visible";
      const anim = this.element.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.75 }, { opacity: 1 }],
        { duration: 200, easing: "ease-in-out" }
      );
      anim.addEventListener("finish", () => {
        this.element.style.pointerEvents = "auto";
        resolve();
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.closePopup = true;
      this.element.style.pointerEvents = "none";
      const anim = this.element.animate(
        [{ opacity: 1 }, { opacity: 0, offset: 0.75 }, { opacity: 0 }],
        { duration: 200, easing: "ease-in-out" }
      );
      anim.addEventListener("finish", () => {
        if (this.closePopup) {
          this.element.style.visibility = "hidden";
        }
        resolve();
      });
    });
  }

  createPopupParentDiv() {
    const parentDiv = document.createElement("div");
    parentDiv.style.position = "fixed";
    parentDiv.style.display = "block";
    parentDiv.style.top = "0px";
    parentDiv.style.right = "0%";
    parentDiv.style.zIndex = 99999;
    parentDiv.style.backgroundColor = "#0e2433";
    parentDiv.style.color = "#ffffff";
    parentDiv.style.padding = "10px";
    parentDiv.style.borderRadius = "5px";
    parentDiv.style.maxWidth = "350px"; // TODO: Adjust according to screen size
    parentDiv.style.overflowWrap = "break-word";

    const titleElement = document.createElement("h3");
    titleElement.textContent = "The following credentials will be stored";
    titleElement.style.fontSize = "20px";
    parentDiv.appendChild(titleElement);

    this.credsPara = document.createElement("p");
    // this.credsPara.textContent = "{credential1: credential1, credential2: credential2}";
    this.credsPara.textContent = JSON.stringify(this.creds?.unencryptedCreds);
    this.credsPara.style.right = window.innerWidth;
    this.credsPara.style.fontSize = "14px";
    parentDiv.appendChild(this.credsPara);

    this.buttonsDiv = document.createElement("div");
    this.buttonsDiv.style.display = "flex";
    parentDiv.appendChild(this.buttonsDiv);

    this.closeBtn = document.createElement("button");
    this.closeBtn.textContent = "Close";
    this.closeBtn.style.float = "left";
    this.closeBtn.style.color = "#ffffff";
    this.closeBtn.style.backgroundColor = "#000000";
    parentDiv.appendChild(this.closeBtn);

    this.confirmBtn = document.createElement("button");
    this.confirmBtn.textContent = "Confirm";
    this.confirmBtn.style.float = "right";
    this.confirmBtn.style.color = "#000000";
    this.confirmBtn.style.backgroundColor = "#ffffff";
    parentDiv.appendChild(this.confirmBtn);

    return parentDiv;
  }

  get isOpen() {
    return this.element.style.visibility !== "hidden";
  }
  get isLoading() {
    return this.element.classList.contains("loading");
  }
}

export default HoloStorePopup;
