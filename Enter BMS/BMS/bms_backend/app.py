import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS, cross_origin
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from flask_socketio import SocketIO, emit
import datetime
import os
import secrets

app = Flask(__name__)

# --- 1. CORS CONFIGURATION ---
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# --- CONFIGURATION ---
# FIX #4: JWT secret key now comes from environment variable
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", secrets.token_hex(32))
jwt = JWTManager(app)

# --- POSTGRESQL/SQLITE CONFIGURATION ---
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users_local.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# --- MODELS ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password_hash = db.Column(db.String(200))
    role = db.Column(db.String(20), default='resident')
    phone = db.Column(db.String(20))
    nid = db.Column(db.String(50))
    members_count = db.Column(db.Integer)
    must_change_password = db.Column(db.Boolean, default=True)  # FIX #5: force password reset
    apartment = db.relationship('Apartment', backref='resident', uselist=False)

class Apartment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    unit_number = db.Column(db.String(10), unique=True, nullable=False)
    floor = db.Column(db.Integer)
    resident_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=True)

class Notice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    # FIX #1: use utcnow for consistent timezone-aware timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class PrivateNotice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)  # FIX #1

class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # FIX #7: track real user
    submitted_by = db.Column(db.String(100))
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)  # FIX #1

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender = db.Column(db.String(100))
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # FIX #9: track real sender
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)  # FIX #1


# --- AUTH ROUTES ---
@app.route('/login', methods=['POST', 'OPTIONS'])
@cross_origin()
def login():
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400  # FIX #3: input validation

    email = data.get('email')
    password = data.get('password')

    if not email or not password:  # FIX #3: input validation
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        token = create_access_token(identity=user.email)
        return jsonify({
            "status": "success",
            "token": token,
            "role": user.role,
            "full_name": user.full_name,
            "user_id": user.id,
            "must_change_password": user.must_change_password  # FIX #5: notify frontend
        })
    return jsonify({"status": "error", "message": "Invalid Email or Password"}), 401


@app.route("/api/change_password", methods=['POST'])
@jwt_required()
def change_password():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    data = request.json

    if not data or not data.get('old_password') or not data.get('new_password'):  # FIX #3
        return jsonify({"message": "old_password and new_password are required"}), 400

    if not check_password_hash(user.password_hash, data.get('old_password')):
        return jsonify({"message": "Incorrect old password"}), 401

    user.password_hash = generate_password_hash(data.get('new_password'))
    user.must_change_password = False  # FIX #5: clear the flag after password is changed
    db.session.commit()
    return jsonify({"status": "success", "message": "Password updated successfully"})


# --- API ROUTES ---
@app.route("/api/user_info", methods=['GET'])
@jwt_required()
def get_user_info():
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
        "role": user.role,
        "must_change_password": user.must_change_password  # FIX #5
    })

@app.route("/api/stats", methods=['GET'])
def get_stats():
    total_flats = Apartment.query.count()
    vacant_flats = Apartment.query.filter_by(resident_id=None).count()
    occupied_flats = total_flats - vacant_flats
    total_notices = Notice.query.count()
    total_complaints = Complaint.query.count()
    pending_complaints = Complaint.query.filter_by(status='Pending').count()
    resolved_complaints = Complaint.query.filter_by(status='Resolved').count()
    return jsonify({
        "flats": {"total": total_flats, "occupied": occupied_flats, "vacant": vacant_flats},
        "notices": total_notices,
        "complaints": {"total": total_complaints, "pending": pending_complaints, "resolved": resolved_complaints}
    })


# --- NOTICE ROUTES ---
@app.route("/api/notices", methods=['GET'])
def get_notices():
    notices = Notice.query.order_by(Notice.created_at.desc()).all()
    output = [{"id": n.id, "title": n.title, "content": n.content, "date_posted": n.created_at.strftime("%Y-%m-%d")} for n in notices]
    return jsonify(output)

@app.route("/api/notices/<int:id>", methods=['DELETE'])
@jwt_required()
def delete_notice(id):
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403
    # FIX #2: use db.session.get() instead of deprecated Query.get()
    notice = db.session.get(Notice, id)
    if notice:
        db.session.delete(notice)
        db.session.commit()
        return jsonify({"status": "success", "message": "Notice deleted"})
    return jsonify({"message": "Notice not found"}), 404


