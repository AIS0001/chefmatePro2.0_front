import React, { useState } from 'react';

const DateDiffCalculatorPrompt = (start,end) => {
  const [monthsDifference, setMonthsDifference] = useState(null);

  // Function to calculate the number of months between two dates
  const calculateMonthsDifference = (start, end) => {
    const startObj = new Date(start);
    const endObj = new Date(end);

    // Get the year and month difference
    const yearDiff = endObj.getFullYear() - startObj.getFullYear();
    const monthDiff = endObj.getMonth() - startObj.getMonth();

    // Total months difference
    return yearDiff * 12 + monthDiff;
  };

  // Function to handle getting input from window.prompt
  const handleCalculate = () => {
    const startDate = window.prompt('Enter Start Date (YYYY-MM-DD):');
    const endDate = window.prompt('Enter End Date (YYYY-MM-DD):');

    if (startDate && endDate) {
      const diff = calculateMonthsDifference(startDate, endDate);
      setMonthsDifference(diff);
    } else {
      alert('Please provide both start and end dates.');
    }
  };

  return (
    <div>
      <h2>Calculate Months Between Dates</h2>

      <button onClick={handleCalculate}>Enter Dates</button>

      {monthsDifference !== null && (
        <p>Number of months between the dates: {monthsDifference}</p>
      )}
    </div>
  );
};

export default DateDiffCalculatorPrompt;
