import React from "react";
import AppointmentBlock from "./AppointmentBlock";

function Timeline({ appointments, isToday, nowPercent, isSameDay, getStatus, setEditingAppointment, setShowModal }) {
  const renderTimeSlots = () => {
    return Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i/2) % 12 || 12;
      const minutes = i % 2 === 0 ? "00" : "30";
      const ampm = Math.floor(i/2) < 12 ? "AM" : "PM";
      
      return (
        <div key={i} className="time-slot">
          <div className="time-label">{`${hour}:${minutes} ${ampm}`}</div>
        </div>
      );
    });
  };

  const renderAppointments = () => {
    return appointments
      .filter((a) => isSameDay(a.startTime))
      .map((a) => (
        <AppointmentBlock
          key={a.id}
          appointment={a}
          getStatus={getStatus}
          onClick={() => {
            setEditingAppointment(a);
            setShowModal(true);
          }}
        />
      ));
  };

  return (
    <main className="timeline">
      <div className="timeline-grid">
        {renderTimeSlots()}
      </div>
      
      <div className="appointments-container">
        {renderAppointments()}
      </div>

      {isToday() && (
        <div 
          className="now-line" 
          style={{ top: `${nowPercent}%` }} 
        />
      )}
    </main>
  );
}

export default Timeline;
