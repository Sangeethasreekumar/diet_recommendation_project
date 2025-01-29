from flask import Blueprint, Flask, request, jsonify
from app import app, mongo  # Assuming you have app and mongo defined in app.py
# from app.config import  USDA_API_KEY

submit_data_blueprint = Blueprint('submit_data', __name__)  # Rename the blueprint variable to avoid conflicts

@submit_data_blueprint.route('/submit-data',methods=['GET', 'POST'])
def submit_data():
    if request.method == 'GET':
         # Log a message without exposing the API key
        app.logger.info("Submit data route accessed.") 
        # Handle GET requests (e.g., return an example or status)
        return jsonify({"message": "Submit data route is working. Use POST to send data."}), 200
    
    if request.method == 'POST':
        try:
            # Get the JSON data from the request
            data = request.get_json()

            # Validate required fields
            if not data or not data.get("weight") or not data.get("height") or not data.get("food_calories"):
                return jsonify({"error": "Missing required fields: weight, height, or food_calories"}), 400

            # Ensure food_calories is a dictionary and not empty
            if not isinstance(data["food_calories"], dict) or not data["food_calories"]:
                return jsonify({"error": "food_calories must be a non-empty dictionary"}), 400

            # Extract user data from the request
            user_data = {
                "weight": data["weight"],  # Required field
                "height": data["height"],  # Required field
                "goal": data.get("goal", "Not specified"),  # Optional field with default value
                "preference": data.get("preference", "Not specified"),  # Optional field with default value
                "health_issues": data.get("health_issues", "None"),  # Optional field with default value
                "food_calories": data["food_calories"],  # Required field
            }

            # Check if height is valid to avoid division by zero or invalid values
            if user_data["height"] <= 0:
                return jsonify({"error": "Height must be greater than 0"}), 400

            # Calculate BMI
            weight = user_data["weight"]
            height_meters = user_data["height"] / 100  # Convert height from cm to meters
            bmi = weight / (height_meters ** 2)  # BMI formula: weight (kg) / height (m)^2

            # Calculate total calorie intake
            total_calories = sum(user_data["food_calories"].values())  # Sum the calorie values
            calorie_limit = 2000  # This can be customized based on user's goal and other data
            within_limit = total_calories <= calorie_limit

            # Save user data into MongoDB
            user_collection = mongo.db.profile_goals
            user_collection.insert_one(user_data)

            # Return the BMI and whether the calorie intake is within the limit
            return jsonify({
                "bmi": bmi,
                "within_limit": within_limit
            }), 200  # HTTP Status Code 200 (OK)

        except Exception as e:
            # Handle unexpected errors
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500  # Internal Server Error

