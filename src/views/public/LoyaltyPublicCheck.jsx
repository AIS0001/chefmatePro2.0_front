import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const labelStyle = { fontWeight: 700, marginRight: 6 };

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const offerTypeLabel = (type) => {
  if (type === 'DISCOUNT_AMOUNT') return 'Discount (Amount)';
  if (type === 'DISCOUNT_PERCENT') return 'Discount (%)';
  if (type === 'FREE_ITEM') return 'Free Item';
  return type || '-';
};

export default function LoyaltyPublicCheck() {
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get('member_id');
  const contact = searchParams.get('contact');
  const shopId = searchParams.get('shop_id');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shopId || (!memberId && !contact)) {
      setError('Invalid link. Please scan the QR code from your receipt.');
      setLoading(false);
      return;
    }
    const params = { shop_id: shopId };
    if (memberId) params.member_id = memberId;
    else params.contact = contact;

    axios
      .get('/loyalty/public/check', { params })
      .then((res) => {
        if (res.data.success) {
          setData(res.data);
        } else {
          setError(res.data.message || 'Member not found.');
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Could not load loyalty info. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, [memberId, contact, shopId]);

  const containerStyle = {
    maxWidth: 480,
    margin: '32px auto',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    padding: '0 16px',
  };

  const cardStyle = {
    background: '#fff',
    border: '1px solid #e8e8e8',
    borderRadius: 12,
    padding: '24px 20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: 20,
  };

  const badgeStyle = {
    display: 'inline-block',
    background: '#fff7e6',
    border: '1px solid #ffa940',
    borderRadius: 20,
    padding: '2px 14px',
    fontSize: 13,
    color: '#d46b08',
    fontWeight: 600,
  };

  const pointsBoxStyle = {
    background: 'linear-gradient(135deg, #4CAF50, #2e7d32)',
    color: '#fff',
    borderRadius: 10,
    padding: '16px 12px',
    textAlign: 'center',
    margin: '16px 0',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
    marginTop: 8,
  };

  const thStyle = {
    borderBottom: '2px solid #f0f0f0',
    padding: '8px 6px',
    textAlign: 'left',
    color: '#666',
    fontWeight: 600,
    fontSize: 13,
  };

  const tdStyle = {
    borderBottom: '1px solid #f5f5f5',
    padding: '8px 6px',
    verticalAlign: 'top',
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', padding: '64px 16px 0' }}>
        <p style={{ fontSize: 16, color: '#888' }}>Loading your loyalty info…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: 'center', color: '#cf1322' }}>
          <p style={{ fontSize: 18, margin: 0 }}>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  const { member, redemptions } = data;

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#333' }}>🎁 Loyalty Points</h2>
          <span style={badgeStyle}>{member.tier_name || 'Member'}</span>
        </div>

        <div>
          <p style={{ margin: '4px 0' }}>
            <span style={labelStyle}>Name:</span> {member.name}
          </p>
          <p style={{ margin: '4px 0' }}>
            <span style={labelStyle}>Loyalty Code:</span> {member.loyalty_code || '-'}
          </p>
          <p style={{ margin: '4px 0' }}>
            <span style={labelStyle}>Member Since:</span> {formatDate(member.enrolled_on)}
          </p>
        </div>

        <div style={pointsBoxStyle}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Available Points</div>
          <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>{member.points_balance}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            Lifetime earned: {member.lifetime_points} pts
          </div>
        </div>

        <h3 style={{ fontSize: 15, marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
          Recent Redemptions
        </h3>

        {redemptions.length === 0 ? (
          <p style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>No redemptions yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Offer</th>
                <th style={thStyle}>Type</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Points</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.offer_name || '-'}</td>
                  <td style={tdStyle}>{offerTypeLabel(r.offer_type)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#cf1322', fontWeight: 600 }}>
                    -{r.points_used}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#888' }}>
                    {formatDate(r.redeemed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#bbb' }}>
          Powered by Cloudnet Softwares
        </p>
      </div>
    </div>
  );
}
