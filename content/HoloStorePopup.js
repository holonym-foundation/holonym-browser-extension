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
  }

  open() {
    return new Promise((resolve, reject) => {
      this.closePopup = false;
      this.element.style.visibility = "visible";
      const anim = this.element.animate([{ opacity: 0 }, { opacity: 1, offset: 0.75 }, { opacity: 1 }], { duration: 200, easing: "ease-in-out" });
      anim.addEventListener("finish", () => {
        this.element.style.pointerEvents = "auto";
        resolve();
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      console.log("entered close()");
      this.closePopup = true;
      this.element.style.pointerEvents = "none";
      const anim = this.element.animate([{ opacity: 1 }, { opacity: 0, offset: 0.75 }, { opacity: 0 }], { duration: 200, easing: "ease-in-out" });
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

    const titleElement = document.createElement("h2");
    titleElement.textContent = "Title";
    parentDiv.appendChild(titleElement);

    const credsPara = document.createElement("p");
    credsPara.textContent = "{credential1: credential1, credential2: credential2}";
    credsPara.style.right = window.innerWidth;
    parentDiv.appendChild(credsPara);

    this.closeBtn = document.createElement("button");
    this.closeBtn.textContent = "Close";
    // this.closeBtn.onclick = this.close;
    parentDiv.appendChild(this.closeBtn);

    return parentDiv;
  }

  get isOpen() {
    return this.element.style.visibility !== "hidden";
  }
  get isLoading() {
    return this.element.classList.contains("loading");
  }
}
