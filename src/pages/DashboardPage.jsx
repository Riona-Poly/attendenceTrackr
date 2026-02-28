import React from "react";
import "./DashboardPage.css";

function DashboardPage({
  subjects,
  getAttendanceColor,
  calculateAttendancePercentage,
  onNavigate,
  onLogout
}) {

  const calculateStats = (sub, target) => {
    const A = sub.attendedClasses || 0;
    const T = sub.totalClasses || 0;

    if (T === 0) return { bunkable: 0, needed: 0 };

    const targetDecimal = target / 100;
    let bunkable = Math.floor((A / targetDecimal) - T);
    if (bunkable < 0) bunkable = 0;

    let needed = 0;
    const currentPercent = A / T;
    if (currentPercent < targetDecimal) {
      needed = Math.ceil((targetDecimal * T - A) / (1 - targetDecimal));
    }

    return { bunkable, needed };
  };

  const navItems = [
    { key: "timetable", label: "Timetable", icon: "▦" },
    { key: "calendar",  label: "Calendar",  icon: "◫" },
  ];

  return (
    <div className="db-container">
      <div className="db-bg-orb db-bg-orb--1" />
      <div className="db-bg-orb db-bg-orb--2" />
      <div className="db-bg-orb db-bg-orb--3" />

      <div className="db-inner">

        {/* ── Sign out (fixed) ── */}
        <button className="page-signout-btn" onClick={onLogout}>Sign out</button>

        {/* ── Header ── */}
        <header className="db-header">
          <div className="db-header-brand">
            <div className="db-logo-mark">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="10" width="24" height="16" rx="3" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 10V7a6 6 0 0 1 12 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="14" cy="18" r="2.5" fill="currentColor"/>
              </svg>
            </div>
            <span className="db-brand-name">BunkerPal</span>
          </div>
        </header>

        {/* ── Nav ── */}
        <nav className="db-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className="db-nav-btn"
              onClick={() => onNavigate(item.key)}
            >
              <span className="db-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Section title ── */}
        <div className="db-section-header">
          <h2 className="db-section-title">Your Subjects</h2>
          <span className="db-section-count">{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</span>
        </div>

        {subjects.length === 0 && (
          <div className="db-empty">
            <p>No subjects recorded yet. Mark some attendance to get started.</p>
          </div>
        )}

        {/* ── Subject cards ── */}
        <div className="db-cards">
          {subjects.map((sub) => {
            const percentage = calculateAttendancePercentage(sub);
            const colorKey = getAttendanceColor(sub);
            const stats85 = calculateStats(sub, 85);
            const stats75 = calculateStats(sub, 75);

            const statusClass =
              colorKey === "green"  ? "db-card--good"  :
              colorKey === "orange" ? "db-card--warn"  : "db-card--danger";

            const statusLabel =
              colorKey === "green"  ? "On Track"  :
              colorKey === "orange" ? "Low"        : "Critical";

            return (
              <div key={sub.id} className={`db-card ${statusClass}`}>

                <div className="db-card-header">
                  <h3 className="db-card-name">{sub.name}</h3>
                  <span className="db-card-status">{statusLabel}</span>
                </div>

                {sub.totalClasses > 0 ? (
                  <>
                    <div className="db-card-percent-row">
                      <span className="db-card-percent">{percentage}%</span>
                      <span className="db-card-fraction">
                        {sub.attendedClasses} / {sub.totalClasses} classes
                      </span>
                    </div>

                    <div className="db-progress-track">
                      <div
                        className="db-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="db-progress-marker db-progress-marker--75" title="75%" />
                      <div className="db-progress-marker db-progress-marker--85" title="85%" />
                    </div>

                    <div className="db-card-divider" />

                    <div className="db-card-stats">
                      {percentage >= 85 ? (
                        <>
                          <div className="db-stat">
                            <span className="db-stat-label">Can bunk (85%)</span>
                            <span className="db-stat-value db-stat-value--good">{stats85.bunkable} classes</span>
                          </div>
                          <div className="db-stat">
                            <span className="db-stat-label">Can bunk (75%)</span>
                            <span className="db-stat-value db-stat-value--good">{stats75.bunkable} classes</span>
                          </div>
                        </>
                      ) : percentage >= 75 ? (
                        <div className="db-stat">
                          <span className="db-stat-label">Attend to reach 85%</span>
                          <span className="db-stat-value db-stat-value--warn">{stats85.needed} more</span>
                        </div>
                      ) : (
                        <div className="db-stat">
                          <span className="db-stat-label">Attend to reach 75%</span>
                          <span className="db-stat-value db-stat-value--danger">{stats75.needed} more</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="db-card-empty">No classes recorded yet.</p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;