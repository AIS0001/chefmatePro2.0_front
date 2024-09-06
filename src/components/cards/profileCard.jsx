import React from 'react';


const ProfileCard = ({ user }) => {
  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <div className="profile-image">
          <img src={user.id} alt="User Profile" />
       
        </div>
        <div className="profile-info">
          <h3>{user.uname}</h3>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="profile-card-body">
        <div className="info-item">
          <span>Username:</span> {user.username}
        </div>
        <div className="info-item">
          <span>Email:</span> {user.email}
        </div>
        <div className="info-item">
          <span>Last Login:</span> {user.lastLogin}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