# --- PRIVATE NOTICE ROUTES ---
@app.route("/api/admin/private_notice", methods=['POST'])
@jwt_required()
def send_private_notice():
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    # FIX #3: input validation
    if not data or not data.get('user_id') or not data.get('title') or not data.get('content'):
        return jsonify({"message": "user_id, title, and content are required"}), 400

    new_notice = PrivateNotice(
        user_id=data.get('user_id'),
        title=data.get('title'),
        content=data.get('content')
    )
    db.session.add(new_notice)
    db.session.commit()
    return jsonify({"status": "success", "message": "Private notice sent!"})

@app.route("/api/my_private_notices", methods=['GET'])
@jwt_required()
def get_my_private_notices():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    notices = PrivateNotice.query.filter_by(user_id=user.id).order_by(PrivateNotice.created_at.desc()).all()
    output = [{"id": n.id, "title": n.title, "content": n.content, "date": n.created_at.strftime("%Y-%m-%d")} for n in notices]
    return jsonify(output)


# --- COMPLAINT ROUTES ---
@app.route("/api/complaints", methods=['GET'])
@jwt_required()
def get_complaints():
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    # FIX #7: residents only see their own complaints; admins see all
    if current_user.role == 'admin':
        complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    else:
        complaints = Complaint.query.filter_by(user_id=current_user.id).order_by(Complaint.created_at.desc()).all()
    output = [
        {
            "id": c.id,
            "submitted_by": c.submitted_by,
            "subject": c.subject,
            "description": c.description,
            "status": c.status,
            "date": c.created_at.strftime("%Y-%m-%d")
        } for c in complaints
    ]
    return jsonify(output)

@app.route("/api/complaints", methods=['POST'])
@jwt_required()
def post_complaint():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    data = request.json
    # FIX #3: input validation
    if not data or not data.get('subject') or not data.get('description'):
        return jsonify({"message": "subject and description are required"}), 400

    new_complaint = Complaint(
        user_id=user.id,  # FIX #7: store real user_id
        submitted_by=user.full_name,
        subject=data.get('subject'),
        description=data.get('description')
    )
    db.session.add(new_complaint)
    db.session.commit()
    return jsonify({"status": "success", "message": "Complaint submitted"})

@app.route("/api/complaints/<int:id>", methods=['PUT'])
@jwt_required()
def update_complaint(id):
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403
    # FIX #2: use db.session.get() instead of deprecated Query.get()
    complaint = db.session.get(Complaint, id)
    if not complaint:
        return jsonify({"message": "Complaint not found"}), 404
    data = request.json
    complaint.status = data.get('status', 'Resolved')
    db.session.commit()
    return jsonify({"status": "success", "message": f"Complaint marked as {complaint.status}"})

@app.route("/api/messages", methods=['GET'])
@jwt_required()
def get_messages():
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    messages = ChatMessage.query.order_by(ChatMessage.timestamp.asc()).limit(50).all()
    output = []
    for m in messages:
        # FIX #8: determine sent/received based on actual sender identity
        msg_type = "sent" if m.sender_id == current_user.id else "received"
        output.append({"id": m.id, "sender": m.sender, "text": m.text, "type": msg_type})
    return jsonify(output)


# --- ADMIN ROUTES ---
@app.route("/api/admin/add_family", methods=['POST'])
@jwt_required()
def add_family():
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    # FIX #3: input validation
    required_fields = ['flat', 'first_name', 'last_name', 'phone', 'nid', 'members']
    if not data or not all(data.get(f) for f in required_fields):
        return jsonify({"message": f"Missing required fields: {', '.join(required_fields)}"}), 400

    flat_no = data.get('flat').upper()
    apartment = Apartment.query.filter_by(unit_number=flat_no).first()
    if not apartment:
        return jsonify({"message": f"Flat {flat_no} does not exist."}), 404
    if apartment.resident_id:
        return jsonify({"message": f"Flat {flat_no} is already occupied."}), 400

    generated_email = f"{flat_no.lower()}@bms.com"
    if User.query.filter_by(email=generated_email).first():
        return jsonify({"message": "Flat account already exists."}), 409

    full_name = f"{data.get('first_name')} {data.get('last_name')}"

    # FIX #5: generate a stronger random default password instead of "123456"
    default_pw = secrets.token_urlsafe(10)

    new_user = User(
        full_name=full_name,
        email=generated_email,
        password_hash=generate_password_hash(default_pw),
        phone=data.get('phone'),
        nid=data.get('nid'),
        members_count=data.get('members'),
        role='resident',
        must_change_password=True  # FIX #5: enforce password change on first login
    )
    db.session.add(new_user)
    db.session.commit()
    apartment.resident_id = new_user.id
    db.session.commit()

    # Return the generated password ONCE so the admin can hand it to the resident
    return jsonify({
        "status": "success",
        "message": f"Added {full_name} to {flat_no}",
        "temp_password": default_pw  # FIX #5: shown once, must be changed on login
    })

