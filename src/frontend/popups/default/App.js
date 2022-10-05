import React from "react";
import { MemoryRouter } from "react-router-dom";
import HoloLogo from "../../components/atoms/HoloLogo";
import OuterContainer from "../../components/atoms/OuterContainer";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <>
      <div style={{ margin: "5px" }}>
        <OuterContainer>
          <HoloLogo />
          <MemoryRouter>
            <AppRoutes />
          </MemoryRouter>
        </OuterContainer>
      </div>
    </>
  );
}

export default App;
