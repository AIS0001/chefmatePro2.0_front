import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import BookingModal from '../../components/Modals/BookingModal';


import Layout from '../../layout/Layout';
import Header from '../../components/Header';
const localizer = momentLocalizer(moment);

const HotelBookingCalendar = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleSelectSlot = ({ start, end }) => {
    setSelectedSlot({ start, end });
    setModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleSave = (title, roomNumber) => {
    if (selectedEvent) {
      // Edit existing event
      setEvents(
        events.map((evt) =>
          evt === selectedEvent ? { ...evt, title, roomNumber } : evt
        )
      );
    } else if (selectedSlot) {
      // Create new event
      setEvents([
        ...events,
        {
          start: selectedSlot.start,
          end: selectedSlot.end,
          title,
          roomNumber,
        },
      ]);
    }
    // Clear selections after saving
    setSelectedSlot(null);
    setSelectedEvent(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setSelectedEvent(null);
  };

  return (
<>
<Layout>
<Header title="Hotel Booking System" />

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        step={30}
        timeslots={2}
        defaultView="week"
      />

      <h3>Booking Summary</h3>
      <ul>
        {events.map((event, index) => (
          <li key={index}>
            Room {event.roomNumber}: {event.title} -{' '}
            {moment(event.start).format('MMMM Do YYYY, h:mm a')} to{' '}
            {moment(event.end).format('MMMM Do YYYY, h:mm a')}
          </li>
        ))}
      </ul>

      <BookingModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialTitle={selectedEvent ? selectedEvent.title : ''}
        initialRoom={selectedEvent ? selectedEvent.roomNumber : ''}
      />
      
</Layout>
    </>
  );
};

export default HotelBookingCalendar;
