import React from "react";
import { MemoryRouter } from "react-router-dom";
import HoloLogo from "../../img/Holo-Logo.png";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <>
      <div style={{ margin: "5px" }}>
        <img src={HoloLogo} style={{ height: "25px" }} />
        <div style={{ margin: "10px" }}></div>
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </div>
    </>
  );
}

export default App;
