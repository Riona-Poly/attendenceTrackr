import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./GoogleCalendar.css";

function GoogleCalendar({ onBack, recalculateAttendance, onLogout }) {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [periods, setPeriods] = useState({});
  const [allSubjects, setAllSubjects] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [isWeekend, setIsWeekend] = useState(false);

  // Wait for auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Auto load when date + user ready
  useEffect(() => {
    if (selectedDate && user) {
      loadDaySchedule();
    }
  }, [selectedDate, user]);

  const resetToInitialState = () => {
    setSelectedDate("");
    setTimetable([]);
    setPeriods({});
    setEditMode(false);
    setIsWeekend(false);
    setMessage("");
  };

  const loadDaySchedule = async () => {
    if (!user || !selectedDate) return;

    const dateObj = new Date(selectedDate);
    const dayIndex = dateObj.getDay();

    // Weekend check
    if (dayIndex === 0 || dayIndex === 6) {
      setIsWeekend(true);
      setTimetable([]);
      setPeriods({});
      setEditMode(false);
      setMessage("Weekend - Holiday");
      return;
    }

    setIsWeekend(false);

    const dayName = dateObj
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();

    const timetableSnap = await getDoc(
      doc(db, "users", user.uid, "timetable", "week")
    );

    if (!timetableSnap.exists()) {
      setTimetable([]);
      setMessage("No timetable found.");
      return;
    }

    const timetableData = timetableSnap.data();
    const todaySchedule = timetableData[dayName] || [];

    setTimetable(todaySchedule);

    // Extract unique subjects
    const allDays = Object.values(timetableData).flat();
    const uniqueSubjects = [
      ...new Set(allDays.filter((s) => s && s.trim() !== ""))
    ];
    setAllSubjects(uniqueSubjects);

    // Load existing daily log
    const logSnap = await getDoc(
      doc(db, "users", user.uid, "dailyLogs", selectedDate)
    );

    let initial = {};

    if (logSnap.exists()) {
      const logData = logSnap.data();
      initial = logData.periods || {};
    } else {
      todaySchedule.forEach((subj, i) => {
        initial[i] = {
          subject: subj || null,
          present: true
        };
      });
    }

    setPeriods(initial);
    setEditMode(false);
    setMessage("");
  };

  const handleAttendanceChange = (index, isAbsent) => {
    setPeriods((prev) => ({
      ...prev,
      [index]: {
        subject: prev[index]?.subject ?? timetable[index] ?? null,
        present: !isAbsent
      }
    }));
  };

  const handleDropdownChange = (index, value) => {
    setPeriods((prev) => ({
      ...prev,
      [index]: {
        subject: value === "" ? null : value,
        present: value !== ""
      }
    }));
  };

  // ✅ Save Attendance → RESET to initial screen
  const saveAttendance = async () => {
    if (!user || !selectedDate) return;

    await setDoc(
      doc(db, "users", user.uid, "dailyLogs", selectedDate),
      {
        type: "manual",
        periods
      }
    );

    await recalculateAttendance(); // 🔥 ADD THIS

    alert("Attendance saved.");
    resetToInitialState();
  };

  // ✅ Save Updates → DO NOT reload
  const saveUpdatedSchedule = async () => {
    if (!user || !selectedDate) return;

    await setDoc(
      doc(db, "users", user.uid, "dailyLogs", selectedDate),
      {
        type: "manual",
        periods
      }
    );

    await recalculateAttendance(); // 🔥 ADD THIS

    // Sync timetable display from updated periods so subject column reflects changes immediately
    setTimetable((prev) =>
      prev.map((_, i) => periods[i]?.subject ?? "")
    );

    alert("Schedule updated.");
    setEditMode(false);
    setMessage("Schedule updated successfully.");
  };

  const markHoliday = async () => {
    if (!user || !selectedDate) return;

    await setDoc(
      doc(db, "users", user.uid, "dailyLogs", selectedDate),
      {
        type: "holiday",
        periods: {}
      }
    );

    await recalculateAttendance(); // 🔥 ADD THIS

    alert("Marked as holiday.");
    resetToInitialState();
  };

  return (
    <div className="gc-container">
      <button className="page-signout-btn" onClick={onLogout}>Sign out</button>
      <div className="gc-bg-orb gc-bg-orb--1" />
      <div className="gc-bg-orb gc-bg-orb--2" />
      <div className="gc-bg-orb gc-bg-orb--3" />

      <div className="gc-inner">
        <h1 className="gc-title">Attendance Calendar</h1>
        <p className="gc-subtitle">View and update your daily schedule</p>

        {/* Date picker */}
        <div className="gc-date-card">
          <label className="gc-date-label">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="gc-date-input"
          />
        </div>

        {/* Action buttons */}
        {selectedDate && !isWeekend && (
          <div className="gc-actions-top">
            {!editMode && (
              <button className="gc-btn gc-btn--primary" onClick={saveAttendance}>
                Save Attendance
              </button>
            )}
            <button className="gc-btn gc-btn--edit" onClick={() => setEditMode(true)}>
              Update Day Schedule
            </button>
            <button className="gc-btn gc-btn--holiday" onClick={markHoliday}>
              Class Holiday
            </button>
          </div>
        )}

        {/* Weekend */}
        {isWeekend && (
          <div className="gc-weekend-card">
            <span className="gc-weekend-icon">🌿</span>
            <p className="gc-weekend-text">Weekend — Holiday</p>
          </div>
        )}

        {/* Period list */}
        {timetable.length > 0 && !isWeekend && (
          <div className="gc-schedule-card">
            <h3 className="gc-schedule-title">
              {editMode ? "Update Day Schedule" : "Day Attendance"}
            </h3>

            <div className="gc-table-wrap">
              <table className="gc-table">
                <thead>
                  <tr>
                    <th className="gc-th gc-th--period">Period</th>
                    <th className="gc-th">Subject</th>
                    <th className="gc-th">{editMode ? "Change Subject" : "Attendance"}</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((subj, index) => {
                    const isAbsent = periods[index]?.present === false;
                    return (
                      <tr key={index} className={`gc-row ${!editMode && isAbsent ? "gc-row--absent" : ""}`}>
                        <td className="gc-td gc-td--num">
                          <span className="gc-period-badge">{index + 1}</span>
                        </td>
                        <td className="gc-td gc-td--subject">
                          {!editMode && (
                            <span>{subj || <span className="gc-no-class">No Class</span>}</span>
                          )}
                          {editMode && (
                            <span className="gc-subject-name">{subj || <span className="gc-no-class">No Class</span>}</span>
                          )}
                        </td>
                        <td className="gc-td gc-td--action">
                          {editMode ? (
                            <select
                              className="gc-select"
                              value={periods[index]?.subject ?? ""}
                              onChange={(e) => handleDropdownChange(index, e.target.value)}
                            >
                              <option value="">No Class</option>
                              {allSubjects.map((s, i) => (
                                <option key={i} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <label className="gc-checkbox-label">
                              <input
                                type="checkbox"
                                className="gc-checkbox-input"
                                checked={periods[index]?.present === false}
                                onChange={(e) => handleAttendanceChange(index, e.target.checked)}
                              />
                              <span className={`gc-checkbox-pill ${isAbsent ? "gc-checkbox-pill--absent" : "gc-checkbox-pill--present"}`}>
                                <span className="gc-checkbox-dot" />
                                {isAbsent ? "Absent" : "Present"}
                              </span>
                            </label>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {editMode && (
              <div className="gc-actions-bottom">
                <button className="gc-btn gc-btn--primary" onClick={saveUpdatedSchedule}>
                  Save Updates
                </button>
                <button className="gc-btn gc-btn--ghost" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`gc-msg-card ${message.toLowerCase().includes("error") ? "gc-msg-card--warn" : "gc-msg-card--success"}`}>
            <p>{message}</p>
          </div>
        )}

        {/* Back */}
        <div className="gc-back-row">
          <button className="gc-btn gc-btn--ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoogleCalendar;