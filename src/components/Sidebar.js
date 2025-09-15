import React from "react";
import DateNav from "./DateNav";

function Sidebar({
  appointments,
  selectedDate,
  setSelectedDate,
  isSameDay,
  getStatus,
}) {
  const upcomingAppointments = appointments.filter(
    (a) => isSameDay(a.startTime) && getStatus(a.startTime) === "upcoming"
  );

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        
        <div>
          <h2>📅 Appointments</h2>
          <>
          <p>Manage your schedule</p>
          </>
        </div>
      </div>

      {/* Date navigation */}
      <div className="sidebar-date">
        <DateNav
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>

      {/* Upcoming Appointments */}
      <div className="appointment-list">
        <h3>Recent & Upcoming</h3>
        {upcomingAppointments.length === 0 ? (
          <p className="empty-text">No upcoming appointments</p>
        ) : (
          upcomingAppointments.map((a) => (
            <div key={a.id} className="appointment-item upcoming">
              <div className="appt-time">
                {new Date(a.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
              <div className="appt-title">{a.title}</div>
              <span className="appt-label">Upcoming</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
