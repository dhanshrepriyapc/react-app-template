import React from "react";

function DateNav({ selectedDate, setSelectedDate }) {
  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="date-nav">
      <button onClick={prevDay}>‹</button>
      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      <button onClick={nextDay}>›</button>
    </div>
  );
}

export default DateNav;
