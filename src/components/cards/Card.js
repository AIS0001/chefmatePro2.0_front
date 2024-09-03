import React from 'react';

const Card = ({ title, content, footer }) => {
  return (
    <div className="card">
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">{content}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
