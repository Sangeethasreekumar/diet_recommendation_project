import React, { useState } from "react";  // React and useState hook
import { useNavigate } from "react-router-dom";  // useNavigate for programmatic navigation

const ProfilePage = ({ setUserData }) => {
    const [formData, setFormData] = useState({
      weight: "",
      height: "",
      goal: "maintain",
      preference: "non-vegan",
      health_issues: "",
    });
  
    const navigate = useNavigate();
  
    const handleSubmit = (e) => {
      e.preventDefault();
      setUserData((prev) => ({ ...prev, ...formData, health_issues: formData.health_issues.split(",") }));
      navigate("/food-intake");
    };
  
    return (
      <div>
        <h1>User Details</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Weight (kg):</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Height (cm):</label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Goal:</label>
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            >
              <option value="gain">Gain Weight</option>
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="stress">Manage Stress</option>
            </select>
          </div>
          <div>
            <label>Preference:</label>
            <select
              value={formData.preference}
              onChange={(e) => setFormData({ ...formData, preference: e.target.value })}
            >
              <option value="vegan">Vegan</option>
              <option value="non-vegan">Non-Vegan</option>
            </select>
          </div>
          <div>
            <label>Health Issues:</label>
            <input
              type="text"
              placeholder="Comma-separated (e.g., Sugar, BP)"
              value={formData.health_issues}
              onChange={(e) => setFormData({ ...formData, health_issues: e.target.value })}
            />
          </div>
          <button type="submit">Next</button>
        </form>
      </div>
    );
  }
  export default ProfilePage;