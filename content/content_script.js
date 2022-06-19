/**
 * Hat tip to the following projects for implementation inspiration.
 * Ticksy: https://chrome.google.com/webstore/detail/ticksy/ampcecklneicdcibnhahchimnmhdndlb
 * Stiqur: https://chrome.google.com/webstore/detail/stiqur/hoghhgffedpllikjpoaknoaaapagkpcf?hl=en
 */

const handleToAddr = {
  hebbianloop: "0xd638f5c8d434ebf6ba3a2527ba76b08813b4598e",
  "0xCaleb": "0x2a3a52b3335699c4064f5e13907192de42d89575",
  NanakNihal: "0xc8834c1fcf0df6623fc8c8ed25064a4148d99388",
};
const addressToHolo = {
  "0xd638f5c8d434ebf6ba3a2527ba76b08813b4598e": {
    gnosis: {
      name: "hebbianloop.eth",
      bio: "🧠 cognitive neuroscientist 💚 OpSci founder 🚀 building tools for web-native science communities 🏗️ theorem.space",
      twitter: "hebbianloop",
      github: "seldamat",
      discord: "hebbianloop#5169",
      orcid: "0000-0002-2318-4477",
      google: "shady@opscientia.com",
    },
    mumbai: { name: "", bio: "", twitter: "", discord: "", github: "", orcid: "" },
    address: "0xd638f5c8d434ebf6ba3a2527ba76b08813b4598e",
  },
  "0x2a3a52b3335699c4064f5e13907192de42d89575": {
    gnosis: {
      name: "Caleb",
      bio: "Software developer at OpSci",
      twitter: "0xCaleb",
      github: "calebtuttle",
      discord: "",
      orcid: "0000-0002-8469-2221",
      google: "caleb@opscientia.com",
    },
    mumbai: { name: "", bio: "", twitter: "", discord: "", github: "", orcid: "" },
    address: "0x2a3a52b3335699c4064f5e13907192de42d89575",
  },
  "0xc8834c1fcf0df6623fc8c8ed25064a4148d99388": {
    gnosis: {
      name: "WTF Protocol 🆒🆒",
      bio: "The official account of the WTF Protocol",
      twitter: "NanakNihal",
      github: "nanaknihal",
      discord: "nnsk#4182",
      orcid: "0000-0002-2308-9517",
      google: "wtfprotocol@gmail.com",
    },
    mumbai: { name: "", bio: "", twitter: "NanakNihal", discord: "nnsk#4182", github: "nanaknihal", orcid: "0000-0002-2308-9517" },
    address: "0xc8834c1fcf0df6623fc8c8ed25064a4148d99388",
  },
};
let nextAllowedUpdate = null;
let showingAddr = false;
let movedOffAddr = null;
let allowedToHideAddr = null;

const hoverCard = new HoloHoverCard();
const OPEN_DELAY = 0; // 400;
const CLOSE_DELAY = 100; // 250;

hoverCard.element.addEventListener("mouseover", () => {
  if (hoverCard.closeId !== null) {
    clearTimeout(hoverCard.closeId);
    hoverCard.closeId = null;
  }
});

hoverCard.element.addEventListener("mouseleave", () => {
  if (hoverCard.closeId !== null) {
    clearTimeout(hoverCard.closeId);
    hoverCard.closeId = null;
  }

  const closeId = setTimeout(() => {
    if (hoverCard.closeId === closeId) {
      hoverCard.close();
      hoverCard.closeId = null;
    }
  }, CLOSE_DELAY);
  hoverCard.closeId = closeId;
});

function loadAndDisplayHolo(handle, targetElement, openId) {
  return new Promise((resolve) => {
    hoverCard.setHolo(addressToHolo[handleToAddr[handle]]);
    hoverCard.positionAroundElement(targetElement);
    hoverCard.open();
    resolve();
  });
}

