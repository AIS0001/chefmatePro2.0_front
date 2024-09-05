import React,{useState,useEffect} from 'react';

import { NotificationProvider } from '../../Context/NotificationContext';
import WebSocketService from '../../Sockets/WebSocketService';
import DataTable from '../../components/data-tables/dataTable';


const NewNotifications = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
  
    useEffect(() => {
        WebSocketService.listenForNotifications(userId, setNotifications);
    }, [userId]);
  
    return (
      <div>
        <h2>Notifications</h2>
        <ul>
          {notifications.map((notif) => (
            <li key={notif.id}>{notif.message}</li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default NewNotifications;