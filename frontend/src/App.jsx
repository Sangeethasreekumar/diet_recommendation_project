import React, { useState } from "react";  // React and useState hook
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";  // Router, Routes, Route for navigation
import ProfilePage from "./Pages/Profile";  // Import the UserDetailsPage component
import FoodIntakePage from "./Pages/FoodIntake";  // Import the FoodIntakePage component
import Signup from "./Components/SignUp";
import Login from "./Components/Login";
import ProtectedRoute from "./routes/ProtectedRoutes";  // 
import LandingPage from "./Pages/LandingPage";



const App = () => {

  return (
    <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path = "/signup" element={<Signup/>}/>
      <Route path="/landing" element={<LandingPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/submit-data" element={<ProfilePage />} />
        <Route path="/food-intake" element={<FoodIntakePage />} />
      </Route>
      <Route path="*" element={<Login />} /> {/* Redirect unknown routes */}
    </Routes>
  </Router>
  );
};

export default App;
