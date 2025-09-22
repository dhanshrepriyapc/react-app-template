// Sidebar.jsx
import React, { useState, useEffect } from "react";
import DateNav from "./DateNav";

function Sidebar({ appointments, selectedDate, setSelectedDate, isSameDay, getStatus, currentView }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile overlay
  const [isCollapsed, setIsCollapsed] = useState(false);   // desktop collapse
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Color mapping (same defaults as App.js)
  const typeColors = {
    Meeting: "#1976d2",
    Personal: "#0a560eff",
    Deadline: "#8d2a2aff",
    "Follow-up": "#858e08ff",
  };

  // Track window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (windowWidth <= 784) {
      setIsMobileOpen(!isMobileOpen); // mobile overlay
    } else {
      setIsCollapsed(!isCollapsed);   // desktop collapse
    }
  };

  // Filter upcoming appointments
  const upcomingAppointments = appointments.filter(
    (a) => isSameDay(a.startTime, selectedDate) && getStatus(a.startTime) === "upcoming"
  );

  return (
    <>
      {/* Hamburger for mobile */}
      {windowWidth <= 784 && (
        <button className="hamburger" onClick={toggleSidebar}>
          ☰
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          windowWidth > 784 ? (isCollapsed ? "closed" : "") : isMobileOpen ? "open" : ""
        }`}
      >
        {/* Collapse button for desktop */}
        {windowWidth > 784 && (
          <button className="collapse-btn" onClick={toggleSidebar}>
            {isCollapsed ? "»" : "«"}
          </button>
        )}

        {/* Content visible only when expanded or on mobile open */}
        {(windowWidth <= 784 ? isMobileOpen : !isCollapsed) && (
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h2>📅 Appointments</h2>
              <p>Manage your schedule</p>
            </div>

            <div className="sidebar-date">
              <DateNav selectedDate={selectedDate} setSelectedDate={setSelectedDate} currentView={currentView} />
            </div>

              {/* COLOR LEGEND ��� small dots with labels */}
              <div className="color-legend">
                <div className="legend-grid" role="list" aria-label="Appointment color codes">
                  {Object.entries(typeColors).map(([type, color]) => (
                    <div key={type} className="legend-item" role="listitem">
                      <span
                        className="legend-dot"
                        style={{ backgroundColor: color }}
                      />
                      <span className="legend-label">{type}</span>
                    </div>
                  ))}
                </div>
              </div>


            <div className="appointment-list">
              <h3>Recent & Upcoming</h3>
              {upcomingAppointments.map((a) => {
  const typeColor = typeColors[a.type] || "#1976d2"; // fallback color

  return (
    <div key={a.id} className="appointment-item upcoming">
      <div className="appt-time">
        {new Date(a.startTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
      <div className="appt-title">{a.title}</div>
      <span
        className="appt-label"
        style={{
          backgroundColor: typeColor,
          color: "#fff", // always white text for contrast
        }}
      >
        Upcoming
      </span>
    </div>
  );
})}

            </div>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {windowWidth <= 784 && (
        <div
          className={`sidebar-overlay ${isMobileOpen ? "active" : ""}`}
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}

export default Sidebar;
