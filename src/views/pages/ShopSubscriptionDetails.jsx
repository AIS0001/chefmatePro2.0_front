import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getHeaders } from '../../utility/auth';
import './ShopSubscriptionDetails.css';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const normalizeStatus = (status, endDate) => {
  const normalized = String(status || '').trim().toUpperCase();
  if (normalized) return normalized;
  if (!endDate) return 'N/A';
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed >= new Date() ? 'ACTIVE' : 'EXPIRED';
};

const toAmount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const buildFallbackOverview = (profile) => {
  const planName = profile?.plan_name || 'Not Assigned';
  const startDate = profile?.subscription_start_date || null;
  const endDate = profile?.subscription_end_date || null;
  const status = normalizeStatus(profile?.subscription_status, endDate);

  return {
    shop_id: profile?.id || profile?.shop_id || null,
    subscription: {
      plan_name: planName,
      price_per_month: profile?.price_per_month || 0,
      price_per_year: profile?.price_per_month ? Number(profile.price_per_month) * 12 : 0,
      subscription_type: profile?.subscription_type || 'MONTHLY',
      start_date: startDate,
      end_date: endDate,
      renewal_date: profile?.renewal_date || endDate,
      subscription_status: status,
    },
    payment_summary: {
      total_paid_amount: 0,
      paid_count: 0,
      total_unpaid_amount: 0,
      unpaid_count: 0,
      overdue_amount: 0,
    },
    next_due_payment: endDate
      ? {
          amount: profile?.price_per_month || 0,
          payment_status: status === 'ACTIVE' ? 'PENDING' : 'OVERDUE',
          due_date: endDate,
          payment_method: '-',
          payment_type: profile?.subscription_type || 'MONTHLY',
          reference_number: '-',
        }
      : null,
    payment_history: [],
  };
};

const ShopSubscriptionDetails = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      setLoading(true);
      setError('');

      try {
        const headerConfig = getHeaders();
        const response = await axios.get('/shop/subscription/overview', {
          ...headerConfig,
          params: {
            ...(headerConfig?.params || {}),
            limit: 50,
          },
        });

        const responseData = response?.data?.data || null;
        if (responseData) {
          setOverview(responseData);
          return;
        }

        const profileResponse = await axios.get('/shop/profile', getHeaders());
        const profileData = profileResponse?.data?.data || null;
        setOverview(buildFallbackOverview(profileData));
      } catch (err) {
        try {
          const profileResponse = await axios.get('/shop/profile', getHeaders());
          const profileData = profileResponse?.data?.data || null;
          if (profileData) {
            setOverview(buildFallbackOverview(profileData));
            return;
          }
        } catch (profileErr) {
          // Fallback exhausted.
        }

        const message = err?.response?.data?.error || 'Unable to load subscription details.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, []);

  const subscription = overview?.subscription || {};
  const summary = useMemo(() => overview?.payment_summary || {}, [overview]);
  const pendingAmount = toAmount(summary.total_unpaid_amount) + toAmount(summary.overdue_amount);
  const nextDue = overview?.next_due_payment;
  const paymentHistory = overview?.payment_history || [];

  return (
    <div className="shop-subscription-page">
      <div className="shop-subscription-header">
        <h2>Shop Subscription Details</h2>
        <p>
          Shop ID: <strong>{overview?.shop_id || '-'}</strong>
        </p>
      </div>

      {loading && (
        <div className="shop-subscription-card text-center py-5">
          <div className="shop-subscription-spinner" />
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
              <div className="shop-subscription-card stat-card paid">
                <p className="label">Active Plan</p>
                <h3>{subscription?.plan_name || 'Not Assigned'}</h3>
                <small>Status: {subscription?.subscription_status || 'N/A'}</small>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 mb-3">
              <div className="shop-subscription-card stat-card due">
                <p className="label">Next Due Date</p>
                <h3>{formatDate(nextDue?.due_date || subscription?.renewal_date || subscription?.end_date)}</h3>
                <small>{nextDue?.payment_status || 'N/A'}</small>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 mb-3">
              <div className="shop-subscription-card stat-card paid">
                <p className="label">Total Paid</p>
                <h3>{formatCurrency(summary.total_paid_amount)}</h3>
                <small>{summary.paid_count || 0} payments</small>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 mb-3">
              <div className="shop-subscription-card stat-card overdue">
                <p className="label">Pending / Overdue</p>
                <h3>{formatCurrency(pendingAmount)}</h3>
                <small>Unpaid: {summary.unpaid_count || 0}</small>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6 mb-3">
              <div className="shop-subscription-card detail-panel">
                <h5 className="mb-3">Subscription Information</h5>
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
                    <span className="detail-label">Monthly Fee</span>
                    <span className="detail-value">{formatCurrency(subscription?.price_per_month)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 mb-3">
              <div className="shop-subscription-card detail-panel">
                <h5 className="mb-3">Next Subscription Payment</h5>
                {nextDue ? (
                  <div className="detail-grid">
                    <div>
                      <span className="detail-label">Amount</span>
                      <span className="detail-value">{formatCurrency(nextDue.amount)}</span>
                    </div>
                    <div>
                      <span className="detail-label">Due Date</span>
                      <span className="detail-value">{formatDate(nextDue.due_date)}</span>
                    </div>
                    <div>
                      <span className="detail-label">Status</span>
                      <span className="detail-value">{nextDue.payment_status || '-'}</span>
                    </div>
                    <div>
                      <span className="detail-label">Payment Type</span>
                      <span className="detail-value">{nextDue.payment_type || '-'}</span>
                    </div>
                    <div>
                      <span className="detail-label">Method</span>
                      <span className="detail-value">{nextDue.payment_method || '-'}</span>
                    </div>
                    <div>
                      <span className="detail-label">Reference</span>
                      <span className="detail-value">{nextDue.reference_number || '-'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mb-0">No due payment found for this shop.</p>
                )}
              </div>
            </div>
          </div>

          <div className="shop-subscription-card detail-panel mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">Payment History</h5>
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
                      <td colSpan={7} className="text-center py-3">No payment history available.</td>
                    </tr>
                  )}

                  {paymentHistory.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>{index + 1}</td>
                      <td>{formatDate(row.due_date)}</td>
                      <td>{formatDate(row.paid_date)}</td>
                      <td>{formatCurrency(row.amount)}</td>
                      <td>
                        <span className={`status-chip ${String(row.payment_status || '').toLowerCase()}`}>
                          {row.payment_status || '-'}
                        </span>
                      </td>
                      <td>{row.payment_method || '-'}</td>
                      <td>{row.reference_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopSubscriptionDetails;