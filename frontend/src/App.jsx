import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ProfilePage from "./Pages/Profile";
import FoodIntakePage from "./Pages/FoodIntake";
import Navbar from "./Components/Navbar";
import Signup from "./Components/SignUp";
import Login from "./Components/Login";
import ProtectedRoute from "./routes/ProtectedRoutes";
import LandingPage from "./Pages/LandingPage";

import { Navigate } from "react-router-dom";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
};


const MainLayout = () => {
  const location = useLocation();

  console.log("Current Path:", location.pathname); // 🔍 Debugging

  // Hide Navbar on Login and Signup pages
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div>
      {!hideNavbar && <Navbar />} 
      
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/submit-data" element={<ProfilePage />} />
          <Route path="/food-intake" element={<FoodIntakePage />} />
        </Route>

        <Route path="*" element={<LandingPage />} /> {/* Redirect unknown routes */}
      </Routes>
    </div>
  );
};

export default App;
