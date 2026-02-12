import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import BookingModal from "../Modals/BookingModal";// Import the updated modal

const localizer = momentLocalizer(moment);

const RoomWiseCalendar = ({ rooms }) => {
  const [events, setEvents] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

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
      setEvents((prevEvents) => ({
        ...prevEvents,
        [selectedRoom]: prevEvents[selectedRoom].map((evt) =>
          evt === selectedEvent ? { ...evt, title } : evt
        ),
      }));
    } else if (selectedSlot) {
      // Create new event
      setEvents((prevEvents) => ({
        ...prevEvents,
        [selectedRoom]: [
          ...(prevEvents[selectedRoom] || []),
          {
            start: selectedSlot.start,
            end: selectedSlot.end,
            title,
            roomNumber: selectedRoom,
          },
        ],
      }));
    }
    // Clear selections after saving
    setSelectedSlot(null);
    setSelectedEvent(null);
    setSelectedRoom(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setSelectedEvent(null);
    setSelectedRoom(null);
  };

  return (
    <div>
      {rooms.map((room) => (
        <div key={room}>
          <h2>Room {room} Calendar</h2>
          <Calendar
            localizer={localizer}
            events={events[room] || []}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            step={30}
            timeslots={2}
            defaultView="week"
            onView={() => setSelectedRoom(room)}
          />
        </div>
      ))}

      <BookingModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialTitle={selectedEvent ? selectedEvent.title : ""}
        initialRoom={selectedEvent ? selectedEvent.roomNumber : ""}
      />
    </div>
  );
};

export default RoomWiseCalendar;
