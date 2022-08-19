import { Buffer } from "buffer/";
import { stateAbbreviations } from "./constants";

export function generateSecret(numBytes = 16) {
  return "0x" + randomBytes(numBytes).toString("hex");
}

export function toU32StringArray(bytes) {
  let u32s = chunk(bytes.toString("hex"), 8);
  return u32s.map((x) => parseInt(x, 16).toString());
}
export function chunk(arr, chunkSize) {
  let out = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    out.push(chunk);
  }
  return out;
}

export function getStateAsBytes(state) {
  if (!state) {
    return Buffer.concat([Buffer.from("")], 2);
  }
  state = stateAbbreviations[state.toUpperCase()];
  return Buffer.concat([Buffer.from(state || "")], 2);
}

/**
 * Convert date string to 3 bytes with the following structure:
 * byte 1: number of years since 1900
 * bytes 2-3: number of days since beginning of the year
 * @param {string} date Must be of form yyyy-mm-dd
 */
export function getDateAsBytes(date) {
  const [year, month, day] = date.split("-");
  const yearsSince1900 = parseInt(year) - 1900;
  const daysSinceNewYear = getDaysSinceNewYear(parseInt(month), parseInt(day));

  // Convert yearsSince1900 and daysSinceNewYear to bytes
  const yearsBuffer = Buffer.alloc(1, yearsSince1900);
  let daysBuffer;
  if (daysSinceNewYear > 255) {
    daysBuffer = Buffer.concat([
      Buffer.from([0x01]),
      Buffer.alloc(1, daysSinceNewYear - 256),
    ]);
  } else {
    daysBuffer = Buffer.alloc(1, daysSinceNewYear);
  }

  return Buffer.concat([yearsBuffer, daysBuffer], 3);
}

function getDaysSinceNewYear(month, day) {
  let daysSinceNewYear = day;
  if (month == 1) {
    return daysSinceNewYear;
  }
  if (month > 1) {
    daysSinceNewYear += 31;
  }
  if (month > 2) {
    if (isLeapYear(new Date().getYear())) {
      daysSinceNewYear += 29;
    } else {
      daysSinceNewYear += 28;
    }
  }
  if (month > 3) {
    daysSinceNewYear += 31;
  }
  if (month > 4) {
    daysSinceNewYear += 30;
  }
  if (month > 5) {
    daysSinceNewYear += 31;
  }
  if (month > 6) {
    daysSinceNewYear += 30;
  }
  if (month > 7) {
    daysSinceNewYear += 31;
  }
  if (month > 8) {
    daysSinceNewYear += 31;
  }
  if (month > 9) {
    daysSinceNewYear += 30;
  }
  if (month > 10) {
    daysSinceNewYear += 31;
  }
  if (month > 11) {
    daysSinceNewYear += 30;
  }
  return daysSinceNewYear;
}

function isLeapYear(year) {
  return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}
