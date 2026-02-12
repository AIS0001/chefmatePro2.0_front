// hooks/useAutoLogout.js
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout, isTokenExpired } from "../utility/auth";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
const SESSION_LIMIT = 3 * 60 * 60 * 1000; // 3 hours

export default function useAutoLogout() {
  const navigate = useNavigate();
  const activityTimeoutRef = useRef(null);
  const sessionTimeoutRef = useRef(null);

  // Clears all timeouts
  const clearTimers = () => {
    clearTimeout(activityTimeoutRef.current);
    clearTimeout(sessionTimeoutRef.current);
  };

  // Logout and redirect
  const performLogout = () => {
    clearTimers();
    logout();
    navigate("/", { replace: true });
  };

  // Setup session expiration logout
  const setupSessionTimeout = () => {
    const expirationTime =
      Number(localStorage.getItem("expirationTime") || sessionStorage.getItem("expirationTime"));

    const now = new Date().getTime();
    const remainingTime = expirationTime - now;

    if (remainingTime <= 0 || isTokenExpired()) {
      performLogout();
    } else {
      sessionTimeoutRef.current = setTimeout(() => {
        performLogout();
      }, remainingTime);
    }
  };

  // Setup inactivity timeout
  const setupInactivityTimeout = () => {
    clearTimeout(activityTimeoutRef.current);
    activityTimeoutRef.current = setTimeout(() => {
      performLogout();
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    setupSessionTimeout();
    setupInactivityTimeout();

    const resetInactivityTimer = () => {
      setupInactivityTimeout();
    };

    // Activity events
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      clearTimers();
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [navigate]);
}
