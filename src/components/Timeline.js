import React, { useEffect, useRef, useMemo, useState } from "react";
import AppointmentBlock from "./AppointmentBlock";

function Timeline({
  appointments,
  selectedDate,
  isSameDay,
  isToday,
  onAppointmentClick,
  onEmptySlotClick,
  slotHeight = 80,
  getStatus,
  nowPx,
  loggedInUser,
  fetchAppointments,
  highlightedAppointments = []
}) {
  const timelineRef = useRef(null);
  const [localAppointments, setLocalAppointments] = useState(appointments);

  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  // Filter today's appointments
  const todayAppointments = useMemo(
    () => localAppointments.filter((a) => isSameDay(a.startTime, selectedDate)),
    [localAppointments, selectedDate, isSameDay]
  );

  // Scroll to first highlighted appointment
  useEffect(() => {
    if (!timelineRef.current || highlightedAppointments.length === 0) return;

    const firstHighlight = localAppointments.find(a =>
      highlightedAppointments.includes(a.id)
    );
    if (!firstHighlight) return;

    const start = new Date(firstHighlight.startTime);
    const top = Math.floor((start.getHours() * 60 + start.getMinutes()) / 30 * slotHeight);

    timelineRef.current.scrollTo({
      top: top - timelineRef.current.clientHeight / 2 + slotHeight / 2,
      behavior: "smooth"
    });
  }, [highlightedAppointments, localAppointments, slotHeight]);

  // Render time slots
  const renderSlots = () =>
    Array.from({ length: 48 }, (_, i) => {
      const hour24 = Math.floor(i / 2);
      const minute = i % 2 === 0 ? 0 : 30;

      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour24, minute, 0, 0);

      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const ampm = hour24 < 12 ? "AM" : "PM";
      const minuteStr = minute === 0 ? "00" : "30";

      return (
        <div
          key={i}
          className="time-slot"
          style={{ height: `${slotHeight}px` }}
          onClick={() => onEmptySlotClick && onEmptySlotClick(slotTime)}
        >
          <div className="time-label">{`${hour12}:${minuteStr} ${ampm}`}</div>
        </div>
      );
    });

  // Render appointment blocks
  const renderAppointments = () =>
    todayAppointments.map((appointment) => {
      const isHighlighted = highlightedAppointments.includes(appointment.id);

      return (
        <AppointmentBlock
          key={appointment.id}
          appointment={appointment}
          slotHeight={slotHeight}
          getStatus={getStatus}
          onClick={() => onAppointmentClick(appointment)}
          className={isHighlighted ? "highlight" : ""}
          highlight={isHighlighted}
        />
      );
    });

  // Drag handlers
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e) => {
    e.preventDefault();
    const apptId = e.dataTransfer.getData("text/plain");
    if (!apptId) return;

    const containerRect = timelineRef.current.getBoundingClientRect();
    const offsetY = e.clientY - containerRect.top + timelineRef.current.scrollTop;

    const totalMinutes = Math.round(((offsetY / slotHeight) * 30) / 30) * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const appt = todayAppointments.find((a) => a.id.toString() === apptId);
    if (!appt) return;

    const duration = (new Date(appt.endTime) - new Date(appt.startTime)) / (1000 * 60);

    const pad = (n) => String(n).padStart(2, "0");

    // Convert drop position to user's timezone
    const localStart = new Date(selectedDate);
    localStart.setHours(hours, minutes, 0, 0);

    const isoStartUTC = new Date(
      localStart.toLocaleString("en-US", { timeZone: "UTC" })
    ).toISOString();

    const newEndUTC = new Date(new Date(isoStartUTC).getTime() + duration * 60000).toISOString();

    setLocalAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id
          ? { ...a, startTime: localStart, endTime: new Date(localStart.getTime() + duration * 60000) }
          : a
      )
    );

    // Update backend
    fetch(`http://localhost:5169/api/appointments/${appt.id}?userId=${loggedInUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...appt, startTime: isoStartUTC, endTime: newEndUTC }),
    })
      .then(() => fetchAppointments && fetchAppointments())
      .catch(console.error);
  };

  return (
    <div className="timeline">
      <div
        className="timeline-grid"
        ref={timelineRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="slots-container">{renderSlots()}</div>
        <div className="appointments-container">
          {renderAppointments()}
          {isToday() && <div className="now-line" style={{ top: `${nowPx}px` }} />}
        </div>
      </div>
    </div>
  );
}

export default Timeline;
