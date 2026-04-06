/* eslint-disable no-undef */
import React from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCashRegister,
  FaChartBar,
  FaClock,
  FaReceipt,
  FaShieldAlt,
  FaSignOutAlt,
  FaStore,
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

  const stats = [
    {
      label: "Counter status",
      value: "Ready for sales",
      note: "All core actions are one tap away",
      icon: FaCashRegister,
      tone: "orange",
    },
    {
      label: "Reporting access",
      value: "Live summaries",
      note: "Review bill history without leaving the station",
      icon: FaReceipt,
      tone: "teal",
    },
    {
      label: "Session controls",
      value: "Secure logout",
      note: "End the shift cleanly whenever needed",
      icon: FaShieldAlt,
      tone: "slate",
    },
  ];

  const actionCards = [
    {
      title: "Point of Sale",
      kicker: "Fast lane",
      description: "Open the selling screen to process orders, capture payments, and print receipts with less visual clutter.",
      icon: FaCashRegister,
      accent: "orange",
      tags: ["Orders", "Payments", "Receipts"],
      buttonLabel: "Open POS",
      buttonTone: "orange",
      onClick: () => navigateToPage("/sale/pos"),
    },
    {
      title: "Sales Reports",
      kicker: "Performance",
      description: "Jump into bill history and daily activity with a calmer reporting surface and clearer hierarchy.",
      icon: FaChartBar,
      accent: "teal",
      tags: ["History", "Totals", "Analytics"],
      buttonLabel: "View Reports",
      buttonTone: "teal",
      onClick: () => navigateToPage("/reports/billhistory"),
    },
    {
      title: "Logout",
      kicker: "Account",
      description: "Close the current cashier session safely and return to the login screen when the shift is complete.",
      icon: FaSignOutAlt,
      accent: "rose",
      tags: ["Session", "Security", "Exit"],
      buttonLabel: "Logout",
      buttonTone: "rose",
      onClick: handleLogout,
    },
  ];

  return (
    <div className="cashier-dashboard">
      <ToastContainer position="top-right" theme="colored" />

      <div className="cashier-dashboard__shell">
        <section className="cashier-dashboard__hero">
          <div className="cashier-dashboard__hero-card">
            <span className="cashier-dashboard__eyebrow">
              <FaStore size={14} />
              Cashier workspace
            </span>

            <div className="cashier-dashboard__title-row">
              <div className="cashier-dashboard__brand-icon">
                <FaStore size={30} />
              </div>

              <div className="cashier-dashboard__hero-copy">
                <h1>ChefMatePro2 Cashier Dashboard</h1>
                <p>
                  A warmer, cleaner control surface for quick selling, report access,
                  and session management during active counter hours.
                </p>
              </div>
            </div>

            <div className="cashier-dashboard__hero-tags">
              <span>Balanced colors</span>
              <span>Clear action hierarchy</span>
              <span>Mobile friendly layout</span>
            </div>
          </div>

          <aside className="cashier-dashboard__status-card">
            <div>
              <span className="cashier-dashboard__status-label">Today at a glance</span>
              <h2>Counter ready</h2>
              <p>Keep the most common cashier tasks visible without a heavy, crowded dashboard treatment.</p>
            </div>

            <div className="cashier-dashboard__status-list">
              <div className="cashier-dashboard__status-item">
                <div>
                  <strong>Shift date</strong>
                  <span>Current business day</span>
                </div>
                <em>{todayLabel}</em>
              </div>

              <div className="cashier-dashboard__status-item">
                <div>
                  <strong>Response mode</strong>
                  <span>Designed for fast touch targets</span>
                </div>
                <em>Optimized</em>
              </div>

              <div className="cashier-dashboard__status-item">
                <div>
                  <strong>Release build</strong>
                  <span>Version information</span>
                </div>
                <em>v{appVersion || "Current"}</em>
              </div>
            </div>
          </aside>
        </section>

        <section className="cashier-dashboard__stats-grid" aria-label="Cashier dashboard highlights">
          {stats.map(({ icon: Icon, label, value, note, tone }) => (
            <article key={label} className="cashier-dashboard__stat">
              <div className={`cashier-dashboard__stat-icon cashier-dashboard__stat-icon--${tone}`}>
                <Icon size={22} />
              </div>

              <div>
                <span className="cashier-dashboard__stat-value">{value}</span>
                <span className="cashier-dashboard__stat-label">{label}</span>
                <span className="cashier-dashboard__stat-label">{note}</span>
              </div>
            </article>
          ))}
        </section>

        <section>
          <div className="cashier-dashboard__section-header">
            <div>
              <h3>Choose your next action</h3>
              <p>The visual hierarchy now pushes the primary cashier actions forward while keeping secondary context quieter.</p>
            </div>
            <span className="cashier-dashboard__section-note">
              <FaClock size={13} style={{ marginRight: 8 }} />
              Built for shift speed
            </span>
          </div>

          <div className="cashier-dashboard__actions-grid">
            {actionCards.map(({ title, kicker, description, icon: Icon, accent, tags, buttonLabel, buttonTone, onClick }) => (
              <article key={title} className={`cashier-dashboard__action-card cashier-dashboard__action-card--${accent}`}>
                <div className="cashier-dashboard__action-card-head">
                  <div className={`cashier-dashboard__action-icon`}>
                    <Icon size={28} />
                  </div>
                  <span className="cashier-dashboard__action-kicker">{kicker}</span>
                </div>

                <h4>{title}</h4>
                <p>{description}</p>

                <div className="cashier-dashboard__action-tags">
                  {tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

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

        <footer className="cashier-dashboard__footer">
          <div>
            <strong>ChefMate Pro2 POS System</strong>
            <span> | Cashier station interface</span>
            <span> | </span>
            <button
              type="button"
              className="cashier-dashboard__version-button"
              onClick={() => navigate('/changelog')}
              title="Open version changes"
            >
              v{appVersion || "Current"}
            </button>
          </div>

          <div className="cashier-dashboard__footer-date">{todayLabel}</div>
        </footer>
      </div>
    </div>
  );
}
