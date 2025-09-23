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
  const [isLoading, setIsLoading] = useState(true);
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

  // --- AUTO-LOGIN ON APP START ---
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem("jwtToken");
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (payload.exp < currentTime) {
          console.log('Token expired, removing');
          localStorage.removeItem("jwtToken");
          setIsLoading(false);
          return;
        }

        // Token is valid, log user in using JWT data
        console.log('Valid token found, logging in user');
        setLoggedIn(true);
        setLoggedInUser({
          id: payload.sub || payload.userId || payload.id,
          username: payload.username,
          firstName: payload.firstName,
          lastName: payload.lastName,
          timeZoneId: payload.timeZoneId
        });

        // Optional: Try to validate with backend, but don't fail if it doesn't work
        try {
          const response = await fetch('http://localhost:5169/api/users/validate', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            // Update with fresh data from backend
            setLoggedInUser({
              id: userData.id,
              username: userData.username,
              firstName: userData.firstName,
              lastName: userData.lastName,
              timeZoneId: userData.timeZoneId
            });
            console.log('Updated user data from backend');
          }
        } catch (validationError) {
          // Validation failed, but we'll continue with JWT data
          console.log('Backend validation failed, using JWT data:', validationError.message);
        }

      } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem("jwtToken");
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  // --- LOGOUT FUNCTION ---
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      console.log('User confirmed logout');
      localStorage.removeItem("jwtToken");
      setLoggedIn(false);
      setLoggedInUser(null);
      setAppointments([]);
    }
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
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('401 error in fetchAppointments - token may be expired');
          handleLogout();
          return;
        }
        throw new Error("Failed to fetch appointments");
      }
      
      const data = await response.json();
      const appointments = data.map((appt) => ({
        ...appt,
        startTime: new Date(appt.startTime),
        endTime: new Date(appt.endTime),
      }));
      setAppointments(appointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
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

    const startTimeString = `${selectedDate}T${startTime24}:00`;
    const endTimeString = `${selectedDate}T${endTime24}:00`;

    const recurrenceType = formData.get("recurrence") || "None";
    const recurrenceInterval = formData.get("recurrenceInterval");
    const recurrenceEndDate = formData.get("recurrenceEndDate");

    const payload = {
      Title: formData.get("title"),
      StartTime: startTimeString,
      EndTime: endTimeString,
      Description: formData.get("description") || "",
      Location: formData.get("location") || "",
      Type: formData.get("type") || "",
      ColorCode: formData.get("colorCode") || typeColors[formData.get("type") || "Meeting"],
      Recurrence: recurrenceMap[recurrenceType] || 0,
      RecurrenceInterval: recurrenceInterval ? parseInt(recurrenceInterval) : null,
      RecurrenceEndDate: recurrenceEndDate ? `${recurrenceEndDate}T23:59:59` : null,
    };

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

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        const data = await response.json();
        throw new Error(data?.message || "Failed to save appointment");
      }

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
      
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        throw new Error("Failed to delete appointment");
      }
      
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
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log('401 error in fetchForUser - token may be expired');
            handleLogout();
            return;
          }
          throw new Error("Failed to fetch appointments");
        }
        
        const data = await res.json();
        const appointments = data.map((appt) => ({
          ...appt,
          startTime: new Date(appt.startTime),
          endTime: new Date(appt.endTime),
        }));
        
        if (!cancelled) setAppointments(appointments);
      } catch (err) {
        if (!cancelled) {
          console.error('Error in fetchForUser:', err);
          setErrorMessage(err.message);
        }
      }
    };
    
    fetchForUser();
    return () => { cancelled = true; };
  }, [loggedInUser]);

  // --- NOW LINE ---
  useEffect(() => {
    const updateNowLine = () => {
      if (!loggedInUser?.timeZoneId) return;
      const now = new Date();
      const userTime = new Date(now.toLocaleString("en-US", { timeZone: loggedInUser.timeZoneId }));
      const minutesSinceMidnight = userTime.getHours() * 60 + userTime.getMinutes();
      setNowPx((minutesSinceMidnight / 30) * SLOT_HEIGHT);
    };
    
    updateNowLine();
    const interval = setInterval(updateNowLine, 60000);
    return () => clearInterval(interval);
  }, [loggedInUser]);

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // --- LOGIN ---
  if (!loggedIn) {
    return (
      <Login
        onLogin={(user, token) => {
          if (token) localStorage.setItem("jwtToken", token);
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
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
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
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
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
