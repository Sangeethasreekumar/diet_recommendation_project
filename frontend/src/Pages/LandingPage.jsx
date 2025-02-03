import React from "react";
import { Link, useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token on logout
    navigate("/login"); // Redirect to login
  };

  return (
    <div>
      {/* 🏠 Navbar */}
      <nav className="flex justify-between p-4 bg-blue-500 text-white">
        <h1 className="text-lg font-bold">MyApp</h1>
        <ul className="flex gap-4">
          <li><Link to="/submit-data">Profile</Link></li>
          <li><Link to="/food-intake">Food Intake</Link></li>
          <li><button onClick={handleLogout} className="bg-red-500 px-2 py-1 rounded">Logout</button></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="p-4">
        <h2>Welcome to the Dashboard</h2>
        <p>Select an option from the navbar.</p>
      </div>
    </div>
  );
};

export default LandingPage;
