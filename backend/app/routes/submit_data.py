from flask import Blueprint, Flask, request, jsonify
from app import app, mongo 
from app.models.profile import ProfileGoals
from flask_jwt_extended import jwt_required ,get_jwt_identity

submit_data_blueprint = Blueprint('submit_data', __name__)  # Rename the blueprint variable to avoid conflicts

@submit_data_blueprint.route('/submit-data', methods=['GET', 'POST'])
@jwt_required()
def submit_data():
    if request.method == 'GET':
        return jsonify({"message": "Submit data route is working. Use POST to send data."}), 200
    
    if request.method == 'POST':
        try:
            user_id = get_jwt_identity()  # This should be a string (the MongoDB _id as string)
            print("User ID from JWT:", user_id)  # Debugging
            
            if not user_id:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Get the JSON data from the request
            data = request.get_json()

            # Validate required fields
            required_fields = ["weight", "height", "age", "gender"]
            if not all(field in data for field in required_fields):
                return jsonify({"error": "Missing required fields: weight, height, age, or gender"}), 400

            # Extract user data
            weight = data["weight"]
            height = data["height"]
            age = data["age"]
            gender = data["gender"].lower()  # Convert to lowercase for consistency

            # **Calculate BMR using Mifflin-St Jeor Equation**
            if gender == "male":
                bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
            elif gender == "female":
                bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
            else:
                return jsonify({"error": "Invalid gender. Must be 'Male' or 'Female'."}), 400

            # Calculate BMI
            bmi = weight / ((height / 100) ** 2)  # BMI formula: weight (kg) / height (m)^2

            # Create ProfileGoals object
            user_data = ProfileGoals(
                weight=weight,
                height=height,
                age=age,
                gender=gender,
                bmr=bmr,  # Store calculated BMR
                weightGoal=data.get("weightGoal", "Not specified"),
                dietType=data.get("dietType", "Not specified"),
                healthConditions=data.get("healthConditions", []),
                userId=user_id  # User ID directly from JWT
            )

            # Convert the ProfileGoals object to a dictionary for MongoDB insertion
            user_dict = user_data.to_dict()

            # Insert profile goals into MongoDB collection
            profile_collection = mongo.db.profile_goals
            result = profile_collection.insert_one(user_dict)

            # Return success response with BMI, BMR, and profile ID
            return jsonify({
                "message": "Profile data submitted successfully",
                "bmi": round(bmi, 2),
                "bmr": round(bmr, 2),
                "profileId": str(result.inserted_id)  # Return the inserted profile's ID
            }), 201

        except Exception as e:
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500
