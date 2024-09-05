
import messaging from "../../Firebase/firebase";
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const token = await messaging.getToken({ vapidKey: 'BGqPWEocLOoGIANq-EpHFVbg1CJIe4I85U4hth1ygYocaJnCtKnB5ebWVz2LRN_wkhHMplF6FB55ssCkBcsaWto' });
      console.log('FCM Token:', token);
      return token;
    } else {
      console.error('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('Error during notification permission request:', error);
  }
};
