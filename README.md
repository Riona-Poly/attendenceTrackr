Attendance Tracker – Smart Bunk Calculator
Project Description

Attendance Tracker is a smart web application that helps students monitor their attendance percentage and calculate how many classes they can safely bunk while maintaining the required attendance criteria (e.g., 85% and 75%).

The system dynamically updates attendance statistics and provides notifications when the safe bunk limit increases, helping students manage attendance without risk.
 Live Demo

Live Website:


 Tech Stack

React.js

Firebase Authentication

Firestore Database

JavaScript (ES6+)

CSS / Tailwind CSS

Vercel / Netlify (Deployment)

Features

 Secure user login (Google Authentication)

 Add multiple subjects

 Real-time attendance percentage calculation

Automatic bunk calculation

Notification when safe bunk count increases

 Dashboard overview of all subjects

 Cloud-based data storage (Firestore)

How Bunk Calculation Works

Let:

T = Total classes

A = Attended classes

R = Required attendance percentage (e.g., 75%)

Current Attendance %:

Attendance % = (A / T) × 100

Maximum classes that can be bunked safely:

Safe Bunks = A − (R × T / 100)

The system automatically recalculates after every update and shows:

Remaining safe bunks

Required classes to attend if attendance drops

Architecture
Frontend (React)
        ↓
Firebase Authentication
        ↓
Firestore Database

