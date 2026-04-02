import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getHeaders } from '../../utility/auth';
import './Subscription.css';

const Subscription = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('/subscription/overview', {
          ...getHeaders(),
          params: { limit: 50 }
        });
        setOverview(response?.data?.data || null);
      } catch (err) {
        const message = err?.response?.data?.error || 'Unable to load subscription details.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const summary = useMemo(() => overview?.payment_summary || {}, [overview]);
  const nextDue = overview?.next_due_payment;
  const subscription = overview?.subscription;
  const paymentHistory = overview?.payment_history || [];

  return (
    <div className="subscription-page">
        <div className="subscription-header">
          <h2>Subscription & Payments</h2>
          <p>
            Shop ID: <strong>{overview?.shop_id || '-'}</strong>
          </p>
        </div>

        {loading && (
          <div className="subscription-card-panel text-center py-5">
            <div className="loading-spinner" />
            <p className="mt-3 mb-0">Loading subscription details...</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="row">
              <div className="col-lg-3 col-sm-6 mb-3">
                <div className="subscription-card-panel stat-card paid">
                  <p className="label">Total Paid Amount</p>
                  <h3>{formatCurrency(summary.total_paid_amount)}</h3>
                  <small>{summary.paid_count || 0} payments completed</small>
                </div>
              </div>
              <div className="col-lg-3 col-sm-6 mb-3">
                <div className="subscription-card-panel stat-card due">
                  <p className="label">Unpaid Due Amount</p>
                  <h3>{formatCurrency(summary.total_unpaid_amount)}</h3>
                  <small>{summary.unpaid_count || 0} pending records</small>
                </div>
              </div>
              <div className="col-lg-3 col-sm-6 mb-3">
                <div className="subscription-card-panel stat-card overdue">
                  <p className="label">Overdue Amount</p>
                  <h3>{formatCurrency(summary.overdue_amount)}</h3>
                  <small>Past due payments</small>
                </div>
              </div>
              <div className="col-lg-3 col-sm-6 mb-3">
                <div className="subscription-card-panel stat-card plan">
                  <p className="label">Current Plan</p>
                  <h3>{subscription?.plan_name || 'Not Assigned'}</h3>
                  <small>Status: {subscription?.subscription_status || 'N/A'}</small>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-6 mb-3">
                <div className="subscription-card-panel detail-panel">
                  <h5 className="mb-3">Subscription Details</h5>
                  <div className="detail-grid">
                    <div>
                      <span className="detail-label">Plan Name</span>
                      <span className="detail-value">{subscription?.plan_name || '-'}</span>
                    </div>
                    <div>
                      <span className="detail-label">Subscription Type</span>
                      <span className="detail-value">{subscription?.subscription_type || '-'}</span>
                    </div>
                    <div>
                      <span className="detail-label">Start Date</span>
                      <span className="detail-value">{formatDate(subscription?.start_date)}</span>
                    </div>
                    <div>
                      <span className="detail-label">End Date</span>
                      <span className="detail-value">{formatDate(subscription?.end_date)}</span>
                    </div>
                    <div>
                      <span className="detail-label">Renewal Date</span>
                      <span className="detail-value">{formatDate(subscription?.renewal_date)}</span>
                    </div>
                    <div>
                      <span className="detail-label">Monthly Price</span>
                      <span className="detail-value">{formatCurrency(subscription?.price_per_month)}</span>
                    </div>
                    <div>
                      <span className="detail-label">Yearly Price</span>
                      <span className="detail-value">{formatCurrency(subscription?.price_per_year)}</span>
                    </div>
                    <div>
                      <span className="detail-label">Status</span>
                      <span className="detail-value">{subscription?.subscription_status || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 mb-3">
                <div className="subscription-card-panel detail-panel">
                  <h5 className="mb-3">Next Due Payment</h5>
                  {nextDue ? (
                    <div className="detail-grid">
                      <div>
                        <span className="detail-label">Amount</span>
                        <span className="detail-value">{formatCurrency(nextDue.amount)}</span>
                      </div>
                      <div>
                        <span className="detail-label">Status</span>
                        <span className="detail-value">{nextDue.payment_status || '-'}</span>
                      </div>
                      <div>
                        <span className="detail-label">Due Date</span>
                        <span className="detail-value">{formatDate(nextDue.due_date)}</span>
                      </div>
                      <div>
                        <span className="detail-label">Payment Method</span>
                        <span className="detail-value">{nextDue.payment_method || '-'}</span>
                      </div>
                      <div>
                        <span className="detail-label">Payment Type</span>
                        <span className="detail-value">{nextDue.payment_type || '-'}</span>
                      </div>
                      <div>
                        <span className="detail-label">Reference Number</span>
                        <span className="detail-value">{nextDue.reference_number || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-0">No pending due payment found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="subscription-card-panel detail-panel mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Paid Amount History</h5>
                <small>Showing latest {paymentHistory.length} records</small>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-hover subscription-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Due Date</th>
                      <th>Paid Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Method</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-3">No payment records available.</td>
                      </tr>
                    )}

                    {paymentHistory.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td>{formatDate(item.due_date)}</td>
                        <td>{formatDate(item.paid_date)}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>
                          <span className={`status-chip ${String(item.payment_status || '').toLowerCase()}`}>
                            {item.payment_status || '-'}
                          </span>
                        </td>
                        <td>{item.payment_method || '-'}</td>
                        <td>{item.reference_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="small text-muted mb-0">
                  Unpaid due amount includes records with status `PENDING`, `FAILED`, or `CANCELLED`.
                </p>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

export default Subscription;
