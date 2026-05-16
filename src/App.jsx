import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useMainMidi } from "./context/MainMidiContext.jsx";
import "./App.css";

export default function App() {
  const location = useLocation();
  const { stopAllMidi } = useMainMidi();

  useEffect(() => {
    if (location.pathname !== "/") {
      stopAllMidi();
    }
  }, [location.pathname, stopAllMidi]);

  return (
    <div className="toolbox-root">
      <nav className="toolbox-nav" aria-label="Main navigation">
        <NavLink to="/" end className="toolbox-nav-link">
          Home
        </NavLink>
        <NavLink to="/wolfram" className="toolbox-nav-link">
          Wolfram CA
        </NavLink>
        <NavLink to="/updown" className="toolbox-nav-link">
          Up Down
        </NavLink>
        <NavLink to="/graph" className="toolbox-nav-link">
          Graph
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
