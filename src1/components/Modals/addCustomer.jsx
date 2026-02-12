import React from 'react';

export default function AddCustomerModal({
  show,
  onClose,
  onSubmit,
  newCustomer,
  handleInput
}) {
  if (!show) return null;
  return (
    <div
      className='modal fade show'
      style={{
        display: 'block',
        background: 'rgba(30,32,38,0.55)',
        backdropFilter: 'blur(2px)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1050,
        overflowY: 'auto',
        transition: 'background 0.2s',
      }}
      tabIndex='-1'
    >
      {/* Modal Header Overlay removed for proper modal header placement */}
    <div
      className='modal-dialog d-flex align-items-center justify-content-center'
      style={{
        maxWidth: '95vw',
        width: '100%',
        height: '100vh',
        margin: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
        <div
        className='modal-content'
        style={{
          width: '100%',
          maxWidth: '340px',
          minWidth: '0',
          margin: 'auto',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(30,32,38,0.18)',
          pointerEvents: 'auto',
          background: 'linear-gradient(135deg, #fff 80%, #f6f8fa 100%)',
          border: 'none',
          padding: '0',
          transition: 'box-shadow 0.2s',
        }}
        
        // Responsive adjustments
        /*
        @media (max-width: 480px) {
          maxWidth: '98vw',
          borderRadius: '10px',
          padding: '0',
        }
        */
        >
          <div className='modal-header' style={{ border: 'none', padding: '1.2rem 1.5rem 0.5rem 1.5rem', background: 'transparent' }}>
            <h5 className='modal-title' style={{ fontWeight: 700, fontSize: '1.2rem', color: '#23272f', letterSpacing: '0.01em' }}>Add New Customer</h5>
            <button type='button' className='btn-close' style={{ filter: 'invert(0.5)', opacity: 0.7 }} onClick={onClose}></button>
          </div>
          <form onSubmit={onSubmit} autoComplete="off">
            <div className='modal-body' style={{ padding: '1rem 1.5rem 0.5rem 1.5rem', background: 'transparent', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <input
                className='form-control'
                style={{ borderRadius: 8, fontSize: '1rem', border: '1px solid #e0e3e8', background: '#f8fafc', boxShadow: 'none', marginBottom: 0 }}
                id='newCustomerName'
                name='name'
                value={newCustomer.name}
                onChange={handleInput}
                type='text'
                placeholder='Customer Name'
                required
              />
              <input
                className='form-control'
                style={{ borderRadius: 8, fontSize: '1rem', border: '1px solid #e0e3e8', background: '#f8fafc', boxShadow: 'none', marginBottom: 0 }}
                id='newCustomerContact'
                name='contact'
                value={newCustomer.contact}
                onChange={handleInput}
                type='number'
                placeholder='Contact'
                required
              />
              <input
                className='form-control'
                style={{ borderRadius: 8, fontSize: '1rem', border: '1px solid #e0e3e8', background: '#f8fafc', boxShadow: 'none', marginBottom: 0 }}
                id='newCustomerEmail'
                name='email'
                value={newCustomer.email}
                onChange={handleInput}
                type='email'
                placeholder='Email ID'
              />
              <input
                className='form-control'
                style={{ borderRadius: 8, fontSize: '1rem', border: '1px solid #e0e3e8', background: '#f8fafc', boxShadow: 'none', marginBottom: 0 }}
                id='newCustomerTaxid'
                name='taxid'
                value={newCustomer.taxid}
                onChange={handleInput}
                type='text'
                placeholder='Tax ID (if Any)'
              />
              <input
                className='form-control'
                style={{ borderRadius: 8, fontSize: '1rem', border: '1px solid #e0e3e8', background: '#f8fafc', boxShadow: 'none', marginBottom: 0 }}
                id='newCustomerAddress'
                name='address'
                value={newCustomer.address}
                onChange={handleInput}
                type='text'
                placeholder='Address'
              />
            </div>
            <div className='modal-footer' style={{ border: 'none', padding: '0.5rem 1.5rem 1.2rem 1.5rem', background: 'transparent', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type='button' className='btn btn-light' style={{ borderRadius: 8, border: '1px solid #e0e3e8', color: '#23272f', fontWeight: 500, background: '#f8fafc' }} onClick={onClose}>
                Close
              </button>
              <button type='submit' className='btn btn-primary' style={{ borderRadius: 8, fontWeight: 600, padding: '0.375rem 1.5rem' }}>Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
