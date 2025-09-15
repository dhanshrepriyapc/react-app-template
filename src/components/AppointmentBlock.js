function AppointmentBlock({ appointment, getStatus, onClick }) {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  
  const slotHeight = 40; // Height of 30-min slot
  const top = Math.floor((startMinutes / 30) * slotHeight);
  const height = Math.floor(((endMinutes - startMinutes) / 30) * slotHeight);

  return (
    <div
      className={`appointment-block ${getStatus(appointment.startTime)}`}
      style={{ 
        top: `${top}px`, 
        height: `${height}px`
      }}
      onClick={onClick}
    >
      <strong>{appointment.title}</strong>
      <br />
      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })} -{" "}
      {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
    </div>
  );
}
 export default AppointmentBlock;