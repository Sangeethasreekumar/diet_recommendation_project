from flask import Blueprint, request, jsonify
from app import mongo
from app.models.profile import ProfileGoals
from flask_jwt_extended import jwt_required, get_jwt_identity

submit_data_blueprint = Blueprint('submit_data', __name__)

@submit_data_blueprint.route('/submit-data', methods=['POST'])
@jwt_required()
def submit_data():
    try:
        user_id = get_jwt_identity()
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        data = request.get_json()

        # Validate required fields
        required_fields = ["weight", "height", "age", "gender", "activityLevel"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Extract user data
        weight = float(data["weight"])
        height = float(data["height"])
        age = int(data["age"])
        gender = data["gender"].lower()
        activity_level = float(data["activityLevel"])  # Ensure it's a float

        # Prevent duplicate profiles
        profile_collection = mongo.db.profile_goals
        existing_profile = profile_collection.find_one({"userId": user_id})

        if existing_profile:
            return jsonify({"error": "Profile already exists. Use update-profile instead."}), 400

        # **Calculate BMR using Mifflin-St Jeor Equation**
        if gender == "male":
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
        elif gender == "female":
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
        else:
            return jsonify({"error": "Invalid gender. Must be 'Male' or 'Female'."}), 400

        bmr *= activity_level  # Adjust BMR based on activity level

        # Calculate BMI
        bmi = weight / ((height / 100) ** 2)

        # Create ProfileGoals object
        user_data = ProfileGoals(
            weight=weight,
            height=height,
            age=age,
            gender=gender,
            activityLevel=activity_level,
            bmr=bmr,
            bmi=bmi,
            weightGoal=data.get("weightGoal", "Not specified"),
            dietType=data.get("dietType", "Not specified"),
            healthConditions=data.get("healthConditions", []),
            userId=user_id
        )

        # Insert profile into MongoDB
        user_dict = user_data.to_dict()
        result = profile_collection.insert_one(user_dict)

        return jsonify({
            "message": "Profile data submitted successfully",
            "bmi": round(bmi, 2),
            "bmr": round(bmr, 2),
            "profileId": str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@submit_data_blueprint.route('/get-profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        profile_collection = mongo.db.profile_goals
        user_profile = profile_collection.find_one({"userId": user_id})

        if not user_profile:
            return jsonify({"error": "Profile not found"}), 404

        user_profile["_id"] = str(user_profile["_id"])  # Convert ObjectId to string
        return jsonify(user_profile), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@submit_data_blueprint.route('/update-profile', methods=['POST'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        required_fields = ["weight", "height", "age", "gender", "activityLevel"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Extract user data
        weight = float(data["weight"])
        height = float(data["height"])
        age = int(data["age"])
        gender = data["gender"].lower()
        activity_level = float(data["activityLevel"])

        # **Recalculate BMR & BMI**
        if gender == "male":
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
        elif gender == "female":
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
        else:
            return jsonify({"error": "Invalid gender. Must be 'Male' or 'Female'."}), 400

        bmr *= activity_level  # Adjust based on activity level
        bmi = weight / ((height / 100) ** 2)

        profile_collection = mongo.db.profile_goals
        updated_data = {
            "$set": {
                "weight": weight,
                "height": height,
                "age": age,
                "gender": gender,
                "activityLevel": activity_level,
                "bmr": bmr,
                "bmi": bmi,
                "goals": {  # Update inside "goals" instead of separate fields
                    "weightGoal": data.get("weightGoal", "Not specified"),
                    "dietType": data.get("dietType", "Not specified"),
                    "healthConditions": data.get("healthConditions", [])
                        },
                    }
                        }


        result = profile_collection.update_one({"userId": user_id}, updated_data)

        if result.matched_count == 0:
            return jsonify({"error": "Profile not found"}), 404

        return jsonify({
            "message": "Profile updated successfully",
            "bmi": round(bmi, 2),
            "bmr": round(bmr, 2)
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
