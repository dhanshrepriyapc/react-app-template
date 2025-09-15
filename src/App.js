import React, { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Timeline from "./components/Timeline";
import Modal from "./components/Modal";
import ErrorModal from "./components/ErrorModal";

function App() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [nowPercent, setNowPercent] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch all appointments
  const fetchAppointments = () => {
    fetch("http://localhost:5169/api/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  // Update red "now" line
  useEffect(() => {
    const updateNowLine = () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      setNowPercent((minutesSinceMidnight / (24 * 60)) * 100);
    };
    updateNowLine();
    const interval = setInterval(updateNowLine, 60000);
    return () => clearInterval(interval);
  }, []);

  const isSameDay = (dateStr) =>
    new Date(dateStr).toDateString() === new Date(selectedDate).toDateString();
  const isToday = () =>
    new Date(selectedDate).toDateString() === new Date().toDateString();
  const getStatus = (start) =>
    new Date(start) < new Date() ? "completed" : "upcoming";

  // Convert HH:mm + AM/PM → 24h HH:mm
  const to24Hour = (time, period) => {
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Add or edit appointment
 const handleAddOrEdit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  const startTime = to24Hour(formData.get("start"), formData.get("startPeriod"));
  const endTime = to24Hour(formData.get("end"), formData.get("endPeriod"));

  const appointmentPayload = {
    title: formData.get("name"),
    startTime: `${selectedDate}T${startTime}:00`,
    endTime: `${selectedDate}T${endTime}:00`,
  };

  try {
    const response = editingAppointment 
      ? await fetch(`http://localhost:5169/api/appointments/${editingAppointment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...appointmentPayload, id: editingAppointment.id }),
        })
      : await fetch("http://localhost:5169/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentPayload),
        });

    if (response.status === 409) {
      const error = await response.json();
      setErrorMessage(error.message);
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to save appointment');
    }

    setShowModal(false);
    setEditingAppointment(null);
    fetchAppointments();
  } catch (error) {
    setErrorMessage(error.message);
  }
};

  // Delete appointment
  const handleDelete = async () => {
    if (!editingAppointment) return;
    await fetch(`http://localhost:5169/api/appointments/${editingAppointment.id}`, {
      method: "DELETE",
    });
    setShowModal(false);
    setEditingAppointment(null);
    fetchAppointments();
  };

 return (
  <div className="app">
    <Sidebar
      appointments={appointments}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      isSameDay={isSameDay}
      getStatus={getStatus}
    />
    <Timeline
      appointments={appointments}
      isToday={isToday}
      nowPercent={nowPercent}
      isSameDay={isSameDay}
      getStatus={getStatus}
      setEditingAppointment={setEditingAppointment}
      setShowModal={setShowModal}
    />

    <button
      className="add-btn"
      onClick={() => {
        setEditingAppointment(null);
        setShowModal(true);
      }}
    >
      +
    </button>

    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      editingAppointment={editingAppointment}
      handleAddOrEdit={handleAddOrEdit}
      handleDelete={handleDelete}
    />

    <ErrorModal 
      message={errorMessage}
      onClose={() => setErrorMessage(null)}
    />
  </div>
);
}

export default App;
