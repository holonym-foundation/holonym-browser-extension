/**
 * This file contains the script for activating HoloHoverCard.
 *
 * This is the hover-over-Twitter-handle-and-see-holo part of
 * the extension.
 */
/**
 * Hat tip to the following projects for implementation inspiration.
 * Ticksy: https://chrome.google.com/webstore/detail/ticksy/ampcecklneicdcibnhahchimnmhdndlb
 * Stiqur: https://chrome.google.com/webstore/detail/stiqur/hoghhgffedpllikjpoaknoaaapagkpcf?hl=en
 */

import HoloHoverCard from "./HoloHoverCard";

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
    mumbai: {
      name: "",
      bio: "",
      twitter: "NanakNihal",
      discord: "nnsk#4182",
      github: "nanaknihal",
      orcid: "0000-0002-2308-9517",
    },
    address: "0xc8834c1fcf0df6623fc8c8ed25064a4148d99388",
  },
};
let handleToHeight = {}; // height == height of twitter user hover card (not holo hover card)
let handleToWidth = {}; // width == width of twitter user hover card (not holo hover card)
let latestHandle = null;
let nextAllowedUpdate = null;
let showingAddr = false;
let movedOffAddr = null;
let allowedToHideAddr = null;

const hoverCard = new HoloHoverCard();
const OPEN_DELAY = 625;
const CLOSE_DELAY = 325;

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
    hoverCard.positionAroundElement(
      targetElement,
      handleToWidth[handle],
      handleToHeight[handle]
    );
    hoverCard.open();
    resolve();
  });
}

/**
 * Utility function.
 */
async function fetchWithTimeout(url) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 1000);
  const response = await fetch(url, { signal: abortController.signal });
  clearTimeout(timeoutId);
  return response;
}

async function setAddress(handle) {
  if (handleToAddr[handle]) {
    return;
  }
  try {
    const url = `https://sciverse.id/api/addressForCredentials?credentials=${handle}&service=twitter`;
    const address = await (await fetchWithTimeout(url)).json();
    handleToAddr[handle] = address;
    const getHoloUrl = `https://sciverse.id/api/getHolo?address=${address}`;
    const holo = await (await fetchWithTimeout(getHoloUrl)).json();
    addressToHolo[address] = holo;
  } catch (error) {
    handleToAddr[handle] = "";
  }
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
      latestHandle = handle;

      const openId = setTimeout(() => {
        if (hoverCard.openId === openId) {
          const closeHoverCard = function () {
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
              target.removeEventListener("mouseleave", mouseOffBeforeLoad, {
                passive: true,
                once: true,
              });
              if (hoverCard.openId !== openId) {
                return;
              }
              target.addEventListener("mouseleave", closeHoverCard, {
                passive: true,
                once: true,
              });
              // hoverCard.positionAroundElement(target, handleToHeight[handle]);
            })
            .catch(() => {
              target.removeEventListener("mouseleave", mouseOffBeforeLoad, {
                passive: true,
                once: true,
              });
              target.addEventListener("mouseleave", closeHoverCard, {
                passive: true,
                once: true,
              });
            });
        }
      }, OPEN_DELAY);
      if (hoverCard.openId) {
        clearTimeout(hoverCard.openId);
      }
      hoverCard.openId = openId;

      const mouseOffBeforeLoad = function () {
        // console.log("mouseoff before load", openId, hoverCard.openId, handle, hoverCard.closeId);
        if (hoverCard.isLoading && hoverCard.closeId === null) {
          hoverCard.closeId = 1;
          hoverCard.close().then(() => {
            hoverCard.closeId = null;
          });
        }
        hoverCard.openId = null;
        clearTimeout(openId);
      };
      target.addEventListener("mouseleave", mouseOffBeforeLoad, {
        passive: true,
        once: true,
      });
    }
  },
  { passive: true }
);

// Listen for HTML nodes being added. The Twitter user hover card is inserted into the document
// when a user hovers over a Twitter handle. We use the position of this hover card when placing
// the Holo hover card.
let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    for (const node of mutation.addedNodes) {
      if (node.textContent.includes(latestHandle)) {
        try {
          const hcParentElement = document.getElementById("layers").childNodes[1];
          const hcElement = hcParentElement.childNodes[0].childNodes[0].childNodes[0];
          const rect = hcElement.getBoundingClientRect();
          const validHeight = rect.height > 200 && rect.height < 400;
          if (validHeight) {
            handleToHeight[latestHandle] = rect.height;
          }
          const validWidth = rect.width > 100 && rect.width < 350;
          if (validWidth) {
            handleToWidth[latestHandle] = rect.width;
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  });
});
observer.observe(document.body, { childList: true, subtree: true });
