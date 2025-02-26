from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
from datetime import datetime, timezone
from bson import ObjectId
from app import mongo

food_routes = Blueprint('food_routes', __name__)

# Load the CSV file into a DataFrame
try:
    df = pd.read_csv('app/data/nutrition_data.csv')
except FileNotFoundError:
    print("Error: nutrition_data.csv file not found!")
    df = pd.DataFrame()

# Fetch list of matching foods
@food_routes.route('/fetch-food-data', methods=['GET'])
@jwt_required()
def fetch_food_data():
    query = request.args.get('query', '')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    if df.empty:
        return jsonify({"error": "Food database is empty"}), 500

    filtered_foods = df[df['name'].str.contains(query, case=False, na=False)]
    return jsonify(filtered_foods.to_dict(orient='records'))

# Fetch detailed food information
@food_routes.route('/fetch-food-details/<int:fdcId>', methods=['GET'])
@jwt_required()
def fetch_food_details(fdcId):
    if df.empty:
        return jsonify({"error": "Food database is empty"}), 500

    if 'fdcId' not in df.columns:
        return jsonify({"error": "Food database missing 'fdcId' column"}), 500

    food_details = df[df["fdcId"] == fdcId]
    
    if not food_details.empty:
        return jsonify(food_details.iloc[0].to_dict())

    return jsonify({"error": "Food item not found"}), 404

def calculate_calorie_target(user_id):
    """
    Fetches user profile and calculates the calorie target based on BMR, activity level, and goal.
    """
    profile_collection = mongo.db.profile_goals
    user_profile = profile_collection.find_one({"userId": user_id})

    if not user_profile:
        return None, "User profile not found"

    bmr = user_profile.get("bmr", 0)
    
    # Ensure activityLevel is a string before calling .lower()
    activity_level = user_profile.get("activityLevel", "moderate")
    if not isinstance(activity_level, str):
        activity_level = "moderate"  # Default to "moderate" if it's not a string

    activity_multiplier = {
        "sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725, "very active": 1.9
    }.get(activity_level.lower(), 1.55)

    # Ensure weightGoal is also a string before calling .lower()
    goal = user_profile.get("weightGoal", "maintain")
    if not isinstance(goal, str):
        goal = "maintain"

    tdee = bmr * activity_multiplier
    calorie_target = tdee + 500 if goal.lower() == "gain weight" else (tdee - 500 if goal.lower() == "lose weight" else tdee)

    return {
        "bmr": round(bmr, 2),
        "tdee": round(tdee, 2),
        "calorie_target": round(calorie_target, 2)
    }, None



# Food logging functionality
@food_routes.route("/add-food-log", methods=["POST"])
@jwt_required()
def add_food_log():
    try:
        user_id = get_jwt_identity()
        
        # Ensure user_id is a valid ObjectId
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        except Exception:
            return jsonify({"error": "Invalid user ID format"}), 400

        data = request.get_json()
        meal_time = data.get("mealTime")
        foods = data.get("foods", [])

        # Validate input
        if not meal_time or not foods:
            return jsonify({"error": "Meal time and foods are required"}), 400

        # Calculate meal totals
        meal_totals = {
            "calories": sum(food.get("calories", 0) for food in foods),
            "protein": sum(food.get("protein", 0) for food in foods),
            "fat": sum(food.get("fat", 0) for food in foods),
            "carbs": sum(food.get("carbs", 0) for food in foods)
        }

        # Set today's date to 00:00 UTC
        today_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        food_logs_collection = mongo.db.food_logs
        existing_log = food_logs_collection.find_one({"userId": user_id, "date": today_date})

        if existing_log:
            # Append meal to existing log
            update_result = food_logs_collection.update_one(
                {"_id": existing_log["_id"]},
                {
                    "$push": {"meals": {"mealTime": meal_time, "foods": foods, "mealTotals": meal_totals}},
                    "$inc": {
                        "totalCaloriesForDay.calories": meal_totals["calories"],
                        "totalCaloriesForDay.protein": meal_totals["protein"],
                        "totalCaloriesForDay.fat": meal_totals["fat"],
                        "totalCaloriesForDay.carbs": meal_totals["carbs"]
                    }
                }
            )
            if update_result.modified_count == 0:
                return jsonify({"error": "Failed to update food log"}), 500

            updated_log = food_logs_collection.find_one({"_id": existing_log["_id"]})
        else:
            # Create new food log
            new_food_log = {
                "userId": user_id,
                "date": today_date,
                "meals": [{"mealTime": meal_time, "foods": foods, "mealTotals": meal_totals}],
                "totalCaloriesForDay": meal_totals,
                "created_at": datetime.now(timezone.utc)
            }
            insert_result = food_logs_collection.insert_one(new_food_log)
            if not insert_result.inserted_id:
                return jsonify({"error": "Failed to create food log"}), 500
            updated_log = new_food_log

        # Fetch calorie target
        calorie_data, error = calculate_calorie_target(user_id)
        if error:
            return jsonify({"error": error}), 404

        total_calories_consumed = updated_log["totalCaloriesForDay"]["calories"]
        calories_left = max(0, calorie_data["calorie_target"] - total_calories_consumed)

        return jsonify({
            "message": "Food log updated" if existing_log else "Food log created",
            "total_calories_consumed": round(total_calories_consumed, 2),
            "calories_left_for_day": round(calories_left, 2),
            "calorie_target": round(calorie_data["calorie_target"], 2)
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Get daily calories
@food_routes.route('/get-daily-calories', methods=['GET'])
@jwt_required()
def get_daily_calories():
    try:
        user_id = get_jwt_identity()
        
        if not user_id:
            return jsonify({"error": "User authentication failed"}), 401
        
        calorie_data, error = calculate_calorie_target(user_id)
        
        if error:
            return jsonify({"error": error}), 404

        # Fetch food logs for today
        today_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        food_logs_collection = mongo.db.food_logs
        food_log = food_logs_collection.find_one({"userId": ObjectId(user_id), "date": today_date})

        total_calories_consumed = food_log.get("totalCaloriesForDay", {}).get("calories", 0) if food_log else 0
        calories_left = max(0, calorie_data["calorie_target"] - total_calories_consumed)

        return jsonify({
            **calorie_data,
            "total_calories_consumed": round(total_calories_consumed, 2),
            "calories_left_for_day": round(calories_left, 2)
        }), 200

    except Exception as e: 
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
