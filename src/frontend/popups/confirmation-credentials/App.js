import React from "react";
import { MemoryRouter } from "react-router-dom";
import HoloLogo from "../../components/atoms/HoloLogo";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <>
      <div style={{ margin: "5px" }}>
        <HoloLogo />
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </div>
    </>
  );
}

export default App;