@app.route("/api/admin/notices", methods=['POST'])
@jwt_required()
def post_notice():
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    # FIX #3: input validation
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({"message": "title and content are required"}), 400

    new_notice = Notice(title=data['title'], content=data['content'])
    db.session.add(new_notice)
    db.session.commit()
    return jsonify({"status": "success", "message": "Notice posted"})

@app.route("/api/apartments/vacant", methods=['GET'])
def get_vacant_flats():
    vacant = Apartment.query.filter_by(resident_id=None).all()
    flats = [apt.unit_number for apt in vacant]
    flats.sort()
    return jsonify(flats)

@app.route("/api/admin/users", methods=['GET'])
@jwt_required()
def get_all_residents():
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
            "nid": r.nid,
            "flat": flat,
            "members": r.members_count
        })
    return jsonify(output)

@app.route("/api/admin/user/<int:user_id>", methods=['DELETE'])
@jwt_required()
def remove_family(user_id):
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized"}), 403

    # FIX #2: use db.session.get() instead of deprecated Query.get()
    user_to_delete = db.session.get(User, user_id)
    if not user_to_delete:
        return jsonify({"message": "User not found"}), 404

    # FIX #12: prevent deleting admin accounts through this route
    if user_to_delete.role == 'admin':
        return jsonify({"message": "Cannot remove admin accounts through this endpoint"}), 403

    if user_to_delete.apartment:
        user_to_delete.apartment.resident_id = None
    db.session.delete(user_to_delete)
    db.session.commit()
    return jsonify({"status": "success", "message": "Family removed successfully"})


# --- SOCKET EVENTS ---
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('send_message')
def handle_message(data):
    # FIX #9: validate that sender info is present; sender_id is set by the client
    # and stored for proper sent/received differentiation
    sender_name = data.get('sender', 'Unknown')
    sender_id = data.get('sender_id')  # FIX #9: client must pass sender_id from JWT login response
    text = data.get('text', '').strip()

    if not text:
        return  # Ignore empty messages

    msg = ChatMessage(sender=sender_name, sender_id=sender_id, text=text)
    db.session.add(msg)
    db.session.commit()
    emit('receive_message', {
        "id": msg.id,
        "sender": sender_name,
        "sender_id": sender_id,
        "text": text
    }, broadcast=True)


# --- ONE-TIME SETUP ROUTE FOR POSTGRESQL MIGRATION ---
# FIX #6: Protected with a secret key via environment variable — remove after first run
@app.route('/database-setup-migrate', methods=['GET'])
def database_setup_migrate():
    setup_key = request.args.get('key')
    expected_key = os.environ.get('SETUP_SECRET_KEY')

    # Block access if no secret is configured or keys don't match
    if not expected_key or setup_key != expected_key:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403

    with app.app_context():
        db.create_all()

        if not Apartment.query.first():
            print("Creating Building Flats...")
            floors = 5
            units = ['A', 'B']
            for f in range(1, floors + 1):
                for u in units:
                    unit_num = f"{f}{u}"
                    db.session.add(Apartment(unit_number=unit_num, floor=f))
            db.session.commit()

        admin = User.query.filter_by(email="admin@bms.com").first()
        if not admin:
            admin = User(full_name="System Admin", email="admin@bms.com", role="admin", must_change_password=False)
            db.session.add(admin)

        admin.password_hash = generate_password_hash("ABCdef123@")
        db.session.commit()
        print("✅ ADMIN READY")

    return jsonify({"status": "success", "message": "PostgreSQL Setup Complete! Tables and Admin created."})


# --- APP RUNNER ---
if __name__ == '__main__':
    socketio.run(app, port=5000, debug=True)