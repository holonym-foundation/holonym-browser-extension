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
      this.closeHoverCard = false;
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
      this.closeHoverCard = true;
      this.element.style.pointerEvents = "none";
      const anim = this.element.animate([{ opacity: 1 }, { opacity: 0, offset: 0.75 }, { opacity: 0 }], { duration: 200, easing: "ease-in-out" });
      anim.addEventListener("finish", () => {
        if (this.closeHoverCard) {
          this.element.style.visibility = "hidden";
        }
        resolve();
      });
    });
  }

  /**
   * @param targetElement The element relative to which the hover card will be placed.
   * @param twitterHoverCardWidth The width of the card that Twitter displays when you hover over a handle.
   * @param twitterHoverCardHeight The height of the card that Twitter displays when you hover over a handle.
   * @param spacing The spacing (in px) between element and hover card and between hover card and page border.
   */
  positionAroundElement(targetElement, twitterHoverCardWidth = 300, twitterHoverCardHeight = 265, spacing = 20) {
    console.log(`twitterHoverCardWidth: ${twitterHoverCardWidth}`);
    console.log(`twitterHoverCardHeight: ${twitterHoverCardHeight}`);

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    console.log(`windowHeight: ${windowHeight}`);
    const hc = this.element; // holo hover card
    const elDimensions = targetElement.getBoundingClientRect();

    // Establish conditions
    let isUserName = false;
    const uNameDiv = document.querySelector("[data-testid=UserName]");
    if (uNameDiv && uNameDiv.contains(targetElement)) {
      isUserName = true;
    }
    let isAccountSwitcherButton = false;
    const accountSwitcherButtonDiv = document.querySelector("[data-testid=SideNav_AccountSwitcher_Button]");
    if (accountSwitcherButtonDiv && accountSwitcherButtonDiv.contains(targetElement)) {
      isAccountSwitcherButton = true;
    }
    const twitterHCPotentialBottom = elDimensions.bottom + twitterHoverCardHeight + 20;
    const twitterHCIsBelow = twitterHCPotentialBottom < windowHeight - 6;
    const holoHCCanBeAbove = elDimensions.top - hc.offsetHeight - spacing > 0;
    const holoHCCanBeBelow = elDimensions.bottom + hc.offsetHeight + spacing < windowHeight;

    console.log(`elDimensions.bottom + twitterHoverCardHeight + 20: ${twitterHCPotentialBottom}`);
    console.log(`twitterHCIsBelow: ${twitterHCIsBelow}`);
    console.log(`holoHCCanBeAbove: ${holoHCCanBeAbove}`);
    console.log(`holoHCCanBeBelow: ${holoHCCanBeBelow}`);

    // Special cases
    if (isAccountSwitcherButton) {
      console.log("isAccountSwitcherButton");
      this.positionAboveAndCentered(targetElement, twitterHoverCardWidth, twitterHoverCardHeight, spacing, isAccountSwitcherButton);
    } else if (isUserName) {
      console.log("isUserName");
      this.positionBelowAndCentered(targetElement, twitterHoverCardWidth, twitterHoverCardHeight, spacing);
    }

    // Case 1. Above, centered.
    else if (twitterHCIsBelow && holoHCCanBeAbove) {
      console.log("above, centered");
      this.positionAboveAndCentered(targetElement, twitterHoverCardWidth, twitterHoverCardHeight, spacing);
    }
    // Case 2. Below, centered.
    else if (!twitterHCIsBelow && holoHCCanBeBelow) {
      console.log("below, centered");
      this.positionBelowAndCentered(targetElement, twitterHoverCardWidth, twitterHoverCardHeight, spacing);
    }
    // Case 3. Above, on the right.
    else if (!twitterHCIsBelow && !holoHCCanBeBelow) {
      console.log("above, on the right");
      this.positionAboveAndToRight(targetElement, twitterHoverCardWidth, twitterHoverCardHeight, spacing);
    }
    // Case 4. Below, on the right.
    else if (twitterHCIsBelow && !holoHCCanBeAbove) {
      console.log("below, on the right");
      this.positionBelowAndToRight(targetElement, twitterHoverCardWidth, twitterHoverCardHeight, spacing);
    }
    console.log(`hc height: ${hc.offsetHeight}`);
    console.log("----\n----");
  }

  /**
   * Position hover card above element and centered (relative to target element).
   */
  positionAboveAndCentered(targetElement, twitterHoverCardWidth = 300, twitterHoverCardHeight = 265, spacing = 20, isAccountSwitcherButton = false) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const hc = this.element; // holo hover card

    const elDimensions = targetElement.getBoundingClientRect();

    let hcTop = elDimensions.top - hc.offsetHeight - spacing + 10;
    if (isAccountSwitcherButton) hcTop -= 20;
    this.element.style.top = hcTop + "px";

    const elementMiddle = elDimensions.left + elDimensions.width / 2;
    let hcLeft = elementMiddle - hc.offsetWidth / 2;
    this.element.style.left = hcLeft + "px";

    // Shift left or right if hc is falling off either side of the page
    if (hcLeft < spacing) {
      this.element.style.left = spacing + "px";
    } else if (hcLeft + hc.offsetWidth > windowWidth - spacing) {
      this.element.style.left = windowWidth - hc.offsetWidth - spacing + "px";
    }
  }

  /**
   * Position hover card above element and to the right (relative to target element).
   */
  positionAboveAndToRight(targetElement, twitterHoverCardWidth = 300, twitterHoverCardHeight = 265, spacing = 20) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const hc = this.element; // holo hover card

    const elDimensions = targetElement.getBoundingClientRect();

    let hcTop = elDimensions.top - hc.offsetHeight - spacing + 10;
    this.element.style.top = hcTop + "px";

    const elementMiddle = elDimensions.left + elDimensions.width / 2;
    let hcLeft = elementMiddle + twitterHoverCardWidth / 2;
    this.element.style.left = hcLeft + "px";

    // Shift left or right if hc is falling off either side of the page
    if (hcLeft < spacing) {
      this.element.style.left = spacing + "px";
    } else if (hcLeft + hc.offsetWidth > windowWidth - spacing) {
      this.element.style.left = windowWidth - hc.offsetWidth - spacing + "px";
    }
  }

  /**
   * Position hover card below element and centered (relative to target element).
   */
  positionBelowAndCentered(targetElement, twitterHoverCardWidth = 300, twitterHoverCardHeight = 265, spacing = 20) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const hc = this.element; // holo hover card

    const elDimensions = targetElement.getBoundingClientRect();

    this.element.style.top = elDimensions.bottom + spacing + "px";

    const elementMiddle = elDimensions.left + elDimensions.width / 2;
    let hcLeft = elementMiddle - hc.offsetWidth / 2;
    this.element.style.left = hcLeft + "px";

    // Shift left or right if hc is falling off either side of the page
    if (hcLeft < spacing) {
      this.element.style.left = spacing + "px";
    } else if (hcLeft + hc.offsetWidth > windowWidth - spacing) {
      this.element.style.left = windowWidth - hc.offsetWidth - spacing + "px";
    }
  }

  /**
   * Position hover card below element and to the right (relative to target element).
   */
  positionBelowAndToRight(targetElement, twitterHoverCardWidth = 300, twitterHoverCardHeight = 265, spacing = 20) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const hc = this.element;

    const elDimensions = targetElement.getBoundingClientRect();

    this.element.style.top = elDimensions.bottom + spacing - 10 + "px";

    const elementMiddle = elDimensions.left + elDimensions.width / 2;
    const hcLeft = elementMiddle + twitterHoverCardWidth / 2;
    this.element.style.left = hcLeft + "px";

    // Shift left or right if hc is falling off either side of the page
    if (hcLeft < spacing) {
      this.element.style.left = spacing + "px";
    } else if (hcLeft + hc.offsetWidth > windowWidth - spacing) {
      this.element.style.left = windowWidth - hc.offsetWidth - spacing + "px";
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
