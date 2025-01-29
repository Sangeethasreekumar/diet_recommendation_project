import requests
from decouple import config  # For loading .env variables

USDA_API_URL = config('USDA_API_URL')
USDA_API_KEY = config('USDA_API_KEY')

def fetch_food_data(query):
    """
    Fetch food nutritional data from the USDA API.
    """
    url = f"{USDA_API_URL}foods/search"
    params = {
        "query": query,
        "apiKey": USDA_API_KEY
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        return {"error": f"Failed to fetch data: {response.status_code}"}
