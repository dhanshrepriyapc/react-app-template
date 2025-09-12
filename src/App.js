import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  const [nowPercent, setNowPercent] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const fetchAppointments = () => {
    fetch("http://localhost:5169/api/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  useEffect(() => {
    const updateNowLine = () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      const percent = (minutesSinceMidnight / (24 * 60)) * 100;
      setNowPercent(percent);
    };
    updateNowLine();
    const interval = setInterval(updateNowLine, 60000);
    return () => clearInterval(interval);
  }, []);

  const isSameDay = (dateStr) =>
    new Date(dateStr).toDateString() === new Date(selectedDate).toDateString();

  const isToday = () =>
    new Date(selectedDate).toDateString() === new Date().toDateString();

  const getStatus = (start) => {
    const now = new Date();
    return new Date(start) < now ? "completed" : "upcoming";
  };

  // Convert HH:mm + AM/PM → 24h "HH:mm"
  const to24Hour = (time, period) => {
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const startTime = to24Hour(formData.get("start"), formData.get("startPeriod"));
    const endTime = to24Hour(formData.get("end"), formData.get("endPeriod"));

    const appointmentPayload = {
      name: formData.get("name"),
      start: `${selectedDate}T${startTime}:00`,
      end: `${selectedDate}T${endTime}:00`,
    };

    if (editingAppointment) {
      // UPDATE
      await fetch(`http://localhost:5169/api/appointments/${editingAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...appointmentPayload, id: editingAppointment.id }),
      });
    } else {
      // CREATE
      await fetch("http://localhost:5169/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentPayload),
      });
    }

    setShowModal(false);
    setEditingAppointment(null);
    fetchAppointments();
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;
    await fetch(`http://localhost:5169/api/appointments/${editingAppointment.id}`, {
      method: "DELETE",
    });
    setShowModal(false);
    setEditingAppointment(null);
    fetchAppointments();
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Appointments</h2>
        <p>Manage your schedule</p>

        <div className="date-nav">
          <button onClick={prevDay}>‹</button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={nextDay}>›</button>
        </div>

        <div className="appointment-list">
          <h3>Completed</h3>
          {appointments
            .filter((a) => isSameDay(a.start) && getStatus(a.start) === "completed")
            .map((a) => (
              <div key={a.id} className="appointment-item completed">
                {a.name} (
                {new Date(a.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
                )
              </div>
            ))}

          <h3>Upcoming</h3>
          {appointments
            .filter((a) => isSameDay(a.start) && getStatus(a.start) === "upcoming")
            .map((a) => (
              <div key={a.id} className="appointment-item upcoming">
                {a.name} (
                {new Date(a.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
                )
              </div>
            ))}
        </div>
      </aside>

      {/* Timeline */}
      <main className="timeline">
        {Array.from({ length: 24 }, (_, i) => {
          const hour = i % 12 || 12;
          const ampm = i < 12 ? "AM" : "PM";
          return (
            <div key={i} className="time-slot">
              <div className="time-label">{`${hour}:00 ${ampm}`}</div>
            </div>
          );
        })}

        {/* Red Line only for today */}
        {isToday() && <div className="now-line" style={{ top: `${nowPercent}%` }} />}

        {/* Appointments */}
        {appointments
          .filter((a) => isSameDay(a.start))
          .map((a) => {
            const start = new Date(a.start);
            const end = new Date(a.end);
            const startMinutes = start.getHours() * 60 + start.getMinutes();
            const endMinutes = end.getHours() * 60 + end.getMinutes();
            const top = (startMinutes / (24 * 60)) * 100;
            const height = ((endMinutes - startMinutes) / (24 * 60)) * 100;

            return (
              <div
                key={a.id}
                className={`appointment-block ${getStatus(a.start)}`}
                style={{ top: `${top}%`, height: `${height}%` }}
                onClick={() => {
                  setEditingAppointment(a);
                  setShowModal(true);
                }}
              >
                <strong>{a.name}</strong>
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
          })}
      </main>

      {/* Floating + Button */}
      <button
        className="add-btn"
        onClick={() => {
          setEditingAppointment(null);
          setShowModal(true);
        }}
      >
        +
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingAppointment ? "Edit Appointment" : "New Appointment"}</h3>
            <form onSubmit={handleAddOrEdit}>
              <input
                type="text"
                name="name"
                placeholder="Title"
                defaultValue={editingAppointment?.name || ""}
                required
              />

              {/* Start time with AM/PM */}
              <div className="time-row">
                <input
                  type="time"
                  name="start"
                  step="1800"
                  defaultValue={
                    editingAppointment
                      ? new Date(editingAppointment.start)
                          .toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                      : ""
                  }
                  required
                />
                <select name="startPeriod" defaultValue="AM">
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>

              {/* End time with AM/PM */}
              <div className="time-row">
                <input
                  type="time"
                  name="end"
                  step="1800"
                  defaultValue={
                    editingAppointment
                      ? new Date(editingAppointment.end)
                          .toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                      : ""
                  }
                  required
                />
                <select name="endPeriod" defaultValue="AM">
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>

              <div className="modal-actions">
                {editingAppointment && (
                  <button type="button" className="delete-btn" onClick={handleDelete}>
                    Delete
                  </button>
                )}
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit">
                  {editingAppointment ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
