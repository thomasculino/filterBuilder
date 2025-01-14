from pymongo import MongoClient

# Connection to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["caltech_test_db"]  
collection = db["fake_documents"] 

# Insert multiple documents
collection.insert_many([
  {
    "rb": 0.5,  # that's an ML score telling you if that object we detected in the sky is real, or an artifact of the image
    "drb": 0.2, # same as the above, but uses a deep-learning model instead of a random forest
    "galactic_latitude": 5, # tells you how close to the galactic plane (our galaxy) that object is.
    "jd": 2460318.5, # that's the date of THIS detection of the object, in julian date format
    "jdstarthist": 2460314.5 # that's the date we detected this object for the FIRST time
  },
  {
    "rb": 0.5,
    "drb": 0.99, 
    "galactic_latitude": - 5,
    "jd": 2460318.5,
    "jdstarthist": 2460314.5
  },
  {
    "rb": 0.5,
    "drb": 0.99, 
    "galactic_latitude": 30,
    "jd": 2460318.5,
    "jdstarthist": 2460300.5
  },
  {
    "rb": 0.9,
    "drb": 0.8, 
    "galactic_latitude": 30,
    "jd": 2460318.5,
    "jdstarthist": 2460314.5
  }
])

print("Data inserted successfully!")
