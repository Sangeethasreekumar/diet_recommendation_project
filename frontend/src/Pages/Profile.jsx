import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const healthConditionsList = ["None", "Sugar", "Cholesterol", "BP", "Hair Loss"];
const weightGoals = ["Select", "Gain Weight", "Lose Weight","Maintain Weight"];
const genderOptions = ["Select", "Male", "Female"];
const dietTypes = ["Non-Veg", "Vegetarian"];

const activityOptions = [
  { value: "1.2", label: "Sedentary" },
  { value: "1.375", label: "Lightly Active" },
  { value: "1.55", label: "Moderately Active" },
  { value: "1.725", label: "Very Active" },
  { value: "1.9", label: "Super Active" },
];



const ProfilePage = () => {
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "Select",
    weightGoal: "Select",
    dietType: "Select",
    healthConditions: [],
  });

  const [bmi, setBmi] = useState(null);
  const [bmr, setBmr] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileExists, setProfileExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activityLevel, setActivityLevel] = useState("0"); // Default value
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("No token found, redirecting to login...");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("/api/get-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data) {
          console.log("Profile found:", response.data);
          setFormData({
            weight: response.data.weight || "",
            height: response.data.height || "",
            age: response.data.age || "",
            gender: response.data.gender || "Select",
            weightGoal: response.data.goals?.weightGoal || "Maintain Weight",
            dietType: response.data.goals?.dietType || "Select",
            healthConditions: response.data.healthConditions?.length > 0 ? response.data.healthConditions : [],
          });
          setBmi(response.data.bmi);
          setBmr(response.data.bmr);
          setProfileExists(true);
        }
      } catch (err) {
        console.log("No existing profile found:", err.response?.data?.error);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Unauthorized: Please log in again.");
      return;
    }

    // Convert inputs to numbers to avoid string issues
    const processedFormData = {
      ...formData,
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      age: parseInt(formData.age, 10),
      activityLevel: parseFloat(activityLevel),  // Ensure it's included
    };
    

    const endpoint = profileExists ? "/api/update-profile" : "/api/submit-data";

    try {
      const response = await axios.post(endpoint, processedFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBmi(response.data.bmi);
      setBmr(response.data.bmr);
      setMessage(response.data.message);
      setError("");
      setProfileExists(true);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed");
      setMessage("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {profileExists && !isEditing ? (
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
          <h2 className="text-xl font-bold mb-4">Your Profile</h2>
          <p><strong>Weight:</strong> {formData.weight} kg</p>
          <p><strong>Height:</strong> {formData.height} cm</p>
          <p><strong>Age:</strong> {formData.age}</p>
          <p><strong>Gender:</strong> {formData.gender}</p>
          <p><strong>Weight Goal:</strong> {formData.weightGoal}</p>
          <p><strong>Diet Type:</strong> {formData.dietType}</p>
          <p><strong>Health Conditions:</strong> {formData.healthConditions.join(", ") || "None"}</p>
          <p><strong>BMI:</strong> {bmi}</p>
          <p><strong>BMR:</strong> {bmr}</p>
          <button onClick={() => setIsEditing(true)} className="mt-4 bg-blue-500 text-white p-2 rounded">Update Profile</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-xl font-bold mb-4">{profileExists ? "Update Profile" : "Submit Profile Data"}</h2>
          {message && <p className="text-green-500">{message}</p>}
          {error && <p className="text-red-500">{error}</p>}

          <div className="mb-2">
            <label>Weight:</label>
            <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full p-2 border" required />
          </div>

          <div className="mb-2">
            <label>Height:</label>
            <input type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} className="w-full p-2 border" required />
          </div>

          <div className="mb-2">
            <label>Age:</label>
            <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="w-full p-2 border" required />
          </div>

          <div className="mb-2">
            <label>Gender:</label>
            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full p-2 border">
              {genderOptions.map((genders) => (
                <option key={genders} value={genders}>{genders}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label>Weight Goal:</label>
            <select value={formData.weightGoal} onChange={(e) => setFormData({ ...formData, weightGoal: e.target.value })} className="w-full p-2 border">
              {weightGoals.map((goal) => (
                <option key={goal} value={goal}>{goal}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label>Activity Level:</label>
            <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="w-full p-2 border">
              {activityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
        </div>

          <div className="mb-2">
            <label>Diet Preference:</label>
            <select value={formData.dietType} onChange={(e) => setFormData({ ...formData, dietType: e.target.value })} className="w-full p-2 border">
              {dietTypes.map((diet) => (
                <option key={diet} value={diet}>{diet}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label>Health Conditions:</label>
            <select multiple value={formData.healthConditions} onChange={(e) => setFormData({ 
                    ...formData, 
                    healthConditions: [...e.target.selectedOptions].map(option => option.value) 
                  })} 
                  className="w-full p-2 border"
                >
                  {healthConditionsList.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
          </div>

          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">{profileExists ? "Update" : "Submit"}</button>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
