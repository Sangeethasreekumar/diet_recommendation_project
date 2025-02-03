import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const healthConditionsList = ["Sugar", "Cholesterol", "BP", "Hair Loss", "Obesity", "Thyroid", "Heart Disease"];

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
    weightGoal: "maintain",
    dietType: "non-vegan",
    healthConditions: [],
  });

  const [bmi, setBmi] = useState(null);
  const [bmr, setBmr] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleHealthConditionChange = (condition) => {
    setFormData((prevState) => {
      const selectedConditions = prevState.healthConditions.includes(condition)
        ? prevState.healthConditions.filter((item) => item !== condition)
        : [...prevState.healthConditions, condition];

      return { ...prevState, healthConditions: selectedConditions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const payload = {
      weight: Number(formData.weight),
      height: Number(formData.height),
      age: Number(formData.age),
      gender: formData.gender,
      weightGoal: formData.weightGoal,
      dietType: formData.dietType,
      healthConditions: formData.healthConditions,
    };

    try {
      const response = await axios.post("/api/submit-data", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBmi(response.data.bmi);
      setBmr(response.data.bmr);
      setMessage(response.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed");
      setMessage("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Submit Profile Data</h2>
        {message && <p className="text-green-500">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="mb-2">
          <label>Weight (kg):</label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            className="w-full p-2 border"
            required
          />
        </div>

        <div className="mb-2">
          <label>Height (cm):</label>
          <input
            type="number"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            className="w-full p-2 border"
            required
          />
        </div>

        <div className="mb-2">
          <label>Age:</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full p-2 border"
            required
          />
        </div>

        <div className="mb-2">
          <label>Gender:</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full p-2 border"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="mb-2">
          <label>Weight Goal:</label>
          <select
            value={formData.weightGoal}
            onChange={(e) => setFormData({ ...formData, weightGoal: e.target.value })}
            className="w-full p-2 border"
          >
            <option value="gain">Gain Weight</option>
            <option value="lose">Lose Weight</option>
            <option value="maintain">Maintain Weight</option>
            <option value="stress">Manage Stress</option>
          </select>
        </div>

        <div className="mb-2">
          <label>Diet Preference:</label>
          <select
            value={formData.dietType}
            onChange={(e) => setFormData({ ...formData, dietType: e.target.value })}
            className="w-full p-2 border"
          >
            <option value="vegan">Vegan</option>
            <option value="non-vegan">Non-Vegan</option>
          </select>
        </div>

        {/* Health Conditions Multi-Select */}
        <div className="mb-4">
          <label className="block mb-1">Health Conditions:</label>
          <div className="border p-2 rounded bg-gray-50">
            {healthConditionsList.map((condition) => (
              <label key={condition} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={condition}
                  checked={formData.healthConditions.includes(condition)}
                  onChange={() => handleHealthConditionChange(condition)}
                />
                <span>{condition}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Submit
        </button>
      </form>

      {/* Display Results */}
      {bmi && bmr && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow-lg w-96">
          <h3 className="text-lg font-bold">Results:</h3>
          <p><strong>BMI:</strong> {bmi}</p>
          <p><strong>BMR:</strong> {bmr}</p>

          {formData.healthConditions.length > 0 && (
            <div>
              <h4 className="font-bold">Health Conditions:</h4>
              <ul className="list-disc ml-4">
                {formData.healthConditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
