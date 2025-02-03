from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager
from app import mongo
from datetime import datetime, timezone

bcrypt = Bcrypt()
auth_routes = Blueprint("auth_routes", __name__)

# Initialize JWT Manager (make sure you've set JWT_SECRET_KEY in your app config)
jwt = JWTManager()

# User Registration (Sign-up)
@auth_routes.route("/signup", methods=["POST", "GET"])
def signup():
    if request.method == 'GET':
        # Handle GET requests (e.g., return an example or status)
        return jsonify({"message": "Submit data route is working. Use POST to send data."}), 200
    if request.method == 'POST':
        data = request.json
        users_collection = mongo.db["user_credentials"]
        # Check if email already exists
        if users_collection.find_one({"email": data["email"]}):
            return jsonify({"error": "Email already exists"}), 400
        hashed_password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
        user = {
            "name": data["name"],
            "email": data["email"],
            "password": hashed_password,
            "created_at":  datetime.now(timezone.utc)
        }
        users_collection.insert_one(user)
        return jsonify({"message": "User registered successfully"}), 201

# User Login (with JWT)
# User Login (with JWT)
@auth_routes.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return jsonify({"message": "Login endpoint is working. Use POST to login."}), 200
    if request.method == "POST":
        try:
            data = request.json
            if not data or "name" not in data or "password" not in data:
                return jsonify({"error": "Missing 'name' or 'password' field"}), 400

            users_collection = mongo.db["user_credentials"]

            # Check if the user exists
            user = users_collection.find_one({"name": data["name"]})

            if not user:
                return jsonify({"error": "User not found"}), 404

            # Verify password
            if not bcrypt.check_password_hash(user["password"], data["password"]):
                return jsonify({"error": "Invalid password"}), 401

            # Create a JWT token with the user_id as the identity (as a string)
            access_token = create_access_token(identity=str(user["_id"]))  # Pass user ID as string
            return jsonify({"message": "Login successful", "access_token": access_token}), 200

        except Exception as e:
            current_app.logger.error(f"Login error: {str(e)}")  # Logs the error
            return jsonify({"error": "Internal Server Error", "details": str(e)}), 500



# User Logout (Handled on client-side by removing token)
@auth_routes.route("/logout", methods=["POST"])
@jwt_required()  # JWT is required to access this route
def logout():
    return jsonify({"message": "Logout successful. Remove token on client-side."}), 200
