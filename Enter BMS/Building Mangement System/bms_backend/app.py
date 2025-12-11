from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
import datetime
import os

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
app.config["JWT_SECRET_KEY"] = "bms-secret-key"
jwt = JWTManager(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- MODELS (Matching your bms.py classes) ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100)) # "Head Member"
    email = db.Column(db.String(100), unique=True)
    password_hash = db.Column(db.String(200))
    role = db.Column(db.String(20), default='resident') 
#ok
    # Extra fields from your Family class
    phone = db.Column(db.String(20))
    nid = db.Column(db.String(50))
    members_count = db.Column(db.Integer)

    
    apartment = db.relationship('Apartment', backref='resident', uselist=False)

class Apartment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    unit_number = db.Column(db.String(10), unique=True, nullable=False) # e.g. "1A"
    floor = db.Column(db.Integer)
    resident_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=True)

class Notice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)

# --- AUTH ROUTES ---

@app.route('/login', methods=['POST'])
def login():
    """Unified login logic like your main() function."""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        # Successful login
        token = create_access_token(identity=user.email)
        return jsonify({
            "status": "success", 
            "token": token, 
            "role": user.role,
            "full_name": user.full_name
        })

    return jsonify({"status": "error", "message": "Invalid Email or Password"}), 401


# --- API ROUTES ---

@app.route("/api/user_info", methods=['GET'])
@jwt_required()
def get_user_info():
    """Returns details for the logged-in user (Admin or Family)."""
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    
    flat_no = "Not Assigned"
    if user.apartment:
        flat_no = user.apartment.unit_number

    return jsonify({
        "status": "success",
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "nid": user.nid,
        "members": user.members_count,
        "flat_no": flat_no,
        "role": user.role
    })

@app.route("/api/notices", methods=['GET'])
def get_notices():
    """Returns list of notices."""
    notices = Notice.query.order_by(Notice.created_at.desc()).all()
    output = [{
        "id": n.id,
        "title": n.title, 
        "content": n.content, 
        "date_posted": n.created_at.strftime("%Y-%m-%d")
    } for n in notices]
    return jsonify({"status": "success", "notices": output})

# --- ADMIN ROUTES ---

@app.route("/api/admin/add_family", methods=['POST'])
@jwt_required()
def add_family():
    """
    Admin feature: Creates a new Family User AND assigns them to a flat.
    Matches the 'Add New Family' option in your console menu.
    """
    # 1. Security Check
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    
    # 2. Check if Flat exists and is empty
    flat_no = data.get('flat_no').upper()
    apartment = Apartment.query.filter_by(unit_number=flat_no).first()
    
    if not apartment:
        return jsonify({"message": f"Flat {flat_no} does not exist."}), 404
    if apartment.resident_id:
        return jsonify({"message": f"Flat {flat_no} is already occupied."}), 400
    
    # 3. Check if email is taken
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({"message": "Email already registered."}), 409

    # 4. Create the User (Family)
    new_user = User(
        full_name=data.get('head_member'),
        email=data.get('email'),
        password_hash=generate_password_hash(data.get('password')),
        phone=data.get('phone'),
        nid=data.get('nid'),
        members_count=data.get('members'),
        role='resident'
    )
    
    db.session.add(new_user)
    db.session.commit() # Commit first to get the ID

    # 5. Assign to Flat
    apartment.resident_id = new_user.id
    db.session.commit()

    return jsonify({"status": "success", "message": f"Family added to Flat {flat_no}!"})

@app.route("/api/admin/notices", methods=['POST'])
@jwt_required()
def post_notice():
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.json
    new_notice = Notice(title=data['title'], content=data['content'])
    db.session.add(new_notice)
    db.session.commit()
    return jsonify({"status": "success", "message": "Notice posted"})

@app.route("/api/apartments/vacant", methods=['GET'])
def get_vacant_flats():
    """Returns list of all empty flats (like view_vacant_flats in bms.py)."""
    vacant = Apartment.query.filter_by(resident_id=None).all()
    flats = [apt.unit_number for apt in vacant]
    # Sort them nicely (1A, 1B, 2A...)
    flats.sort()
    return jsonify({"status": "success", "vacant_apartments": flats})


# --- SETUP (Seeds the DB) ---
def seed_database():
    """Creates the building structure and default admin."""
    if not Apartment.query.first():
        print("Creating Building Flats...")
        # Create 5 floors, 2 units per floor (A and B) like your console logic
        floors = 5
        units = ['A', 'B']
        for f in range(1, floors + 1):
            for u in units:
                unit_num = f"{f}{u}"
                db.session.add(Apartment(unit_number=unit_num, floor=f))
        db.session.commit()

    if not User.query.filter_by(role='admin').first():
        print("Creating Default Admin...")
        admin = User(
            full_name="System Admin",
            email="admin@bms.com",
            password_hash=generate_password_hash("admin123"),
            role="admin"
        )
        db.session.add(admin)
        db.session.commit()

# --- NEW ADMIN ROUTES (Add these to app.py) ---

@app.route("/api/admin/users", methods=['GET'])
@jwt_required()
def get_all_residents():
    """Fetches a list of all registered families/residents."""
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403

    residents = User.query.filter_by(role='resident').all()
    output = []
    for r in residents:
        flat = "Not Assigned"
        if r.apartment:
            flat = r.apartment.unit_number
        
        output.append({
            "id": r.id,
            "name": r.full_name,
            "email": r.email,
            "phone": r.phone,
            "flat_no": flat,
            "members": r.members_count
        })
    return jsonify({"status": "success", "residents": output})

@app.route("/api/admin/user/<int:user_id>", methods=['DELETE'])
@jwt_required()
def remove_family(user_id):
    """Removes a family from the system."""
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403

    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({"message": "User not found"}), 404

    # If they are in an apartment, empty the apartment first
    if user_to_delete.apartment:
        user_to_delete.apartment.resident_id = None
    
    db.session.delete(user_to_delete)
    db.session.commit()
    return jsonify({"status": "success", "message": "Family removed successfully"})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_database()
    app.run(port=5000, debug=True)