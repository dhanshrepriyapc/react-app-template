import React from 'react';
import './Calendar.css';

const Calendar = ({ appointments, onDelete }) => {
  // Generate time slots from 8 AM to 6 PM
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    const amPm = hour < 12 ? 'AM' : 'PM';
    timeSlots.push(`${formattedHour}:00 ${amPm}`);
    timeSlots.push(`${formattedHour}:30 ${amPm}`);
  }
  
  // Helper function to check if an appointment is in a time slot
  const getAppointmentForTimeSlot = (timeSlot) => {
    // Convert timeSlot (e.g., "9:00 AM") to 24-hour format (e.g., "09:00")
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
    
    return appointments.find(appointment => 
      appointment.startTime <= formattedTime && 
      appointment.endTime > formattedTime
    );
  };
  
  return (
    <div className="calendar">
      {timeSlots.map((timeSlot, index) => {
        const appointment = getAppointmentForTimeSlot(timeSlot);
        
        return (
          <div key={index} className="time-slot">
            <div className="time-label">{timeSlot}</div>
            <div className={`appointment-slot ${appointment ? 'has-appointment' : ''}`}>
              {appointment && (
                <div className="appointment">
                  <div className="appointment-title">{appointment.title}</div>
                  <div className="appointment-time">
                    {appointment.startTime} - {appointment.endTime}
                  </div>
                  <button 
                    className="delete-button"
                    onClick={() => onDelete(appointment.id)}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Calendar;
