from flask import Flask
from flask_jwt_extended import JWTManager
from flask_pymongo import PyMongo
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)


# Set up JWT secret key from environment variable
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  # This will load from .env file

# Initialize JWTManager for handling JWTs
jwt = JWTManager(app)

app.config.from_object('app.config')
# MongoDB Configuration
app.config['MONGO_URI'] = os.getenv('MONGO_URI')  # Load Mongo URI from .env file
mongo = PyMongo(app)


from app.routes.submit_data import submit_data_blueprint
from app.routes.food_routes import food_routes
from app.routes.auth_routes import auth_routes
# from app.routes.food_logs import food_logs_blueprint


app.register_blueprint(auth_routes)
# app.register_blueprint(food_logs_blueprint)
app.register_blueprint(food_routes)  # Register the food_routes blueprint
app.register_blueprint(submit_data_blueprint)  # Register the submit_data blueprint


if __name__ == "__main__":
    app.run(debug=True)
