import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import "./App.scss";
import Sidebar from "./components/Sidebar";
import Timeline from "./components/Timeline";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import Modal from "./components/Modal";
import ErrorModal from "./components/ErrorModal";
import Login from "./components/Login";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [nowPx, setNowPx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [newSlotTime, setNewSlotTime] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const SLOT_HEIGHT = 80;

  // --- SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setEditingAppointment(null);
        setNewSlotTime(new Date()); // default now
        setShowModal(true);
      }
      if (e.altKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            setCurrentView("day");
            break;
          case "w":
            e.preventDefault();
            setCurrentView("week");
            break;
          case "m":
            e.preventDefault();
            setCurrentView("month");
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- THEME ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // --- VIEW ---
  const [currentView, setCurrentView] = useState("day");

  // --- FETCH ---
  const fetchAppointments = async () => {
    if (!loggedInUser) return;
    try {
      const response = await fetch(
        `http://localhost:5169/api/appointments?userId=${loggedInUser.id}`
      );
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  useEffect(() => {
    if (!loggedInUser) return;
    let cancelled = false;
    const fetchForUser = async () => {
      try {
        const res = await fetch(
          `http://localhost:5169/api/appointments?userId=${loggedInUser.id}`
        );
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const data = await res.json();
        if (!cancelled) setAppointments(data);
      } catch (err) {
        if (!cancelled) setErrorMessage(err.message);
      }
    };
    fetchForUser();
    return () => {
      cancelled = true;
    };
  }, [loggedInUser]);

  // --- NOW LINE ---
  useEffect(() => {
    const updateNowLine = () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      setNowPx((minutesSinceMidnight / 30) * SLOT_HEIGHT);
    };
    updateNowLine();
    const interval = setInterval(updateNowLine, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- HELPERS ---
  const isSameDay = (dateStr) =>
    new Date(dateStr).toDateString() === new Date(selectedDate).toDateString();

  const isToday = () =>
    new Date(selectedDate).toDateString() === new Date().toDateString();

  const getStatus = (start) =>
    new Date(start) < new Date() ? "completed" : "upcoming";

  const formatPrettyDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const to24Hour = (time, period) => {
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // --- ADD / EDIT ---
  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const startTime = to24Hour(formData.get("start"), formData.get("startPeriod"));
    const endTime = to24Hour(formData.get("end"), formData.get("endPeriod"));

    const payload = {
      title: formData.get("name"),
      startTime: `${selectedDate}T${startTime}:00`,
      endTime: `${selectedDate}T${endTime}:00`,
    };

    try {
      const url = editingAppointment
        ? `http://localhost:5169/api/appointments/${editingAppointment.id}?userId=${loggedInUser.id}`
        : `http://localhost:5169/api/appointments?userId=${loggedInUser.id}`;
      const method = editingAppointment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        const error = await response.json();
        setErrorMessage(error.message);
        return;
      }

      if (!response.ok) throw new Error("Failed to save appointment");

      setShowModal(false);
      setEditingAppointment(null);
      setNewSlotTime(null);
      fetchAppointments();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // --- DELETE ---
  const handleDelete = async () => {
    if (!editingAppointment) return;
    try {
      const response = await fetch(
        `http://localhost:5169/api/appointments/${editingAppointment.id}?userId=${loggedInUser.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete appointment");
      setShowModal(false);
      setEditingAppointment(null);
      fetchAppointments();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // --- LOGIN ---
  if (!loggedIn) {
    return (
      <Login
        onLogin={(user) => {
          setLoggedIn(true);
          setLoggedInUser(user);
        }}
      />
    );
  }

  // --- RENDER VIEW ---
  const renderView = () => {
    if (currentView === "day") {
      return (
        <Timeline
          appointments={appointments}
          selectedDate={selectedDate}
          isSameDay={isSameDay}
          isToday={isToday}
          onAppointmentClick={(appointment) => {
            setEditingAppointment(appointment);
            setNewSlotTime(null);
            setShowModal(true);
          }}
          onEmptySlotClick={(time) => {
            setEditingAppointment(null);
            setNewSlotTime(time);
            setShowModal(true);
          }}
          nowPx={nowPx}
          slotHeight={SLOT_HEIGHT}
          loggedInUser={loggedInUser}
          fetchAppointments={fetchAppointments}
        />
      );
    } else if (currentView === "week") {
      return (
        <WeekView
          appointments={appointments}
          selectedDate={selectedDate}
          onAppointmentClick={(appointment) => {
            setEditingAppointment(appointment);
            setNewSlotTime(null);
            setShowModal(true);
          }}
        />
      );
    } else if (currentView === "month") {
      return (
        <MonthView
          appointments={appointments}
          selectedDate={selectedDate}
          getStatus={getStatus}
          onAppointmentClick={(appointment) => {
            setEditingAppointment(appointment);
            setNewSlotTime(null);
            setShowModal(true);
          }}
        />
      );
    }
  };

  return (
    <div className="app">
      <Sidebar
        appointments={appointments}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isSameDay={isSameDay}
        getStatus={getStatus}
        currentView={currentView}
      />

      <div className="main-content">
        <div className="page-header">
          <h2>{formatPrettyDate(selectedDate)}</h2>
          <div className="header-right">
            <select
              className="view-selector"
              value={currentView}
              onChange={(e) => setCurrentView(e.target.value)}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
            <div
              className="theme-toggle"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </div>
          </div>
        </div>

        {renderView()}

        <button
          className="add-btn"
          onClick={() => {
            setEditingAppointment(null);
            setNewSlotTime(new Date());
            setShowModal(true);
          }}
        >
          +
        </button>
      </div>

      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        editingAppointment={editingAppointment}
        newSlotTime={newSlotTime}
        handleAddOrEdit={handleAddOrEdit}
        handleDelete={handleDelete}
      />

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
    </div>
  );
}

export default App;
