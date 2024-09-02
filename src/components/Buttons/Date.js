import React, { useState } from 'react';

function DatePicker() {
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  return (
    <div className='form-group'>
      <label htmlFor="date">Select a date: </label>
      <input
        type="date"
        id="date"
        className='form-control'
        value={selectedDate}
        onChange={handleDateChange}
      />
     
    </div>
  );
}

export default DatePicker;
