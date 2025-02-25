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

# Food logging functionality
@food_routes.route("/add-food-log", methods=["POST"])
@jwt_required()
def add_food_log():
    try:
        user_id = get_jwt_identity()
        try:
            user_id = ObjectId(user_id)
        except:
            return jsonify({"error": "Invalid user ID format"}), 400

        data = request.get_json()
        meal_time = data.get("mealTime")
        foods = data.get("foods", [])

        if not meal_time or not foods:
            return jsonify({"error": "Meal time and foods are required"}), 400

        meal_totals = {
            "calories": sum(food["calories"] for food in foods),
            "protein": sum(food["protein"] for food in foods),
            "fat": sum(food["fat"] for food in foods),
            "carbs": sum(food["carbs"] for food in foods)
        }

        today_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        food_logs_collection = mongo.db.food_logs
        existing_log = food_logs_collection.find_one({"userId": user_id, "date": today_date})

        if existing_log:
            food_logs_collection.update_one(
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
            return jsonify({"message": "Food log updated"}), 200
        else:
            new_food_log = {
                "userId": user_id,
                "date": today_date,
                "meals": [{"mealTime": meal_time, "foods": foods, "mealTotals": meal_totals}],
                "totalCaloriesForDay": meal_totals,
                "created_at": datetime.now(timezone.utc)
            }
            food_logs_collection.insert_one(new_food_log)
            return jsonify({"message": "Food log created"}), 201

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Get daily calories
@food_routes.route('/get-daily-calories', methods=['GET'])
@jwt_required()
def get_daily_calories():
    try:
        user_id = get_jwt_identity()
        profile_collection = mongo.db.profile_goals
        user_profile = profile_collection.find_one({"userId": user_id})

        if not user_profile:
            return jsonify({"error": "Profile not found"}), 404

        bmr = user_profile.get("bmr", 0)
        activity_level = user_profile.get("activityLevel", "moderate").lower()  # Default to "moderate"

        # Map activity level to a numeric multiplier
        activity_multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very active": 1.9
        }

        activity_multiplier = activity_multipliers.get(activity_level, 1.55)  # Default to moderate if not found

        goal = user_profile.get("weightGoal", "maintain").lower()
        tdee = bmr * activity_multiplier
        calorie_target = tdee + 500 if goal == "gain weight" else (tdee - 500 if goal == "lose weight" else tdee)

        return jsonify({
            "bmr": round(bmr, 2),
            "tdee": round(tdee, 2),
            "calorie_target": round(calorie_target, 2)
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
