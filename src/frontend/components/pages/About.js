import React from "react";
import { useNavigate } from "react-router-dom";

const links = [
  {
    text: "Holonym Website",
    destination: "https://holonym.id",
  },
  {
    text: "Documentation",
    // TODO: Update docs link destination when docs are officially published
    destination: "https://opsci.gitbook.io/untitled/4alwUHFeMIUzhQ8BnUBD/",
  },
  {
    text: "Privacy Policy",
    destination:
      "https://docs.google.com/document/d/1EYpyPBZ3SChmiZN0jtpmq5l2IGDUcfu0ijMsrMgJhMk/edit",
  },
  {
    text: "Support Channel",
    destination: "https://discord.com/channels/976235255793057872/1016368982850293811",
  },
];

function ExternalLink({ text, destination }) {
  return (
    <h5 className="p-1 white hover-animation">
      <a href={destination} target="_blank">
        {text}
      </a>
    </h5>
  );
}

function About() {
  const navigate = useNavigate();
  return (
    <>
      <div>
        <div style={{ textAlign: "center" }}>
          <h1>About</h1>
        </div>
        <div style={{ marginTop: "10px" }}>
          {links &&
            links.length > 0 &&
            links.map(({ text, destination }, index) => (
              <ExternalLink key={index} text={text} destination={destination} />
            ))}
          <button
            type="submit"
            onClick={() => navigate("/home", { replace: true })}
            className="x-button center-block"
            style={{ marginTop: "20px", marginBottom: "20px", width: "100%" }}
          >
            Return To Credentials
          </button>
        </div>
      </div>
    </>
  );
}

export default About;

/**
 * TODO:
 * - Socials
 */
