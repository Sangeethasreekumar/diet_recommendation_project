import React, { useState } from "react";  // React and useState hook
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";  // Router, Routes, Route for navigation
import ProfilePage from "./Pages/Profile";  // Import the UserDetailsPage component
import FoodIntakePage from "./Pages/FoodIntake";  // Import the FoodIntakePage component



const App = () => {
  const [userData, setUserData] = useState({});

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<ProfilePage setUserData={setUserData} />}
        />
        <Route
          path="/food-intake"
          element={<FoodIntakePage userData={userData} />}
        />
      </Routes>
    </Router>
  );
};

export default App;
