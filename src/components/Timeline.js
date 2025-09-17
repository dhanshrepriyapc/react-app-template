// import React, { useEffect, useRef } from "react";
// import AppointmentBlock from "./AppointmentBlock";

// function Timeline({
//   appointments,
//   selectedDate,
//   isSameDay,
//   isToday,
//   onAppointmentClick,
//   slotHeight,
// }) {
//   const timelineRef = useRef(null);

//   const renderSlots = () => {
//     return Array.from({ length: 48 }, (_, i) => {
//       const hour24 = Math.floor(i / 2);
//       const minute = i % 2 === 0 ? "00" : "30";
//       const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
//       const ampm = hour24 < 12 ? "AM" : "PM";
//       const timeLabel = `${hour12}:${minute} ${ampm}`;

//       return (
//         <div key={i} className="time-slot" style={{ height: `${slotHeight}px` }}>
//           <div className="time-label">{timeLabel}</div>
//         </div>
//       );
//     });
//   };

//   const renderAppointments = () => {
//     return appointments
//       .filter((a) => isSameDay(a.startTime, selectedDate))
//       .map((appointment) => (
//         <AppointmentBlock
//           key={appointment.id}
//           appointment={appointment}
//           onClick={() => onAppointmentClick(appointment)}
//         />
//       ));
//   };

//   // Scroll to next upcoming appointment
//   useEffect(() => {
//     const todayAppointments = appointments
//       .filter((a) => isSameDay(a.startTime, selectedDate))
//       .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

//     if (todayAppointments.length && timelineRef.current) {
//       const now = new Date();

//       // Find the first appointment starting after now
//       let targetAppointment = todayAppointments.find(
//         (a) => new Date(a.startTime) > now
//       );

//       // If all appointments are past, scroll to the last one
//       if (!targetAppointment) {
//         targetAppointment = todayAppointments[todayAppointments.length - 1];
//       }

//       const start = new Date(targetAppointment.startTime);
//       const startMinutes = start.getHours() * 60 + start.getMinutes();
//       const top = (startMinutes / 30) * slotHeight;

//       timelineRef.current.scrollTop = top - 20; // scroll slightly above
//     }
//   }, [appointments, selectedDate, slotHeight, isSameDay]);

//   return (
//     <div className="timeline" ref={timelineRef}>
//       <div className="slots-container">{renderSlots()}</div>
//       <div className="appointments-container" style={{ height: `${48 * slotHeight}px` }}>
//         {renderAppointments()}
//         {isToday() && (
//           <div
//             className="now-line"
//             style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 30 * slotHeight}px` }}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// export default Timeline;
// src/components/Timeline.js
import React, { useEffect, useRef } from "react";
import AppointmentBlock from "./AppointmentBlock";

function Timeline({
  appointments,
  selectedDate,
  isSameDay,
  isToday,
  onAppointmentClick,
  slotHeight = 80,
  getStatus,
  nowPx,
}) {
  const timelineRef = useRef(null);

  const renderSlots = () => {
    return Array.from({ length: 48 }, (_, i) => {
      const hour24 = Math.floor(i / 2);
      const minute = i % 2 === 0 ? "00" : "30";
      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const ampm = hour24 < 12 ? "AM" : "PM";
      const timeLabel = `${hour12}:${minute} ${ampm}`;

      return (
        <div key={i} className="time-slot" style={{ height: `${slotHeight}px` }}>
          <div className="time-label">{timeLabel}</div>
        </div>
      );
    });
  };

  const renderAppointments = () => {
    return appointments
      .filter((a) => isSameDay(a.startTime, selectedDate))
      .map((appointment) => (
        <AppointmentBlock
          key={appointment.id}
          appointment={appointment}
          onClick={() => onAppointmentClick(appointment)}
          slotHeight={slotHeight}
          getStatus={getStatus}
        />
      ));
  };

  // Scroll to next upcoming appointment
  useEffect(() => {
    const todayAppointments = appointments
      .filter((a) => isSameDay(a.startTime, selectedDate))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    if (todayAppointments.length && timelineRef.current) {
      const now = new Date();

      // Find the first appointment starting after now
      let targetAppointment = todayAppointments.find(
        (a) => new Date(a.startTime) > now
      );

      // If all appointments are past, scroll to the last one
      if (!targetAppointment) {
        targetAppointment = todayAppointments[todayAppointments.length - 1];
      }

      if (targetAppointment) {
        const start = new Date(targetAppointment.startTime);
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const top = (startMinutes / 30) * slotHeight;
        timelineRef.current.scrollTop = Math.max(0, top - 20);
      }
    }
  }, [appointments, selectedDate, slotHeight, isSameDay]);

  return (
    <div className="timeline" ref={timelineRef}>
      <div className="slots-container">{renderSlots()}</div>
      <div className="appointments-container" style={{ height: `${48 * slotHeight}px` }}>
        {renderAppointments()}
        {isToday() && (
          <div
            className="now-line"
            style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 30 * slotHeight}px` }}
          />
        )}
      </div>
    </div>
  );
}

export default Timeline;
