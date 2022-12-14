export const extensionId = process.env.EXTENSION_ID;
export const extensionOrigin = `chrome-extension://${extensionId}`;
export const holoCommandEventName = "holo-command";
export const holoRespEventName = "holo-resp";
export const trustedOrigins = [
  "http://localhost:3002", // For local holonym.io tests
  "http://localhost:8081", // For local holonym.id tests
  "https://holonym.id",
  "https://app.holonym.id",
  "https://holonym.io",
  "https://app.holonym.io",
  "https://main.d2pqgbrq5pb6nr.amplifyapp.com",
];

export const basicWebPageCommands = [
  "holoGetIsInstalled",
  "getHoloPublicKey",
  "holoGetIsRegistered",
  "holoGetHasCredentials",
  // TODO: Add holoGetIsLoggedIn
];
export const privilegedWebPageCommands = [
  "getHoloCredentials",
  "setHoloCredentials",
  "holoAddLeafTxMetadata",
  "holoGetLeafTxMetadata",
  "holoAddSubmittedProof",
  "holoGetSubmittedProofs",
  "holoPromptSetPassword",
];

export const serverAddress = "0x8281316aC1D51c94f2DE77575301cEF615aDea84";

export const stateAbbreviations = {
  ALABAMA: "AL",
  ALASKA: "AK",
  "AMERICAN SAMOA": "AS",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  "DISTRICT OF COLUMBIA": "DC",
  "FEDERATED STATES OF MICRONESIA": "FM",
  FLORIDA: "FL",
  GEORGIA: "GA",
  GUAM: "GU",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  "MARSHALL ISLANDS": "MH",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  "NORTHERN MARIANA ISLANDS": "MP",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PALAU: "PW",
  PENNSYLVANIA: "PA",
  "PUERTO RICO": "PR",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  "VIRGIN ISLANDS": "VI",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
};

// Max length of encrypt-able string using RSA-OAEP with SHA256 where
// modulusLength == 4096: 446 characters.
export const maxEncryptableLength = 446;

export const treeDepth = 14;
