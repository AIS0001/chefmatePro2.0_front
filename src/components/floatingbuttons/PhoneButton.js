// PhoneButton.js
import React from 'react';
import './WhatsAppButton.css';

const PhoneButton = ({ phoneNumber }) => {
  const handleClick = () => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  return (
    <button className="phone-button" onClick={handleClick}>
      <i className="fa fa-phone"></i>
    </button>
  );
};

export default PhoneButton;
