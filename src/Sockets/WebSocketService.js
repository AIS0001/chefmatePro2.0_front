import { requestNotificationPermission } from '../components/Notifications/requestNotificationPermission ';

import { sendNotification } from '../components/Notifications/sendNotification';


const WebSocketService = () => {
  // Request FCM token
  const init = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      // You can now use the token to receive/send notifications
    }
  };

  // Example function to trigger a notification
  const triggerNotification = (title, body) => {
    const notificationData = { title, body };
    sendNotification('<TARGET_FCM_TOKEN>', notificationData);
  };

  return {
    init,
    triggerNotification,
  };
};

export default WebSocketService;
