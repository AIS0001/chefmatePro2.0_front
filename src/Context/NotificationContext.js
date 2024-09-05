import React, { createContext, useState, useContext } from 'react';
import Notification from '../components/Notifications/Notification';
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type) => {
    setNotifications([...notifications, { message, type }]);
    setTimeout(() => {
      setNotifications(notifications.filter(n => n.message !== message));
    }, 3000); // Notification duration
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((n, index) => (
          <Notification key={index} message={n.message} type={n.type} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
