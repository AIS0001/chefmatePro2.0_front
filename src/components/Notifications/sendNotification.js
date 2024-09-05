import axios from 'axios';

const sendNotification = async (fcmToken, notificationData) => {
  const serverKey = 'YOUR_SERVER_KEY'; // Replace with your FCM server key
  const url = 'https://fcm.googleapis.com/fcm/send';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `key=${serverKey}`,
  };

  const body = {
    to: fcmToken,
    notification: {
      title: notificationData.title,
      body: notificationData.body,
    },
  };

  try {
    const response = await axios.post(url, body, { headers });
    console.log('Notification sent:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export { sendNotification };
