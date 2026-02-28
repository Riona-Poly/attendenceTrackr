import AttendanceMarkingPage from "./AttendanceMarkingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import GoogleCalendar from "./GoogleCalendar.jsx";
import TimetablePage from "./TimetablePage.jsx";
import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs
} from "firebase/firestore";

function App() {

  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // 🔥 AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setCurrentPage("dashboard");
        await loadSubjects(currentUser.uid);
        await recalculateAttendance(currentUser.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔥 LOAD SUBJECTS
  const loadSubjects = async (uid) => {
    const subjectsRef = collection(db, "users", uid, "subjects");
    const snapshot = await getDocs(subjectsRef);

    const subjectList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setSubjects(subjectList);
  };

  // 🔥 RECALCULATE FROM DAILY LOGS
  const recalculateAttendance = async (uid) => {
    const logsRef = collection(db, "users", uid, "dailyLogs");
    const logSnap = await getDocs(logsRef);

    const subjectTotals = {};

    logSnap.forEach(docSnap => {
      const data = docSnap.data();

      if (data.type === "holiday") return;

      const periods = data.periods || {};

      Object.values(periods).forEach(p => {
        if (!p.subject) return;

        if (!subjectTotals[p.subject]) {
          subjectTotals[p.subject] = {
            total: 0,
            attended: 0
          };
        }

        subjectTotals[p.subject].total += 1;
        if (p.present) {
          subjectTotals[p.subject].attended += 1;
        }
      });
    });

    // Update each subject document
    for (const subjectName in subjectTotals) {
      const subjectRef = doc(
        db,
        "users",
        uid,
        "subjects",
        subjectName.toLowerCase()
      );

      await setDoc(
        subjectRef,
        {
          name: subjectName,
          totalClasses: subjectTotals[subjectName].total,
          attendedClasses: subjectTotals[subjectName].attended
        },
        { merge: true }
      );
    }

    await loadSubjects(uid);
  };

  // LOGIN
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  // LOGOUT
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // CALCULATE %
  const calculateAttendancePercentage = (subject) => {
    const { attendedClasses = 0, totalClasses = 0 } = subject;
    if (totalClasses === 0) return 0;
    return Math.round((attendedClasses / totalClasses) * 100);
  };

  const getAttendanceColor = (subject) => {
    const percent = calculateAttendancePercentage(subject);
    if (percent < 75) return "red";
    if (percent < 85) return "orange";
    return "green";
  };

  return (
    <div>
      {!user && <LoginPage onLogin={handleLogin} />}

      {user && currentPage === "dashboard" && (
        <DashboardPage
          subjects={subjects}
          getAttendanceColor={getAttendanceColor}
          calculateAttendancePercentage={calculateAttendancePercentage}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        />
      )}

      {user && currentPage === "timetable" && (
        <TimetablePage
          onBack={() => setCurrentPage("dashboard")}
        />
      )}

      {user && currentPage === "calendar" && (
        <GoogleCalendar
          onBack={() => setCurrentPage("dashboard")}
          recalculateAttendance={() => recalculateAttendance(user.uid)}
        />
      )}

      {user && currentPage === "attendance" && (
        <AttendanceMarkingPage
          onBack={() => setCurrentPage("dashboard")}
          recalculateAttendance={() => recalculateAttendance(user.uid)}
        />
      )}
    </div>
  );
}

export default App;