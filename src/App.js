import React, { useEffect, useState, useCallback } from "react"; 
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
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
          case "d": e.preventDefault(); setCurrentView("day"); break;
          case "w": e.preventDefault(); setCurrentView("week"); break;
          case "m": e.preventDefault(); setCurrentView("month"); break;
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

  const isToday = () => {
  if (!loggedInUser?.timeZoneId) return false;
  
  // Get today's date in user's timezone
  const now = new Date();
  const userToday = new Date(now.toLocaleString("en-US", { timeZone: loggedInUser.timeZoneId }));
  const selectedDateObj = new Date(selectedDate);
  
  return userToday.toDateString() === selectedDateObj.toDateString();
};


  const getStatus = (start) => (new Date(start) < new Date() ? "completed" : "upcoming");

  const formatPrettyDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  // --- FETCH APPOINTMENTS ---
 const fetchAppointments = async () => {
  const token = localStorage.getItem("jwtToken");
  if (!loggedInUser || !token) return;
  try {
    const response = await fetch(`http://localhost:5169/api/appointments/user`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch appointments");
    const data = await response.json();
    
    // Backend already returns times in user's timezone, just parse as Date objects
    const appointments = data.map((appt) => ({
      ...appt,
      startTime: new Date(appt.startTime),
      endTime: new Date(appt.endTime),
    }));

    setAppointments(appointments);
  } catch (err) {
    setErrorMessage(err.message);
  }
};

  // --- ADD / EDIT ---
 const handleAddOrEdit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("jwtToken");
  if (!token || !loggedInUser) return;

  const formData = new FormData(e.target);
  const startTime24 = to24Hour(formData.get("start"), formData.get("startPeriod"));
  const endTime24 = to24Hour(formData.get("end"), formData.get("endPeriod"));
  const recurrenceMap = { None: 0, Daily: 1, Weekly: 2, Monthly: 3 };

  // Create datetime strings in the format the backend expects
  const startTimeString = `${selectedDate}T${startTime24}:00`;
  const endTimeString = `${selectedDate}T${endTime24}:00`;

  // Get recurrence data from form
  const recurrenceType = formData.get("recurrence") || "None";
  const recurrenceInterval = formData.get("recurrenceInterval");
  const recurrenceEndDate = formData.get("recurrenceEndDate");

  console.log('=== RECURRENCE DEBUG ===');
  console.log('Recurrence type:', recurrenceType);
  console.log('Recurrence interval:', recurrenceInterval);
  console.log('Recurrence end date:', recurrenceEndDate);

  const payload = {
    Title: formData.get("title"),
    StartTime: startTimeString,
    EndTime: endTimeString,
    Description: formData.get("description") || "",
    Location: formData.get("location") || "",
    Type: formData.get("type") || "",
    ColorCode: formData.get("colorCode") || typeColors[formData.get("type") || "Meeting"],
    Recurrence: recurrenceMap[recurrenceType] || 0,
    // ADD THESE MISSING FIELDS:
    RecurrenceInterval: recurrenceInterval ? parseInt(recurrenceInterval) : null,
    RecurrenceEndDate: recurrenceEndDate ? `${recurrenceEndDate}T23:59:59` : null,
  };

  console.log('Final payload:', JSON.stringify(payload, null, 2));

  try {
    const url = editingAppointment
      ? `http://localhost:5169/api/appointments/user/${editingAppointment.id}`
      : `http://localhost:5169/api/appointments/user`;
    const method = editingAppointment ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
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
      
      // Backend already handles timezone conversion, just parse dates
      const appointments = data.map((appt) => ({
        ...appt,
        startTime: new Date(appt.startTime),
        endTime: new Date(appt.endTime),
      }));
      
      if (!cancelled) setAppointments(appointments);
    } catch (err) {
      if (!cancelled) setErrorMessage(err.message);
    }
  };
  fetchForUser();
  return () => { cancelled = true; };
}, [loggedInUser]); // Remove convertToUserTZ dependency

useEffect(() => {
  if (loggedInUser) {
    console.log('Logged in user:', loggedInUser);
    console.log('User timezone:', loggedInUser.timeZoneId);
    
    // Also decode and check JWT token
    const token = localStorage.getItem("jwtToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT payload:', payload);
        console.log('JWT timeZoneId:', payload.timeZoneId);
      } catch (e) {
        console.error('Error decoding JWT:', e);
      }
    }
  }
}, [loggedInUser]);

// --- NOW LINE ---
useEffect(() => {
  const updateNowLine = () => {
    if (!loggedInUser?.timeZoneId) return;

    // Get current time in the logged-in user's timezone
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: loggedInUser.timeZoneId }));
    
    console.log('Current time in user timezone:', userTime.toLocaleString());
    console.log('User timezone:', loggedInUser.timeZoneId);
    
    const minutesSinceMidnight = userTime.getHours() * 60 + userTime.getMinutes();
    setNowPx((minutesSinceMidnight / 30) * SLOT_HEIGHT);
  };

  updateNowLine();
  const interval = setInterval(updateNowLine, 60000);
  return () => clearInterval(interval);
}, [loggedInUser]); // Add loggedInUser back as dependency


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
            const roundedMinutes = now.getMinutes() < 30 ? 0 : 30;
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
