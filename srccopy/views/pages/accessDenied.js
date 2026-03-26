import React from "react";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404 - Page Not Found / Access Denied</h1>
      <p style={styles.message}>
        Sorry, you do not have permission to view this page or it does not exist.
      </p>
      <Link to="/logout" style={styles.button}>
        Go to Login Page
      </Link>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: "50px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "36px",
    marginBottom: "20px",
    color: "#cc0000",
  },
  message: {
    fontSize: "18px",
    marginBottom: "30px",
  },
  button: {
    padding: "12px 24px",
    backgroundColor: "#007bff",
    color: "#fff",
    borderRadius: "4px",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
