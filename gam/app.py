import os
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import subprocess
import sys
import time
import json
from jinja2 import Template
from functools import wraps

app = Flask(__name__, static_folder='.')
CORS(app)

GAM_PATH = "/Users/fung/bin/gamadv-xtd3/gam"

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to config.json
config_path = os.path.join(script_dir, 'config.json')

# Load the configuration
with open(config_path, 'r') as f:
    config = json.load(f)


# Replace the hardcoded USERNAME and PASSWORD with environment variables
USERNAME = os.environ.get('GAM_ADMIN_USERNAME')
PASSWORD = os.environ.get('GAM_ADMIN_PASSWORD')

# Add a check to ensure the environment variables are set
if not USERNAME or not PASSWORD:
    raise ValueError("GAM_ADMIN_USERNAME and GAM_ADMIN_PASSWORD environment variables must be set")


def check_auth(username, password):
    return username == USERNAME and password == PASSWORD

def authenticate():
    return Response(
        'Could not verify your access level for that URL.\n'
        'You have to login with proper credentials', 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'}
    )

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

def run_gam_command(command):
    try:
        full_command = f"{GAM_PATH} {command}"
        print(f"Executing command: {full_command}")  # Debug print
        result = subprocess.run(full_command, shell=True, capture_output=True, text=True, check=True)
        print(f"Command output: {result.stdout}")  # Debug print
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Command error: {e.stderr}")  # Debug print
        return f"Error: {e.stderr}"
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug print
        return f"Unexpected error: {str(e)}"

# Apply @requires_auth to all routes
@app.route('/')
@requires_auth
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
@requires_auth
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/config')
@requires_auth
def get_config():
    return jsonify(config)

@app.route('/api/execute', methods=['POST'])
@requires_auth
def execute_command():
    data = request.json
    section_name = data.get('section')
    option_name = data.get('option')
    fields = {k: v for k, v in data.get('fields', {}).items() if v}  # Remove empty fields

    print(f"Executing command: {section_name} - {option_name}")  # Debug print
    print(f"Fields: {fields}")  # Debug print

    for section in config['sections']:
        if section['name'] == section_name:
            for option in section['options']:
                if option['name'] == option_name:
                    command_template = option['command']
                    template = Template(command_template)
                    command = template.render(**fields)
                    print(f"Rendered command: {command}")  # Debug print
                    result = run_gam_command(command)
                    return jsonify({"message": result})

    return jsonify({"error": "Invalid section or option"}), 400

@app.route('/api/checkClassId', methods=['POST'])
@requires_auth
def check_class_id():
    data = request.json
    class_name = data.get('className')

    if not class_name:
        return jsonify({"error": "Invalid input"}), 400

    full_command = f"{GAM_PATH} print classes | awk -F',' '/{class_name}/ {{print $1}}'"
    
    try:
        print(f"Executing command: {full_command}")  # Debug print
        result = subprocess.run(full_command, shell=True, capture_output=True, text=True, check=True)
        output = result.stdout.strip()
        print(f"Command output: {output}")  # Debug print
        
        if output:
            return jsonify({"message": f"Class ID(s) for '{class_name}':\n{output}"})
        else:
            return jsonify({"message": f"No classes found with the name: {class_name}"})
    except subprocess.CalledProcessError as e:
        print(f"Command error: {e.stderr}")  # Debug print
        return jsonify({"error": f"Error executing command: {e.stderr}"}), 500
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug print
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

if __name__ == '__main__':
    # Run the app with HTTPS
    app.run(debug=True, host='0.0.0.0', ssl_context='adhoc')