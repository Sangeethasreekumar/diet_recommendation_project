import React, { useState } from "react";
import axios from "axios";
import "./FoodIntake.css"; // Import the CSS file

const FoodIntake = ({ userData }) => {
  const [foodQuery, setFoodQuery] = useState('');
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [grams, setGrams] = useState('');
  const [mealTime, setMealTime] = useState('');

  const getAuthToken = () => localStorage.getItem("token");

  const fetchFoodSuggestions = async (query) => {
    if (!query) {
      setFoodSuggestions([]);
      return;
    }

    try {
      const token = getAuthToken();
      const response = await axios.get(`/api/fetch-food-data`, {
        params: { query: query.charAt(0).toUpperCase() + query.slice(1) },
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = response.data;
      if (typeof data === 'string') {
        data = data.replace(/NaN/g, 'null');
        data = JSON.parse(data);
      }

      if (Array.isArray(data)) {
        setFoodSuggestions(data.map((item) => ({
          fdcId: item.fdcId,
          name: item.name,
          calories: item.calories || 0,
          total_fat: item.total_fat || 0,
          carbohydrate: item.carbohydrate || 0,
          protein: item.protein || 0,
        })));
      } else {
        setFoodSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching food suggestions:", error);
      setFoodSuggestions([]);
    }
  };

  const handleFoodInputChange = (e) => {
    setFoodQuery(e.target.value);
    fetchFoodSuggestions(e.target.value);
  };

  const extractNumber = (value) => {
    if (typeof value === "string") {
      return parseFloat(value.replace(/[^\d.]/g, "")) || 0;
    }
    return value || 0;
  };
  

  const fetchFoodDetails = async (fdcId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`/api/fetch-food-details/${fdcId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      let data = response.data;
      if (typeof data === "string") {
        data = data.replace(/NaN/g, "null");
        data = JSON.parse(data);
      }
  
      // Helper function to extract numeric values from strings
  
      const formattedFood = {
        name: data.name,
        calories: extractNumber(data.calories),
        fat: extractNumber(data.total_fat),  // Ensure total_fat extraction
        carbs: extractNumber(data.carbohydrate), // Ensure carbohydrate extraction
        protein: extractNumber(data.protein),
      };
  
      console.log("Food Data Extracted:", formattedFood); // Debugging log
      setSelectedFood(formattedFood);
    } catch (error) {
      console.error("Error fetching food details:", error);
    }
  };

  
  const handleAddFoodItem = () => {
    if (selectedFood && grams && parseInt(grams, 10) > 0) {
      const gramsValue = parseInt(grams, 10);
      const foodWithData = {
        food: selectedFood.name,
        grams: gramsValue,
        calories: (extractNumber(selectedFood.calories) * (gramsValue / 100)) || 0,
        fat: (extractNumber(selectedFood.fat) * (gramsValue / 100)),  // Corrected key
        carbs: (extractNumber(selectedFood.carbs) * (gramsValue / 100)), // Corrected key
        protein: (extractNumber(selectedFood.protein) * (gramsValue / 100)) || 0,
      };
      console.log("Adding Food Item:", foodWithData);  // Debugging log
  
      setFoodItems([...foodItems, foodWithData]);
      setFoodQuery('');
      setGrams('');
      setFoodSuggestions([]);
      setSelectedFood(null);
    }
  };
  

  const handleMealLogSubmit = async () => {
    try {
      const token = getAuthToken();
      const foodLogData = {
        mealTime, 
        foods: foodItems.map(item => ({
          name: item.food,
          calories: item.calories,
          fat: item.fat,
          carbs: item.carbs,
          protein: item.protein,
        })),
      };
      await axios.post("/api/add-food-log", foodLogData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFoodItems([]);
    } catch (error) {
      console.error("Error adding food log:", error);
    }
  };

  return (
    <div className="food-intake-container">
      <h1>Food Intake</h1>

      <div className="food-input-container">
        <div className="input-group">
          <label>Search Food:</label>
          <input type="text" value={foodQuery} onChange={handleFoodInputChange} placeholder="Enter food name" />
          {foodSuggestions.length > 0 && (
            <ul className="food-suggestions">
              {foodSuggestions.map((food) => (
                <li key={food.fdcId} onClick={() => fetchFoodDetails(food.fdcId)}>
                  {food.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedFood && (
          <div className="selected-food">
            <h2>{selectedFood.name}</h2>
          </div>
        )}

        <div className="input-group">
          <label>Grams:</label>
          <input type="number" value={grams} onChange={(e) => setGrams(e.target.value)} placeholder="Enter grams" />
          <button onClick={handleAddFoodItem}>Add Food</button>
        </div>

        <div className="input-group">
          <label>Meal Time:</label>
          <select value={mealTime} onChange={(e) => setMealTime(e.target.value)}>
            <option value="">Select Meal Time</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Food</th>
            <th>Grams</th>
            <th>Calories</th>
            <th>Fat</th>
            <th>Carbs</th>
            <th>Protein</th>
          </tr>
        </thead>
        <tbody>
          {foodItems.map((item, index) => (
            <tr key={index}>
              <td>{item.food}</td>
              <td>{item.grams}</td>
              <td>{item.calories.toFixed(1)}</td>
              <td>{item.fat.toFixed(1)}</td>
              <td>{item.carbs.toFixed(1)}</td>
              <td>{item.protein.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="submit-btn" onClick={handleMealLogSubmit}>Submit Meal Log</button>
    </div>
  );
};

export default FoodIntake;
