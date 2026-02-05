import React, { useState } from 'react';
import moment from 'moment';

const DateWiseBooking = ({ events }) => {
  const [selectedDate, setSelectedDate] = useState(moment().startOf('day'));

  const filteredEvents = events.filter(
    (event) =>
      moment(event.start).isSame(selectedDate, 'day') ||
      moment(event.end).isSame(selectedDate, 'day')
  );

  return (
    <div>
      <h2>Bookings for {selectedDate.format('MMMM Do YYYY')}</h2>
      <ul>
        {filteredEvents.length === 0 ? (
          <li>No bookings for this date.</li>
        ) : (
          filteredEvents.map((event, index) => (
            <li key={index}>
              Room {event.roomNumber}: {event.title} -{' '}
              {moment(event.start).format('h:mm a')} to{' '}
              {moment(event.end).format('h:mm a')}
            </li>
          ))
        )}
      </ul>
      <button onClick={() => setSelectedDate(moment(selectedDate).subtract(1, 'day'))}>
        Previous Day
      </button>
      <button onClick={() => setSelectedDate(moment(selectedDate).add(1, 'day'))}>
        Next Day
      </button>
    </div>
  );
};

export default DateWiseBooking;
