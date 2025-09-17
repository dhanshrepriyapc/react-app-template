import React, { useEffect, useRef, useMemo } from "react";
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

  // Memoize today's appointments to avoid duplicate filtering
  const todayAppointments = useMemo(
    () => appointments.filter((a) => isSameDay(a.startTime, selectedDate)),
    [appointments, selectedDate, isSameDay]
  );

  const renderSlots = () => {
    return Array.from({ length: 48 }, (_, i) => {
      const hour24 = Math.floor(i / 2);
      const minute = i % 2 === 0 ? "00" : "30";
      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const ampm = hour24 < 12 ? "AM" : "PM";
      const timeLabel = `${hour12}:${minute} ${ampm}`;

      return (
        <div
          key={i}
          className="time-slot"
          style={{ height: `${slotHeight}px` }}
        >
          <div className="time-label">{timeLabel}</div>
        </div>
      );
    });
  };

  const renderAppointments = () => {
    return todayAppointments.map((appointment) => (
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
    if (todayAppointments.length && timelineRef.current) {
      const now = new Date();

      let targetAppointment = todayAppointments.find(
        (a) => new Date(a.startTime) > now
      );

      if (!targetAppointment) {
        targetAppointment = todayAppointments[todayAppointments.length - 1];
      }

      if (targetAppointment) {
        const start = new Date(targetAppointment.startTime);
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const top = (startMinutes / 30) * slotHeight;
        timelineRef.current.scrollTop = Math.max(0, top - 20);
      } else {
        // Scroll to "now" if no appointments today
        const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 30) * slotHeight;
        timelineRef.current.scrollTop = Math.max(0, nowTop - 20);
      }
    }
  }, [todayAppointments, slotHeight]);

 return (
  <div className="timeline">
    <div className="timeline-grid" ref={timelineRef}>
      <div className="slots-container">{renderSlots()}</div>
      <div className="appointments-container">
        {renderAppointments()}
        {isToday() && (
          <div className="now-line" style={{ top: `${nowPx}px` }} />
        )}
      </div>
    </div>
  </div>
);


}

export default Timeline;
