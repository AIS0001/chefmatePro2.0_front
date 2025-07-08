import React, { useState } from 'react';
const PandaLogin = () => {
  const [isEyesOpen, setIsEyesOpen] = useState(false);

  // Event handlers to open/close eyes
  const handleUsernameFocus = () => {
    setIsEyesOpen(true);  // Panda opens eyes on username focus
  };

  const handlePasswordFocus = () => {
    setIsEyesOpen(false);  // Panda closes eyes on password focus
  };

  return (
    <div className="login-form-container">
      <div className="login-form-column">
        <div className="panda-container">
          {/* Colorful panda image */}
          <img
            src="path_to_your_colorful_panda_image.png"
            alt="Panda"
            className="panda-image"
          />
          {/* Eyes overlay */}
          <div className={`panda-eyes ${isEyesOpen ? 'eyes-open' : 'eyes-closed'}`}>
            <div className="panda-eye left"></div>
            <div className="panda-eye right"></div>
          </div>
        </div>
        <form className="login-form">
          <div className="form-group">
            <label htmlFor="username">UserID</label>
            <input
              type="text"
              id="username"
              onFocus={handleUsernameFocus}
              placeholder="Enter Username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              onFocus={handlePasswordFocus}
              placeholder="Enter Password"
            />
          </div>
          <button type="submit" className="btn">Sign In</button>
        </form>
      </div>
      <div className="image-column">
        {/* SaaS product images */}
        <img src="path_to_your_saas_product_image.jpg" alt="SaaS Product" className="saas-image" />
      </div>
    </div>
  );
};

export default PandaLogin;
