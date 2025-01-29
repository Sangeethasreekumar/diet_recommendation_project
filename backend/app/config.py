from decouple import config

# Configuration for USDA API
USDA_API_URL = config('USDA_API_URL')
USDA_API_KEY = config('USDA_API_KEY')

# MongoDB URI (If required)
MONGO_URI = config('MONGO_URI')
