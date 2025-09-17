import React, { useState, useEffect } from "react";
import DateNav from "./DateNav";

function Sidebar({ appointments, selectedDate, setSelectedDate, isSameDay, getStatus }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile overlay
  const [isCollapsed, setIsCollapsed] = useState(false);   // desktop collapse
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
              <DateNav selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            </div>

            <div className="appointment-list">
              <h3>Recent & Upcoming</h3>
              {upcomingAppointments.length === 0 ? (
                <p className="empty-text">No upcoming appointments</p>
              ) : (
                upcomingAppointments.map((a) => (
                  <div key={a.id} className="appointment-item upcoming">
                    <div className="appt-time">
                      {new Date(a.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                    <div className="appt-title">{a.title}</div>
                    <span className="appt-label">Upcoming</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {windowWidth <= 784 && (
        <div
          className={`sidebar-overlay ${isMobileOpen ? "active" : ""}`}
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}

export default Sidebar;
