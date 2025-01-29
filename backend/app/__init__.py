from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

app.config.from_object('app.config')
# MongoDB Configuration
app.config['MONGO_URI'] = os.getenv('MONGO_URI')  # Load Mongo URI from .env file
mongo = PyMongo(app)

# Import routes after setting up app and MongoDB
from app.routes.submit_data import submit_data_blueprint

from app.routes.food_routes import food_routes



app.register_blueprint(food_routes)  # Register the food_routes blueprint
app.register_blueprint(submit_data_blueprint)  # Register the submit_data blueprint


if __name__ == "__main__":
    app.run(debug=True)
