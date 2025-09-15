// function AppointmentBlock({ appointment, getStatus, onClick }) {
//   const start = new Date(appointment.startTime);
//   const end = new Date(appointment.endTime);
  
//   // Calculate position based on time slots
//   const startMinutes = start.getHours() * 60 + start.getMinutes();
//   const endMinutes = end.getHours() * 60 + end.getMinutes();
  
//   // Adjust calculation to match time-slot height (80px)
//   const top = (startMinutes / (24 * 60)) * (80 * 24); // 80px per hour * 24 hours
//   const height = ((endMinutes - startMinutes) / (24 * 60)) * (80 * 24);

//   return (
//     <div
//       className={`appointment-block ${getStatus(appointment.startTime)}`}
//       style={{ top: `${top}px`, height: `${height}px` }}
//       onClick={onClick}
//     >
//       <strong>{appointment.title}</strong>
//       <br />
//       {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })} -{" "}
//       {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
//     </div>
//   );
// }


// export default AppointmentBlock;
function AppointmentBlock({ appointment, getStatus, onClick }) {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  
  // Calculate minutes since start of day
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  
  // Each 30-min slot is 40px (half of 80px)
  const slotHeight = 40;
  const totalHeight = 48 * slotHeight; // 48 thirty-minute slots
  
  const top = (startMinutes * slotHeight) / 30;
  const height = ((endMinutes - startMinutes) * slotHeight) / 30;

  return (
    <div
      className={`appointment-block ${getStatus(appointment.startTime)}`}
      style={{ 
        top: `${top}px`, 
        height: `${height}px`,
        position: 'absolute',
        width: 'calc(100% - 90px)' // Ensures block fits within timeline
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