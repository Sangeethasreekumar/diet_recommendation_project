from datetime import datetime, timezone

class ProfileGoals:
    def __init__(self, weight, height, age, gender, activityLevel, bmr=None, bmi=None, weightGoal="Not specified", 
                 dietType="Not specified", healthConditions=None, userId=None):
        self.weight = weight
        self.height = height
        self.age = age
        self.gender = gender
        self.activityLevel = activityLevel  # <-- Ensure this is stored
        self.bmr = bmr
        self.bmi = bmi
        self.weightGoal = weightGoal
        self.dietType = dietType
        self.healthConditions = healthConditions or []  # Default to empty list if None
        self.userId = userId
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def to_dict(self):
        """Convert the model to a dictionary for MongoDB insertion"""
        return {
            "weight": self.weight,
            "height": self.height,
            "age": self.age,
            "gender": self.gender,
            "activityLevel": float(self.activityLevel),  # Ensure it’s a float
            "bmr": self.bmr,
            "bmi": self.bmi,  # <-- Make sure this is also included
            "goals": {
                "weightGoal": self.weightGoal,
                "dietType": self.dietType,
                "healthConditions": self.healthConditions,
            },
            "userId": self.userId,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
