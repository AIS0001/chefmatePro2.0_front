// hooks/useAutoLogout.js
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout, isTokenExpired } from "../utility/auth";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
const SESSION_LIMIT = 3 * 60 * 60 * 1000; // 3 hours

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/superadmin-login", "/logout", "/accessdenied", "/customer-display", "/sale-customer-display", "/public", "/boarding-pass", "/vending-machine", "/kiosk"];

export default function useAutoLogout() {
  const navigate = useNavigate();
  const location = useLocation();
  const activityTimeoutRef = useRef(null);
  const sessionTimeoutRef = useRef(null);

  // Check if current route is a public route
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

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
    // Skip auto-logout checks on public routes
    if (isPublicRoute) {
      return;
    }

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
    // Skip inactivity check on public routes
    if (isPublicRoute) {
      return;
    }

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

    // Only setup activity listeners on protected routes
    if (!isPublicRoute) {
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
    }

    return () => clearTimers();
  }, [navigate, location.pathname]);
}
