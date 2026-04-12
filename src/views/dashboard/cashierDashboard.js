/* eslint-disable no-undef */
import React from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCashRegister,
  FaChartBar,
  FaHeadset,
  FaSignOutAlt,
} from "react-icons/fa";
import appPackage from "../../../package.json";
import "./cashierDashboard.css";

export default function CashierDashboard() {
  const navigate = useNavigate();
  const appVersion = appPackage?.version || "";
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('uname');
    sessionStorage.removeItem('uname');

    toast.success("Logged out successfully!");

    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const navigateToPage = (path) => {
    navigate(path);
  };

  const actionCards = [
    {
      title: "Point of Sale",
      description: "Process orders and collect payments.",
      icon: FaCashRegister,
      accent: "orange",
      buttonLabel: "Open POS",
      buttonTone: "orange",
      onClick: () => navigateToPage("/sale/pos"),
    },
    {
      title: "Sales Reports",
      description: "Check bill history and daily totals.",
      icon: FaChartBar,
      accent: "teal",
      buttonLabel: "View Reports",
      buttonTone: "teal",
      onClick: () => navigateToPage("/reports/billhistory"),
    },
    {
      title: "Support Tickets",
      description: "Raise and track support requests.",
      icon: FaHeadset,
      accent: "slate",
      buttonLabel: "Open Support",
      buttonTone: "slate",
      onClick: () => navigateToPage("/support/tickets"),
    },
    {
      title: "Logout",
      description: "End this cashier session securely.",
      icon: FaSignOutAlt,
      accent: "rose",
      buttonLabel: "Logout",
      buttonTone: "rose",
      onClick: handleLogout,
    },
  ];

  return (
    <div className="cashier-dashboard">
      <ToastContainer position="top-right" theme="colored" />

      <div className="cashier-dashboard__shell">
        <header className="cashier-dashboard__header">
          <div>
            <h1>Cashier Dashboard</h1>
            <p>Only key actions are shown for faster billing flow.</p>
          </div>
          <div className="cashier-dashboard__meta">
            <span>{todayLabel}</span>
            <button
              type="button"
              className="cashier-dashboard__version-button"
              onClick={() => navigate('/changelog')}
              title="Open version changes"
            >
              v{appVersion || "Current"}
            </button>
          </div>
        </header>

        <section aria-label="Cashier actions">
          <div className="cashier-dashboard__section-header">
            <div>
              <h3>Quick actions</h3>
              <p>Tap a card to continue.</p>
            </div>
          </div>

          <div className="cashier-dashboard__actions-grid">
            {actionCards.map(({ title, description, icon: Icon, accent, buttonLabel, buttonTone, onClick }) => (
              <article key={title} className={`cashier-dashboard__action-card cashier-dashboard__action-card--${accent}`}>
                <div className="cashier-dashboard__action-card-head">
                  <div className="cashier-dashboard__action-icon">
                    <Icon size={28} />
                  </div>
                </div>

                <h4>{title}</h4>
                <p>{description}</p>

                <button
                  type="button"
                  className={`cashier-dashboard__button cashier-dashboard__button--${buttonTone}`}
                  onClick={onClick}
                >
                  {buttonLabel}
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
