// WhatsAppButton.js
import React from 'react';
import './WhatsAppButton.css';

const WhatsAppButton = ({ phoneNumber }) => {
  const handleClick = () => {
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  };

  return (
    <button className="whatsapp-button" onClick={handleClick}>
    <i className="fa fa-whatsapp"></i>
  </button>
  );
};

export default WhatsAppButton;
