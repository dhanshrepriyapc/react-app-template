import React from 'react';

function DayView({ appointments, selectedDate, onNewAppointment, onAppointmentClick }) {
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

  const getAppointmentsForTimeSlot = (hour) => {
    return appointments.filter(apt => {
      const aptHour = new Date(apt.startTime).getHours();
      return aptHour === hour && new Date(apt.startTime).toDateString() === new Date(selectedDate).toDateString();
    });
  };

  return (
    <div className="day-view">
      <div className="day-view-header">
        <h2>{new Date(selectedDate).toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h2>
        <button className="new-appointment-btn" onClick={onNewAppointment}>
          + New Appointment
        </button>
      </div>

      <div className="time-slots">
        {timeSlots.map(hour => (
          <div key={hour} className="time-slot">
            <div className="time-label">
              {`${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`}
            </div>
            <div className="appointment-container">
              {getAppointmentsForTimeSlot(hour).map(apt => (
                <div 
                  key={apt.id}
                  className="appointment-block"
                  onClick={() => onAppointmentClick(apt)}
                >
                  <h4>{apt.title}</h4>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DayView;
