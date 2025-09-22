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
import SearchBar from "./components/SearchBar";

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
  const [highlightedAppointments, setHighlightedAppointments] = useState([]);

  const SLOT_HEIGHT = 80;

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [currentView, setCurrentView] = useState("day");

  const typeColors = {
    Meeting: "#1976d2",
    Personal: "#0a560eff",
    Deadline: "#a80e0eff",
    "Follow-up": "#646b05ff",
  };

  // --- SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setEditingAppointment(null);
        setNewSlotTime(new Date());
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
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // --- HELPERS ---
  const to24Hour = (time, period) => {
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const isSameDay = (dateStr) =>
    new Date(dateStr).toDateString() === new Date(selectedDate).toDateString();

  const isToday = () =>
    new Date(selectedDate).toDateString() === new Date().toDateString();

  const getStatus = (start) => (new Date(start) < new Date() ? "completed" : "upcoming");

  const formatPrettyDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const convertToUserTZ = React.useCallback(
    (isoStr) => {
      if (!loggedInUser?.timeZoneId) return isoStr;
      const date = new Date(isoStr);
      return new Date(
        date.toLocaleString("en-US", { timeZone: loggedInUser.timeZoneId })
      ).toISOString();
    },
    [loggedInUser]
  );

  const convertFromUserTZ = (localISO) => {
    if (!loggedInUser?.timeZoneId) return localISO;
    const date = new Date(localISO);
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    return tzDate.toISOString();
  };

  // --- FETCH APPOINTMENTS ---
  const fetchAppointments = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!loggedInUser || !token) return;

    try {
      const response = await fetch(`http://localhost:5169/api/appointments/user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      const tzAppointments = data.map((appt) => ({
        ...appt,
        startTime: convertToUserTZ(appt.startTime),
        endTime: convertToUserTZ(appt.endTime),
      }));
      setAppointments(tzAppointments);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // --- ADD / EDIT ---
  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    const formData = new FormData(e.target);

    const startTime24 = to24Hour(formData.get("start"), formData.get("startPeriod"));
    const endTime24 = to24Hour(formData.get("end"), formData.get("endPeriod"));

    const recurrenceMap = { None: 0, Daily: 1, Weekly: 2, Monthly: 3 };

    const payload = {
      Title: formData.get("title"),
      StartTime: new Date(`${selectedDate}T${startTime24}:00`).toISOString(),
      EndTime: new Date(`${selectedDate}T${endTime24}:00`).toISOString(),
      Description: formData.get("description") || "",
      Location: formData.get("location") || "",
      Type: formData.get("type") || "",
      ColorCode: formData.get("colorCode") || typeColors[formData.get("type") || "Meeting"],
      Recurrence: recurrenceMap[formData.get("recurrence")] || 0,
    };

    try {
      const url = editingAppointment
        ? `http://localhost:5169/api/appointments/user/${editingAppointment.id}`
        : `http://localhost:5169/api/appointments/user`;
      const method = editingAppointment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to save appointment");

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
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5169/api/appointments/user/${editingAppointment.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to delete appointment");
      setShowModal(false);
      setEditingAppointment(null);
      fetchAppointments();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // --- FETCH ON LOGIN ---
  useEffect(() => {
    if (!loggedInUser) return;
    let cancelled = false;
    const fetchForUser = async () => {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;
      try {
        const res = await fetch(`http://localhost:5169/api/appointments/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const data = await res.json();
        const tzAppointments = data.map((appt) => ({
          ...appt,
          startTime: convertToUserTZ(appt.startTime),
          endTime: convertToUserTZ(appt.endTime),
        }));
        if (!cancelled) setAppointments(tzAppointments);
      } catch (err) {
        if (!cancelled) setErrorMessage(err.message);
      }
    };
    fetchForUser();
    return () => { cancelled = true; };
  }, [loggedInUser, convertToUserTZ]);

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

  // --- LOGIN ---
  if (!loggedIn) {
    return (
      <Login
        onLogin={(user, token) => {
          if (token) localStorage.setItem("jwtToken", token);
          setLoggedIn(true);
          setLoggedInUser(user);
          fetchAppointments();
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
          highlightedAppointments={highlightedAppointments}
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
            <SearchBar
              onResults={(results) => {
                const ids = results.map((appt) => appt.id);
                setHighlightedAppointments(ids);
              }}
            />

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
            const now = new Date();
            const minutes = now.getMinutes();
            const roundedMinutes = minutes < 30 ? 0 : 30;
            const slotTime = new Date(now);
            slotTime.setMinutes(roundedMinutes, 0, 0);
            setNewSlotTime(slotTime);
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
