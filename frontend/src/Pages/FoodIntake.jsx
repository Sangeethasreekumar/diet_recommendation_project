import React, { useState } from "react";
import axios from "axios";

const FoodIntake = ({ userData }) => {
  const [foodQuery, setFoodQuery] = useState('');
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [grams, setGrams] = useState('');

  // Fetch matching food suggestions
  const fetchFoodSuggestions = async (query) => {
    if (query) {
      const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);
      try {
        const response = await axios.get(`/api/fetch-food-data`, {
          params: { query: capitalizedQuery },
        });

        console.log("Raw Response Data:", response.data);

        // If response.data is a string, sanitize it to replace NaN with null
        if (typeof response.data === 'string') {
          const sanitizedResponse = response.data.replace(/NaN/g, 'null');
          const parsedData = JSON.parse(sanitizedResponse);
          console.log("Parsed Data:", parsedData);

          if (Array.isArray(parsedData)) {
            const foods = parsedData.map((item) => ({
              fdcId: item.fdcId,
              name: item.name,
              calories: item.calories || 0,  // Default to 0 if calories are missing
              total_fat: item.total_fat || 0, // Default to 0 if total fat is missing
              carbohydrate: item.carbohydrate || 0, // Default to 0 if carbohydrates are missing
              protein: item.protein || 0, // Default to 0 if protein is missing
            }));
            setFoodSuggestions(foods);
            console.log("Updated Food Suggestions:", foods);
          } else {
            console.error('Parsed response data is not an array:', parsedData);
            setFoodSuggestions([]);
          }
        } else {
          console.error('Response data is not a string:', response.data);
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
      const response = await axios.get(`/api/fetch-food-details/${fdcId}`);
      let data = response.data;
      if (typeof data === 'string') {
        data = data.replace(/NaN/g, 'null'); // Replace NaN with null
        data = JSON.parse(data); // Parse the sanitized string into JSON
      }
  
      console.log("Food Details Response:", data);
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
      const foodWithData = {
        food: selectedFood.name,
        grams: parseInt(grams, 10),
        nutritionalData: selectedFood.calories || 0, // Default to 0 if calories are missing
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
              <th>Nutritional Info</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.map((item, index) => (
              <tr key={index}>
                <td>{item.food}</td>
                <td>{item.grams}</td>
                <td>
                  <pre>{JSON.stringify(item.nutritionalData, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FoodIntake;
