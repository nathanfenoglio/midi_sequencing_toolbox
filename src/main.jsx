import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainMidiProvider } from "./context/MainMidiContext.jsx";
import { ToolboxSessionsProvider } from "./context/ToolboxSessionsContext.jsx";
import App from "./App.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { WolframPage } from "./pages/WolframPage.jsx";
import { UpdownPage } from "./pages/UpdownPage.jsx";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <MainMidiProvider> {/* context for home page */} 
      <ToolboxSessionsProvider> {/* context for wolfram and updown pages */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="wolfram" element={<WolframPage />} />
            <Route path="updown" element={<UpdownPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToolboxSessionsProvider>
    </MainMidiProvider>
  </StrictMode>
);
