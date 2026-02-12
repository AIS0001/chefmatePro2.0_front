import React from "react";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";

export default function TestLowStock() {
  return (
    <Layout>
      <Header title="Test Low Stock" />
      <div className="container">
        <h1>Test Component</h1>
        <p>This is a test component to check for toggle errors.</p>
      </div>
    </Layout>
  );
}