async function setAddress(handle) {
  if (handleToAddr[handle]) {
    return;
  }
  const url = `https://sciverse.id/addressForCredentials?credentials=${handle}&service=twitter`;
  fetch(url)
    .then((resp) => resp.json())
    .then((address) => {
      if (address) {
        handleToAddr[handle] = address;
        console.log(`loaded user. handle: ${handle}. address: ${address}`);

        const getHoloUrl = `https://sciverse.id/api/getHolo?address=${address}`;
        fetch(getHoloUrl)
          .then((resp) => resp.json())
          .then((holo) => {
            if (holo) {
              addressToHolo[address] = holo;
              console.log(`loaded user holo. handle: ${handle}. address: ${address}`);
            }
          });
      } else {
        handleToAddr[handle] = "";
      }
    });
}

async function updateHolos() {
  if (nextAllowedUpdate && Date.now() < nextAllowedUpdate) {
    return;
  }
  nextAllowedUpdate = Date.now() + 1000;

  // Search entire page for handles
  //   const allElements = document.getElementsByTagName("*");
  //   for (const element of allElements) {
  //     if (element.childElementCount > 0) continue;
  //     let text = element.textContent
  //     while (text.includes('@')) {
  //         text = text.substring(text.indexOf('@') + 1)
  //         const potentialHandle = text.split(/[\W_]+/)[0]
  //         await setAddress(potentialHandle)
  //     }
  //   }

  for (const span of document.querySelectorAll("span")) {
    if (span.textContent.startsWith("@")) {
      const indexOfSpace = span.textContent.indexOf(" ");
      const handleEndIndex = indexOfSpace > 0 ? indexOfSpace : span.textContent.length;
      const handle = span.textContent.substring(1, handleEndIndex);
      await setAddress(handle);
    }
  }
  return;
}

document.addEventListener(
  "mouseover",
  (e) => {
    updateHolos();

    const target = e.target;
    const text = target.textContent;

    const isHandle = Object.keys(handleToAddr).includes(text.substring(1));

    if (isHandle) {
      const handle = text.substring(1);

      const openId = setTimeout(() => {
        if (hoverCard.openId === openId) {
          const closePopup = function () {
            if (hoverCard.closeId !== null) {
              clearTimeout(hoverCard.closeId);
            }
            const closeId = setTimeout(() => {
              if (hoverCard.closeId === closeId) {
                hoverCard.close();
                hoverCard.closeId = null;
              }
            }, CLOSE_DELAY);
            hoverCard.closeId = closeId;
          };

          loadAndDisplayHolo(handle, target, openId)
            .then(() => {
              target.removeEventListener("mouseleave", mouseOffBeforeLoad, { passive: true, once: true });
              if (hoverCard.openId !== openId) {
                return;
              }
              target.addEventListener("mouseleave", closePopup, { passive: true, once: true });
              hoverCard.positionAroundElement(target);
            })
            .catch(() => {
              target.removeEventListener("mouseleave", mouseOffBeforeLoad, { passive: true, once: true });
              target.addEventListener("mouseleave", closePopup, { passive: true, once: true });
            });
        }
      }, OPEN_DELAY);
      if (hoverCard.openId) {
        clearTimeout(hoverCard.openId);
      }
      hoverCard.openId = openId;

      const mouseOffBeforeLoad = function () {
        console.log("mouseoff before load", openId, hoverCard.openId, handle, hoverCard.loadedSymbol, hoverCard.closeId);
        if (hoverCard.isLoading && hoverCard.closeId === null) {
          hoverCard.closeId = 1;
          hoverCard.close().then(() => {
            hoverCard.closeId = null;
          });
        }
        hoverCard.openId = null;
        clearTimeout(openId);
      };
      target.addEventListener("mouseleave", mouseOffBeforeLoad, { passive: true, once: true });
    }
  },
  { passive: true }
);

// window.addEventListener("mousemove", (event) => {
//   console.log(`x: ${event.clientX}. y: ${event.clientY}`);
// });
