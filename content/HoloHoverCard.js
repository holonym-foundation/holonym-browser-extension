class HoloHoverCard {
  constructor() {
    this.createElement();
    document.body.append(this.element);
    this.element.style.visibility = "hidden";
    this.holo = {};
  }
  setHolo(holo) {
    this.holo = holo;
    if (this.holo?.address) {
      this.holoNameHeader.textContent = this.holo?.gnosis?.name || "";
      this.bioP.textContent = this.holo?.gnosis?.bio || "";
      this.innerAddressDiv.textContent = this.holo?.address || "";
      this.innerTwitterDiv.textContent = this.holo?.gnosis?.twitter || "";
      this.innerGithubDiv.textContent = this.holo?.gnosis?.github || "";
      this.innerDiscordDiv.textContent = this.holo?.gnosis?.discord || "";
      this.innerOrcidDiv.textContent = this.holo?.gnosis?.orcid || "";
    } else {
      this.holoNameHeader.textContent = "No Holo to display";
      this.bioP.textContent = "";
      this.innerAddressDiv.textContent = "";
      this.innerTwitterDiv.textContent = "";
      this.innerGithubDiv.textContent = "";
      this.innerDiscordDiv.textContent = "";
      this.innerOrcidDiv.textContent = "";
    }
    this.element.classList.add("visible");
  }
  createElement() {
    this.element = document.createElement("div");
    this.element.setAttribute("id", "hover-card");

    this.holoContainer = document.createElement("div");
    this.holoContainer.setAttribute("id", "holo-container");
    this.holoElement = this.getHoloHtml();
    this.holoContainer.append(this.holoElement);
    this.element.append(this.holoContainer);
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

  /**
   *
   * @param {*} element The element relative to which the hover card will be placed.
   * @param {*} spacing The spacing (in px) between element and hover card and between hover card and page border.
   */
  positionAroundElement(element, spacing = 20) {
    let isUserName = false;
    const uNameDiv = document.querySelector("[data-testid=UserName]");
    if (uNameDiv && uNameDiv.contains(element)) {
      isUserName = true;
    }
    let isAccountSwitcherButton = false;
    const accountSwitcherButtonDiv = document.querySelector("[data-testid=SideNav_AccountSwitcher_Button]");
    if (accountSwitcherButtonDiv && accountSwitcherButtonDiv.contains(element)) {
      isAccountSwitcherButton = true;
    }

    const twitterHoverCardHeight = 250;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const popup = this.element;

    const elDimensions = element.getBoundingClientRect();

    const elementMiddle = elDimensions.left + elDimensions.width / 2;

    let popupLeft = elementMiddle - popup.offsetWidth / 2;

    this.element.style.left = popupLeft + "px";

    if (popupLeft < spacing) {
      this.element.style.left = spacing + "px";
    } else if (popupLeft + popup.offsetWidth > windowWidth - spacing) {
      this.element.style.left = windowWidth - popup.offsetWidth - spacing + "px";
    }

    let popupTop = elDimensions.top - popup.offsetHeight - spacing + 10; // Default to placing hover card above element
    if (isAccountSwitcherButton) popupTop -= 20; // Default to placing hover card above element
    // const popupTop = elDimensions.top + spacing + 10; // Default to placing hover card below element
    this.element.style.top = popupTop + "px";

    // Default to placing hover card above element
    let placingBelow = false;
    const bottomHeightRemaining = windowHeight - elDimensions.top - elDimensions.height - popup.offsetHeight;
    const notEnoughRoomAboveElement =
      elDimensions.top - popup.offsetHeight - spacing < spacing || (popupTop < spacing && bottomHeightRemaining > popup.offsetHeight + popupTop);
    if (isUserName || notEnoughRoomAboveElement) {
      placingBelow = true;
      this.element.style.top = elDimensions.top + elDimensions.height + spacing + "px";
    }

    // Default to placing hover card below element
    // let placingBelow = true;
    // const notEnoughRoomBelowElement = popupTop + popup.offsetHeight + spacing > windowHeight;
    // if (notEnoughRoomBelowElement) {
    //   placingBelow = false;
    //   this.element.style.top = elDimensions.top - popup.offsetHeight - spacing + 10 + "px";
    //   if (isAccountSwitcherButton) {
    //     this.element.style.top = elDimensions.top - popup.offsetHeight - spacing - 10 + "px";
    //   }
    // }

    // Default to placing hover card below element
    // const notEnoughRoomBelowForTwitterHC = elDimensions.bottom + twitterHoverCardHeight > windowHeight;
    // if (placingBelow && notEnoughRoomBelowForTwitterHC) {
    //   popupLeft = elementMiddle - popup.offsetWidth / 2;
    //   this.element.style.left = popupLeft + "px";
    // }

    // Default to placing hover card above element
    const twitterHcIsAbove = elDimensions.bottom + twitterHoverCardHeight + spacing > windowHeight;
    if (!placingBelow && twitterHcIsAbove && !isUserName && !isAccountSwitcherButton) {
      popupLeft = elDimensions.left + 200;
      this.element.style.left = popupLeft + "px";
    }
  }
  getHoloHtml() {
    const parentDiv = document.createElement("div");
    parentDiv.classList.add("x-card");
    parentDiv.style.backgroundColor = "#0e2433";

    const nameBioPfpDiv = document.createElement("div");
    nameBioPfpDiv.classList.add("id-card");
    nameBioPfpDiv.classList.add("profile");
    parentDiv.appendChild(nameBioPfpDiv);

    // const pfpDiv = document.createElement('div')
    // pfpDiv.classList.add('id-card-1')
    // nameBioPfpDiv.appendChild(pfpDiv)

    // const pfp = document.createElement('img')

    const nameBioDiv = document.createElement("div");
    nameBioDiv.classList.add("id-card-2");
    nameBioPfpDiv.appendChild(nameBioDiv);

    const nameDiv = document.createElement("div");
    nameDiv.classList.add("id-profile-name-div");
    nameBioDiv.appendChild(nameDiv);

    this.holoNameHeader = document.createElement("h3");
    this.holoNameHeader.classList.add("h3");
    this.holoNameHeader.classList.add("no-margin");
    this.holoNameHeader.id = "w-node-_0efb49bf-473f-0fcd-ca4f-da5c9faeac9a-4077819e";
    this.holoNameHeader.textContent = this.holo?.gnosis?.name || "";
    nameDiv.appendChild(this.holoNameHeader);

    // const spacerDiv1 = document.createElement("div");
    // spacerDiv1.classList.add("spacer-xx-small");
    // nameBioDiv.appendChild(spacerDiv1);

    this.bioP = document.createElement("p");
    this.bioP.classList.add("id-designation");
    this.bioP.textContent = this.holo?.gnosis?.bio || "";
    nameBioDiv.appendChild(this.bioP);

    // const spacerDiv2 = document.createElement("div");
    // spacerDiv2.classList.add("spacer-small");
    // parentDiv.appendChild(spacerDiv2);

    // const spacerDiv3 = document.createElement("div");
    // spacerDiv3.classList.add("spacer-small");
    // parentDiv.appendChild(spacerDiv3);

    // address
    const addressLink = document.createElement("a");
    addressLink.style.textDecoration = "none";
    parentDiv.appendChild(addressLink);

    const outerAddressDiv = document.createElement("div");
    outerAddressDiv.classList.add("card-text-div");
    addressLink.appendChild(outerAddressDiv);

    this.innerAddressDiv = document.createElement("div");
    this.innerAddressDiv.classList.add("card-text");
    this.innerAddressDiv.textContent = this.holo?.gnosis?.twitter || "";
    outerAddressDiv.appendChild(this.innerAddressDiv);

    // twitter
    const twitterLink = document.createElement("a");
    twitterLink.style.textDecoration = "none";
    parentDiv.appendChild(twitterLink);

    const outerTwitterDiv = document.createElement("div");
    outerTwitterDiv.classList.add("card-text-div");
    twitterLink.appendChild(outerTwitterDiv);

    this.innerTwitterDiv = document.createElement("div");
    this.innerTwitterDiv.classList.add("card-text");
    this.innerTwitterDiv.textContent = this.holo?.gnosis?.twitter || "";
    outerTwitterDiv.appendChild(this.innerTwitterDiv);

    // github
    const githubLink = document.createElement("a");
    githubLink.style.textDecoration = "none";
    parentDiv.appendChild(githubLink);

    const outerGithubDiv = document.createElement("div");
    outerGithubDiv.classList.add("card-text-div");
    githubLink.appendChild(outerGithubDiv);

    this.innerGithubDiv = document.createElement("div");
    this.innerGithubDiv.classList.add("card-text");
    this.innerGithubDiv.textContent = this.holo?.gnosis?.github || "";
    outerGithubDiv.appendChild(this.innerGithubDiv);

    // discord
    const discordLink = document.createElement("a");
    discordLink.style.textDecoration = "none";
    parentDiv.appendChild(discordLink);

    const outerDiscordDiv = document.createElement("div");
    outerDiscordDiv.classList.add("card-text-div");
    discordLink.appendChild(outerDiscordDiv);

    this.innerDiscordDiv = document.createElement("div");
    this.innerDiscordDiv.classList.add("card-text");
    this.innerDiscordDiv.textContent = this.holo?.gnosis?.discord || "";
    outerDiscordDiv.appendChild(this.innerDiscordDiv);

    // orcid
    const orcidLink = document.createElement("a");
    orcidLink.style.textDecoration = "none";
    parentDiv.appendChild(orcidLink);

    const outerOrcidDiv = document.createElement("div");
    outerOrcidDiv.classList.add("card-text-div");
    orcidLink.appendChild(outerOrcidDiv);

    this.innerOrcidDiv = document.createElement("div");
    this.innerOrcidDiv.classList.add("card-text");
    this.innerOrcidDiv.textContent = this.holo?.gnosis?.orcid || "";
    outerOrcidDiv.appendChild(this.innerOrcidDiv);

    return parentDiv;
  }

  get isOpen() {
    return this.element.style.visibility !== "hidden";
  }
  get isLoading() {
    return this.element.classList.contains("loading");
  }
}
