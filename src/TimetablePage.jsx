// TimetablePage.js
import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./TimetablePage.css";

function TimetablePage({ onBack, onLogout }) {
  const [timetable, setTimetable] = useState({
    monday: ["", "", "", "", "", ""],
    tuesday: ["", "", "", "", "", ""],
    wednesday: ["", "", "", "", "", ""],
    thursday: ["", "", "", "", "", ""],
    friday: ["", "", "", "", "", ""]
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const timetableRef = doc(db, "users", currentUser.uid, "timetable", "week");
        const timetableSnap = await getDoc(timetableRef);
        if (timetableSnap.exists()) {
          setTimetable(timetableSnap.data());
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (day, periodIndex, value) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: prev[day].map((subj, idx) => (idx === periodIndex ? value : subj))
    }));
  };

  console.log("SAVE BUTTON CLICKED");
  const handleSave = async () => {
    console.log("SAVE BUTTON CLICKED");
    console.log("User:", user);
    if (!user) {
      alert("User not logged in");
      return;
    }
    try {
      const timetableRef = doc(db, "users", user.uid, "timetable", "week");
      console.log("Saving to:", user.uid);
      console.log("Data:", timetable);
      await setDoc(timetableRef, timetable, { merge: false });
      console.log("SAVE SUCCESS");
      alert("Timetable saved successfully!");
    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert("Error saving timetable.");
    }
  };

  return (
    <div className="tt-container">
      <button className="page-signout-btn" onClick={onLogout}>Sign out</button>
      <div className="tt-bg-orb tt-bg-orb--1" />
      <div className="tt-bg-orb tt-bg-orb--2" />
      <div className="tt-bg-orb tt-bg-orb--3" />

      <div className="tt-inner">
        <h1 className="tt-title">Weekly Timetable</h1>
        <p className="tt-subtitle">Manage your schedule for the week</p>

        <div className="tt-table-wrap">
          <table className="tt-table">
            <thead>
              <tr>
                <th className="tt-th tt-th--day">Day</th>
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <th key={p} className="tt-th">Period {p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
                <tr key={day} className="tt-row">
                  <td className="tt-day-label">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </td>
                  {timetable[day].map((subj, idx) => (
                    <td key={idx} className="tt-cell">
                      <input
                        type="text"
                        placeholder="Subject"
                        value={subj}
                        onChange={(e) => handleChange(day, idx, e.target.value)}
                        className="tt-input"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tt-actions">
          <button onClick={handleSave} className="tt-btn tt-btn--primary">
            Save Timetable
          </button>
          <button onClick={onBack} className="tt-btn tt-btn--ghost">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimetablePage;