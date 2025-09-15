// import React from "react";
// import AppointmentBlock from "./AppointmentBlock";

// function Timeline({ appointments, isToday, nowPercent, isSameDay, getStatus, setEditingAppointment, setShowModal }) {
//   return (
//     <main className="timeline">
//       {Array.from({ length: 24 }, (_, i) => {
//         const hour = i % 12 || 12;
//         const ampm = i < 12 ? "AM" : "PM";
//         return (
//           <div key={i} className="time-slot">
//             <div className="time-label">{`${hour}:00 ${ampm}`}</div>
//           </div>
//         );
//       })}

//       {isToday() && <div className="now-line" style={{ top: `${nowPercent}%` }} />}

//       {appointments.filter((a) => isSameDay(a.startTime)).map((a) => (
//         <AppointmentBlock
//           key={a.id}
//           appointment={a}
//           getStatus={getStatus}
//           onClick={() => {
//             setEditingAppointment(a);
//             setShowModal(true);
//           }}
//         />
//       ))}
//     </main>
//   );
// }

// export default Timeline;
import React from "react";
import AppointmentBlock from "./AppointmentBlock";

function Timeline({ appointments, isToday, nowPercent, isSameDay, getStatus, setEditingAppointment, setShowModal }) {
  return (
    <main className="timeline">
      {Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i/2) % 12 || 12;
        const minutes = i % 2 === 0 ? "00" : "30";
        const ampm = Math.floor(i/2) < 12 ? "AM" : "PM";
        return (
          <div key={i} className="time-slot">
            <div className="time-label">{`${hour}:${minutes} ${ampm}`}</div>
          </div>
        );
      })}

      {isToday() && <div className="now-line" style={{ top: `${nowPercent}%` }} />}

      {appointments.filter((a) => isSameDay(a.startTime)).map((a) => (
        <AppointmentBlock
          key={a.id}
          appointment={a}
          getStatus={getStatus}
          onClick={() => {
            setEditingAppointment(a);
            setShowModal(true);
          }}
        />
      ))}
    </main>
  );
}

export default Timeline;
