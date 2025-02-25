import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token on logout
    navigate("/login"); // Redirect to login
  };

  return (
    <nav className="flex justify-between p-4 bg-blue-500 text-white shadow-lg">
      <h1 className="text-lg font-bold">MyApp</h1>
      <ul className="flex gap-4">
        <li><Link to="/submit-data" className="hover:underline">Profile</Link></li>
        <li><Link to="/food-intake" className="hover:underline">Food Intake</Link></li>
        <li>
          <button onClick={handleLogout} className="bg-red-500 px-2 py-1 rounded">Logout</button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
