from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId, json_util

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017")
db = client["caltech_test_db"]
collection = db["fake_documents"]
filters_collection = db["filters"]

@app.route("/run-query", methods=["POST"])
def run_query():
    """
    Executes a MongoDB query or aggregation pipeline based on the request data.
    
    Returns:
        JSON response containing the query results or an error message.
    """
    try:
        data = request.json
        pipeline = data.get("query", [])
        is_aggregation = data.get("isAggregation", False)

        if is_aggregation:
            # Execute aggregation pipeline
            results = list(collection.aggregate(pipeline))
        else:
            # Fallback to find query if not aggregation
            results = list(collection.find(pipeline[0]["$match"] if pipeline else {}))

        # Convert ObjectIds to strings and handle MongoDB specific types
        return json_util.dumps({"results": results})
    except Exception as e:
        print(f"Query error: {str(e)}")  # Add logging
        return jsonify({"error": str(e)}), 500

@app.route("/save-filter", methods=["POST"])
def save_filter():
    """
    Saves a new filter to the database.
    
    Returns:
        JSON response indicating success or an error message.
    """
    try:
        filter_data = request.json
        # Check for duplicate filter names
        if filters_collection.find_one({"label": filter_data["label"]}):
            return jsonify({"error": "Filter name already exists"}), 400
            
        # Insert the filter
        result = filters_collection.insert_one(filter_data)
        return jsonify({
            "success": True,
            "id": str(result.inserted_id)
        })
    except Exception as e:
        print(f"Save error: {str(e)}")  # Add logging
        return jsonify({"error": str(e)}), 500

@app.route("/get-filters", methods=["GET"])
def get_filters():
    """
    Retrieves all saved filters from the database.
    
    Returns:
        JSON response containing the list of filters or an error message.
    """
    try:
        filters = list(filters_collection.find())
        return json_util.dumps(filters)
    except Exception as e:
        print(f"Get filters error: {str(e)}")  # Add logging
        return jsonify({"error": str(e)}), 500

@app.route("/get-filter/<filter_id>", methods=["GET"])
def get_filter(filter_id):
    """
    Retrieves a specific filter by its ID.
    
    Args:
        filter_id (str): The ID of the filter to retrieve.
    
    Returns:
        JSON response containing the filter data or an error message.
    """
    try:
        filter_data = filters_collection.find_one({"_id": ObjectId(filter_id)})
        if not filter_data:
            return jsonify({"error": "Filter not found"}), 404
        return json_util.dumps(filter_data)
    except Exception as e:
        print(f"Get filter error: {str(e)}")  # Add logging
        return jsonify({"error": str(e)}), 500
    
@app.route("/delete-filter/<filter_id>", methods=["DELETE"])
def delete_filter(filter_id):
    """
    Deletes a specific filter by its ID.
    
    Args:
        filter_id (str): The ID of the filter to delete.
    
    Returns:
        JSON response indicating success or an error message.
    """
    try:
        result = filters_collection.delete_one({"_id": ObjectId(filter_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Filter not found"}), 404
        return jsonify({"success": True})
    except Exception as e:
        print(f"Delete error: {str(e)}")  # Add logging
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
