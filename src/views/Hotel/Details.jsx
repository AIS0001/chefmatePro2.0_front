import React, { useState } from 'react';
import RoomWiseCalendar from '../../components/Hotels/Roomwisecalendar';
import DateWiseBooking from '../../components/Hotels/Datewisecalendar';

import Layout from '../../layout/Layout';
import Header from '../../components/Header';
const Details = () => {
  const [view, setView] = useState('room'); // 'room' or 'date'
  const [allEvents, setAllEvents] = useState([]);
  const rooms = ['101', '102', '103']; // List of room numbers

  return (
    <>
<Layout>
<Header title="Hotel Booking System" />
      <button onClick={() => setView('room')}>Room Wise View</button>
      <button onClick={() => setView('date')}>Date Wise View</button>

      {view === 'room' ? (
        <RoomWiseCalendar rooms={rooms} />
      ) : (
        <DateWiseBooking events={allEvents} />
      )}
    </Layout>
    </>
  );
};

export default Details;
