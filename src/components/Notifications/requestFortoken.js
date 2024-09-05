
import messaging from '../../Firebase/firebase';
export const requestForToken = () => {
  return getToken(messaging, { vapidKey: 'BGqPWEocLOoGIANq-EpHFVbg1CJIe4I85U4hth1ygYocaJnCtKnB5ebWVz2LRN_wkhHMplF6FB55ssCkBcsaWto' })
    .then((currentToken) => {
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Send the token to your backend or store it locally
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    })
    .catch((err) => {
      console.error('An error occurred while retrieving token:', err);
    });
};
