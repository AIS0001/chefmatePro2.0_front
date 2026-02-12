import React, { useState } from 'react';
import DateRangePicker from 'react-daterange-picker';
import 'react-daterange-picker/dist/entry.nostyle';

function DateRangePickerComponent() {
  const [dateRange, setDateRange] = useState([null, null]);

  const handleDateChange = (range) => {
    setDateRange(range);
  };

  return (
    <div>
      <h3>Select a Date Range:</h3>
      <DateRangePicker
        onChange={handleDateChange}
        value={dateRange}
      />
      <p>Start Date: {dateRange[0] ? dateRange[0].toLocaleDateString() : 'N/A'}</p>
      <p>End Date: {dateRange[1] ? dateRange[1].toLocaleDateString() : 'N/A'}</p>
    </div>
  );
}

export default DateRangePickerComponent;
