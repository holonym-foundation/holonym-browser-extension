import React from "react";
import ReactTooltip from "react-tooltip";

function InfoIcon({ tooltipMessage, afterTooltipShow, afterTooltipHide }) {
  return (
    <div style={{ display: "inline-block" }}>
      <div className="info-img w-embed" data-tip={tooltipMessage}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <path
            d="M9.375 9.375H10V13.75H10.625"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <path
            d="M10.2812 6.5625C10.2812 6.80412 10.0854 7 9.84375 7C9.60213 7 9.40625 6.80412 9.40625 6.5625C9.40625 6.32088 9.60213 6.125 9.84375 6.125C10.0854 6.125 10.2812 6.32088 10.2812 6.5625Z"
            fill="currentColor"
            stroke="currentColor"
          ></path>
        </svg>
      </div>
      <ReactTooltip
        place="bottom"
        afterShow={afterTooltipShow}
        afterHide={afterTooltipHide}
        className="toolip-base"
      />
    </div>
  );
}

export default InfoIcon;
