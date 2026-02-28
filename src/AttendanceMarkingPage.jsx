import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./AttendanceMarkingPage.css";

export function AttendanceMarkingPage({ onBack, recalculateAttendance, onLogout }) {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [periods, setPeriods] = useState({});
  const [isWeekend, setIsWeekend] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedDate && user) loadDaySchedule();
  }, [selectedDate, user]);

  const resetState = () => {
    setTimetable([]);
    setPeriods({});
    setIsWeekend(false);
    setMessage("");
    setLoaded(false);
  };

  const loadDaySchedule = async () => {
    if (!user || !selectedDate) return;
    resetState();

    const dateObj = new Date(selectedDate);
    const dayIndex = dateObj.getDay();

    if (dayIndex === 0 || dayIndex === 6) {
      setIsWeekend(true);
      setMessage("Weekend — no classes scheduled.");
      setLoaded(true);
      return;
    }

    const dayName = dateObj
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();

    const timetableSnap = await getDoc(
      doc(db, "users", user.uid, "timetable", "week")
    );

    if (!timetableSnap.exists()) {
      setMessage("No timetable found. Please set up your timetable first.");
      setLoaded(true);
      return;
    }

    const timetableData = timetableSnap.data();
    const todaySchedule = timetableData[dayName] || [];
    setTimetable(todaySchedule);

    const logSnap = await getDoc(
      doc(db, "users", user.uid, "dailyLogs", selectedDate)
    );

    let initial = {};
    if (logSnap.exists()) {
      initial = logSnap.data().periods || {};
    } else {
      todaySchedule.forEach((subj, i) => {
        initial[i] = { subject: subj || null, present: true };
      });
    }

    setPeriods(initial);
    setLoaded(true);
    setMessage("");
  };

  const toggleAttendance = (index) => {
    setPeriods((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        present: !prev[index]?.present
      }
    }));
  };

  const saveAttendance = async () => {
    if (!user || !selectedDate) return;

    await setDoc(
      doc(db, "users", user.uid, "dailyLogs", selectedDate),
      { type: "manual", periods }
    );

    await recalculateAttendance();
    setMessage("Attendance saved successfully!");
    setTimeout(() => onBack(), 1200);
  };

  const markHoliday = async () => {
    if (!user || !selectedDate) return;

    await setDoc(
      doc(db, "users", user.uid, "dailyLogs", selectedDate),
      { type: "holiday", periods: {} }
    );

    await recalculateAttendance();
    setMessage("Day marked as holiday.");
    setTimeout(() => onBack(), 1200);
  };

  const presentCount = Object.values(periods).filter((p) => p?.present).length;
  const totalCount = timetable.length;

  return (
    <div className="am-container">
      <button className="page-signout-btn" onClick={onLogout}>Sign out</button>
      <div className="am-bg-orb am-bg-orb--1" />
      <div className="am-bg-orb am-bg-orb--2" />
      <div className="am-bg-orb am-bg-orb--3" />

      <div className="am-inner">
        <h1 className="am-title">Mark Attendance</h1>
        <p className="am-subtitle">Select a date to log your attendance</p>

        {/* Date Picker Card */}
        <div className="am-date-card">
          <label className="am-date-label">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="am-date-input"
          />
        </div>

        {/* Weekend */}
        {loaded && isWeekend && (
          <div className="am-weekend-card">
            <span className="am-weekend-icon">🌿</span>
            <p className="am-weekend-text">Weekend — Enjoy your break!</p>
          </div>
        )}

        {/* No timetable / message (non-weekend) */}
        {loaded && !isWeekend && timetable.length === 0 && message && (
          <div className="am-msg-card am-msg-card--warn">
            <p>{message}</p>
          </div>
        )}

        {/* Period Table */}
        {loaded && !isWeekend && timetable.length > 0 && (
          <>
            <div className="am-summary-bar">
              <span className="am-summary-text">
                {presentCount} / {totalCount} periods present
              </span>
              <div className="am-summary-track">
                <div
                  className="am-summary-fill"
                  style={{ width: `${(presentCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            <div className="am-table-wrap">
              <table className="am-table">
                <thead>
                  <tr>
                    <th className="am-th am-th--label">Period</th>
                    <th className="am-th">Subject</th>
                    <th className="am-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((subj, index) => {
                    const isPresent = periods[index]?.present !== false;
                    return (
                      <tr key={index} className={`am-row ${isPresent ? "am-row--present" : "am-row--absent"}`}>
                        <td className="am-td am-td--num">
                          <span className="am-period-badge">{index + 1}</span>
                        </td>
                        <td className="am-td am-td--subject">
                          {subj || <span className="am-no-class">No Class</span>}
                        </td>
                        <td className="am-td am-td--toggle">
                          <button
                            className={`am-toggle ${isPresent ? "am-toggle--present" : "am-toggle--absent"}`}
                            onClick={() => toggleAttendance(index)}
                          >
                            <span className="am-toggle-dot" />
                            <span className="am-toggle-label">
                              {isPresent ? "Present" : "Absent"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="am-actions">
              <button className="am-btn am-btn--primary" onClick={saveAttendance}>
                Save Attendance
              </button>
              <button className="am-btn am-btn--holiday" onClick={markHoliday}>
                Mark as Holiday
              </button>
              <button className="am-btn am-btn--ghost" onClick={onBack}>
                Back
              </button>
            </div>
          </>
        )}

        {/* Success message */}
        {message && loaded && !isWeekend && timetable.length > 0 && (
          <div className="am-msg-card am-msg-card--success">
            <p>{message}</p>
          </div>
        )}

        {/* Back button when no periods loaded yet */}
        {!loaded && (
          <div className="am-actions am-actions--solo">
            <button className="am-btn am-btn--ghost" onClick={onBack}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceMarkingPage;