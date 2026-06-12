import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useMainMidi } from "./context/MainMidiContext.jsx";
import "./App.css";

export default function App() {
  const location = useLocation();
  const { stopAllMidi } = useMainMidi();

  // stop midi send if user navigates away from Home page
  useEffect(() => {
    if (location.pathname !== "/") {
      stopAllMidi();
    }
  }, [location.pathname, stopAllMidi]);

  // global button animation when clicked
  useEffect(() => {
    const handleClick = (e) => {
      // cool how you can just use .closest to take care of all buttons in app
      const btn = e.target.closest("button");
      if (!btn) return;
      btn.classList.remove("btn-pop");
      // force reflow so the animation restarts on rapid repeated clicks
      void btn.offsetWidth;
      btn.classList.add("btn-pop");
    };
    const handleAnimEnd = (e) => {
      if (e.animationName === "btnPop") {
        e.target.classList.remove("btn-pop");
      }
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("animationend", handleAnimEnd);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("animationend", handleAnimEnd);
    };
  }, []);

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
        <NavLink to="/take2" className="toolbox-nav-link">
          Take 2
        </NavLink>
        <NavLink to="/rhythm-compositions" className="toolbox-nav-link">
          Rhythm Compositions
        </NavLink>
        <NavLink to="/morse" className="toolbox-nav-link">
          Morse
        </NavLink>
        <NavLink to="/tutorial" className="toolbox-nav-link">
          Tutorial
        </NavLink>
      </nav>
      {/* when user clicks page link react router finds associated NavLink and injects it here at Outlet */}
      <Outlet />
    </div>
  );
}
