from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
from datetime import datetime, timezone
from bson import ObjectId
from app import mongo

# Define the Blueprint
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
    foods = filtered_foods.to_dict(orient='records')
    
    return jsonify(foods)

# Fetch detailed food information
@food_routes.route('/fetch-food-details/<int:fdcId>', methods=['GET'])
@jwt_required()
def fetch_food_details(fdcId):
    if df.empty:
        return jsonify({"error": "Food database is empty"}), 500
    
    food_details = df[df.get('fdcId', pd.Series()) == fdcId]
    
    if not food_details.empty:
        return jsonify(food_details.iloc[0].to_dict())
    
    return jsonify({"error": "Food item not found"}), 404

# Food logging functionality
@food_routes.route("/add-food-log", methods=["POST"])
@jwt_required()
def add_food_log():
    try:
        user_id = ObjectId(get_jwt_identity())
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
        
        today_date = datetime.combine(datetime.now(timezone.utc).date(), datetime.min.time())

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
