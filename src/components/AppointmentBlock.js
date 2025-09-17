import React from "react";

function AppointmentBlock({ appointment, onClick, slotHeight = 80, getStatus }) {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const top = Math.floor((startMinutes / 30) * slotHeight);
  const height = Math.max(24, Math.floor(((endMinutes - startMinutes) / 30) * slotHeight)); // minimum height

  // fallback getStatus if not provided
  const localGetStatus = (startTime, endTime) => {
    const now = new Date();
    const s = new Date(startTime);
    const e = new Date(endTime);
    if (now < s) return "upcoming";
    if (now >= s && now <= e) return "ongoing";
    return "completed";
  };

  const status = (getStatus || localGetStatus)(appointment.startTime, appointment.endTime);

  return (
    <div
      className={`appointment-block ${status}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
    >
      <strong>{appointment.title}</strong>
      <br />
      {start.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}{" "}
      -{" "}
      {end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}
    </div>
  );
}

export default AppointmentBlock;
