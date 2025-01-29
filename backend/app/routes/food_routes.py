from flask import Blueprint, request, jsonify
import pandas as pd

# Define the Blueprint
food_routes = Blueprint('food_routes', __name__)

# Load the CSV file into a DataFrame
# Replace 'food_data.csv' with the path to your CSV file
df = pd.read_csv('app/data/nutrition_data.csv')
print(df.head())

# Fetch list of matching foods
@food_routes.route('/fetch-food-data', methods=['GET'])
def fetch_food_data():
    query = request.args.get('query', '')  # Get search query
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    # Filter rows where the food name contains the query (case-insensitive)
    filtered_foods = df[df['name'].str.contains(query, case=False, na=False)]

    print(f"Query: {query}")
    print(f"Filtered foods: {filtered_foods[['fdcId', 'name']].head()}")  # Check name column

    # Convert the filtered rows to a list of dictionaries
    foods = filtered_foods.to_dict(orient='records')

    return jsonify(foods)

# Fetch detailed food information using a unique identifier (e.g., food_id)
@food_routes.route('/fetch-food-details/<int:fdcId>', methods=['GET'])
def fetch_food_details(fdcId):
    # Filter the DataFrame by the given food_id
    food_details = df[df['fdcId'] == fdcId]

    if not food_details.empty:
        # Convert the row to a dictionary and return it
        return jsonify(food_details.iloc[0].to_dict())
    else:
        return jsonify({"error": "Food item not found"}), 404
