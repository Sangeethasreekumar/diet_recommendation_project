import React, { useState } from "react";
import axios from "axios";

const FoodIntake = ({ userData }) => {
  const [foodQuery, setFoodQuery] = useState('');
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [grams, setGrams] = useState('');
  const [mealTime, setMealTime] = useState('');

  // Function to get JWT token from localStorage (or sessionStorage)
  const getAuthToken = () => {
    return localStorage.getItem("token"); // Or sessionStorage depending on your use case
  };

  // Fetch matching food suggestions
  const fetchFoodSuggestions = async (query) => {
    if (query) {
      const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);
      try {
        const token = getAuthToken(); // Get the JWT token
  
        const response = await axios.get(`/api/fetch-food-data`, {
          params: { query: capitalizedQuery },
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the header
          },
        });
  
        console.log("Raw Response Data:", typeof response.data);
  
        // If response.data is a string, sanitize it
        let data = response.data;
        if (typeof data === 'string') {
          // Sanitize NaN and other invalid values by replacing them with null
          data = data.replace(/NaN/g, 'null'); // Replace NaN with null
          try {
            data = JSON.parse(data);  // Try to parse the string to JSON
            console.log("Parsed Data:", data);
          } catch (e) {
            console.error("Error parsing JSON data:", e);
            return;  // Return early if parsing fails
          }
        }
  
        if (Array.isArray(data)) {
          const foods = data.map((item) => ({
            fdcId: item.fdcId,
            name: item.name,
            calories: item.calories || 0,
            total_fat: item.total_fat || 0,
            carbohydrate: item.carbohydrate || 0,
            protein: item.protein || 0,
          }));
          setFoodSuggestions(foods);
          console.log("Updated Food Suggestions:", foods);
        } else {
          console.error('Response data is not an array:', data);
          setFoodSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching food suggestions:", error);
        setFoodSuggestions([]);
      }
    } else {
      setFoodSuggestions([]);
    }
  };
  
  // Handle input change and fetch suggestions
  const handleFoodInputChange = (e) => {
    const query = e.target.value;
    setFoodQuery(query);
    fetchFoodSuggestions(query);
  };

  // Fetch details for the selected food
  const fetchFoodDetails = async (fdcId) => {
    try {
      const token = getAuthToken(); // Get the JWT token
  
      const response = await axios.get(`/api/fetch-food-details/${fdcId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the header
        },
      });
  
      let data = response.data;
      console.log("Raw Response Data:", typeof data);
  
      // If the response is a string, parse it
      if (typeof data === 'string') {
        try {
          data = data.replace(/NaN/g, 'null'); // Replace NaN with null to avoid parsing errors
          data = JSON.parse(data); // Parse the sanitized string into JSON
          console.log("Parsed Data:", data);
        } catch (e) {
          console.error("Error parsing JSON data:", e);
          return; // Return early if parsing fails
        }
      }
  
      // Handle the parsed data
      setSelectedFood(data);
      console.log("Selected Food Name:", data.name);
      console.log("Nutritional Values:");
      console.log("Calories:", data.calories || 'N/A');
      console.log("Fat:", data.total_fat || 'N/A');
      console.log("Carbohydrates:", data.carbohydrate || 'N/A');
      console.log("Protein:", data.protein || 'N/A');
    } catch (error) {
      console.error("Error fetching food details:", error);
    }
  };
  
  // Add selected food item with grams
  const handleAddFoodItem = () => {
    if (selectedFood && grams && parseInt(grams, 10) > 0) {
      const gramsValue = parseInt(grams, 10);
  
      const calories = parseFloat(selectedFood.calories) * (gramsValue / 100);
      const fat = parseFloat(selectedFood.total_fat) * (gramsValue / 100);
      const carbs = parseFloat(selectedFood.carbohydrate) * (gramsValue / 100);
      const protein = parseFloat(selectedFood.protein) * (gramsValue / 100);
  
      const foodWithData = {
        food: selectedFood.name,
        grams: gramsValue,
        calories: isNaN(calories) ? 0 : calories,  
        fat: isNaN(fat) ? 0 : fat,                  
        carbs: isNaN(carbs) ? 0 : carbs,            
        protein: isNaN(protein) ? 0 : protein,    
      };
  
      console.log("Adding Food Item:", foodWithData);
      setFoodItems([...foodItems, foodWithData]);
      setFoodQuery('');
      setGrams('');
      setFoodSuggestions([]);
      setSelectedFood(null);
    } else {
      console.error('Invalid grams or missing food data');
    }
  };
  

  const handleGramsInputChange = (e) => setGrams(e.target.value);

  // Handle meal log submission
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

      const response = await axios.post("/api/add-food-log", foodLogData, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the header
        },
      });
      console.log("Food log response:", response.data);
      setFoodItems([]);

    } 
    catch (error) {
      console.error("Error adding food log:", error);
    }
  };

  return (
    <div>
      <h1>Food Intake</h1>

      {/* Food Search Input */}
      <div>
        <label>Search Food:</label>
        <input
          type="text"
          value={foodQuery}
          onChange={handleFoodInputChange}
          placeholder="Enter food name"
        />

        {/* Food Suggestions as a Dropdown */}
        {foodSuggestions.length > 0 && (
          <div
            style={{
              position: "relative",
              marginTop: "5px",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: "0",
                right: "0",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRadius: "5px",
                listStyle: "none",
                padding: "0",
                margin: "0",
                zIndex: 10,
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {foodSuggestions.map((food) => (
                <li
                  key={food.fdcId}
                  onClick={() => fetchFoodDetails(food.fdcId)}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {food.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Display Selected Food Details */}
      {selectedFood && (
        <div>
          <h2>Selected Food</h2>
          <p>{selectedFood.name}</p>
          <p><strong>Calories:</strong> {selectedFood.calories || 'N/A'}</p>
          <p><strong>Fat:</strong> {selectedFood.total_fat || 'N/A'}</p>
          <p><strong>Carbohydrates:</strong> {selectedFood.carbohydrate || 'N/A'}</p>
          <p><strong>Protein:</strong> {selectedFood.protein || 'N/A'}</p>
        </div>
      )}

      {/* Grams Input and Add Food Item Button */}
      <div>
        <label>Grams:</label>
        <input
          type="number"
          value={grams}
          onChange={handleGramsInputChange}
          placeholder="Enter grams"
        />
        <button type="button" onClick={handleAddFoodItem}>
          Add Food Item
        </button>
      </div>

      {/* Food Items List */}
      <div>
        <h2>Food Items List</h2>
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
      <td>{isNaN(item.calories) ? '0' : item.calories}</td>
      <td>{isNaN(item.fat) ? '0' : item.fat}</td>
      <td>{isNaN(item.carbs) ? '0' : item.carbs}</td>
      <td>{isNaN(item.protein) ? '0' : item.protein}</td>
    </tr>
  ))}
</tbody>


        </table>
      </div>

      {/* Meal Time Input */}
      <div>
  <label>Meal Time:</label>
  <div>
    {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
      <label key={meal} style={{ marginRight: "10px" }}>
        <input
          type="radio"
          value={meal}
          checked={mealTime === meal}
          onChange={(e) => setMealTime(e.target.value)}
        />
        {meal}
      </label>
    ))}
  </div>
  <button type="button" onClick={handleMealLogSubmit}>
    Submit Meal Log
  </button>
</div>

    </div>
  );
};

export default FoodIntake;
