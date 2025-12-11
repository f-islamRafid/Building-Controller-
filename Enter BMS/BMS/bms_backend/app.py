import eventlet
eventlet.monkey_patch()


from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from flask_socketio import SocketIO, emit 
import datetime

app = Flask(__name__)
# Allow CORS for both API and WebSockets
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# --- CONFIGURATION ---
app.config["JWT_SECRET_KEY"] = "bms-secret-key"
jwt = JWTManager(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
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
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)

class PrivateNotice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)

class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submitted_by = db.Column(db.String(100))
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender = db.Column(db.String(100))
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.now)

# --- AUTH ROUTES ---
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        token = create_access_token(identity=user.email)
        return jsonify({"status": "success", "token": token, "role": user.role, "full_name": user.full_name, "user_id": user.id})
    return jsonify({"status": "error", "message": "Invalid Email or Password"}), 401


# --- SYSTEM SETUP ROUTE (Run Once) ---
@app.route('/api/setup_system', methods=['GET'])
def setup_system():
    db.create_all()
    seed_database()
    return jsonify({"status": "success", "message": "Database Created & Admin (admin@bms.com) Reset!"})

@app.route("/api/change_password", methods=['POST'])
@jwt_required()
def change_password():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    data = request.json
    if not check_password_hash(user.password_hash, data.get('old_password')):
        return jsonify({"message": "Incorrect old password"}), 401
    user.password_hash = generate_password_hash(data.get('new_password'))
    db.session.commit()
    return jsonify({"status": "success", "message": "Password updated successfully"})

# --- API ROUTES ---
@app.route("/api/user_info", methods=['GET'])
@jwt_required()
def get_user_info():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    flat_no = "Not Assigned"
    if user.apartment: flat_no = user.apartment.unit_number
    return jsonify({
        "status": "success", "full_name": user.full_name, "email": user.email, "phone": user.phone,
        "nid": user.nid, "members": user.members_count, "flat_no": flat_no, "role": user.role
    })

# --- NEW: PUBLIC STATS ROUTE (Fixes Count Issue) ---
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
        "flats": { "total": total_flats, "occupied": occupied_flats, "vacant": vacant_flats },
        "notices": total_notices,
        "complaints": { "total": total_complaints, "pending": pending_complaints, "resolved": resolved_complaints }
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
    if current_user.role != 'admin': return jsonify({"message": "Unauthorized"}), 403
    notice = Notice.query.get(id)
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
    if current_user.role != 'admin': return jsonify({"message": "Unauthorized"}), 403
    
    data = request.json
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
    complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    output = [{"id": c.id, "submitted_by": c.submitted_by, "subject": c.subject, "description": c.description, "status": c.status, "date": c.created_at.strftime("%Y-%m-%d")} for c in complaints]
    return jsonify(output)

@app.route("/api/complaints", methods=['POST'])
@jwt_required()
def post_complaint():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    data = request.json
    new_complaint = Complaint(submitted_by=user.full_name, subject=data.get('subject'), description=data.get('description'))
    db.session.add(new_complaint)
    db.session.commit()
    return jsonify({"status": "success", "message": "Complaint submitted"})

@app.route("/api/complaints/<int:id>", methods=['PUT'])
@jwt_required()
def update_complaint(id):
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin': return jsonify({"message": "Unauthorized"}), 403
    complaint = Complaint.query.get(id)
    if not complaint: return jsonify({"message": "Complaint not found"}), 404
    data = request.json
    complaint.status = data.get('status', 'Resolved')
    db.session.commit()
    return jsonify({"status": "success", "message": f"Complaint marked as {complaint.status}"})

@app.route("/api/messages", methods=['GET'])
@jwt_required()
def get_messages():
    messages = ChatMessage.query.order_by(ChatMessage.timestamp.asc()).limit(50).all()
    output = [{"id": m.id, "sender": m.sender, "text": m.text, "type": "received"} for m in messages]
    return jsonify(output)

# --- ADMIN ROUTES ---
@app.route("/api/admin/add_family", methods=['POST'])
@jwt_required()
def add_family():
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin': return jsonify({"message": "Unauthorized"}), 403
    data = request.json
    flat_no = data.get('flat').upper()
    apartment = Apartment.query.filter_by(unit_number=flat_no).first()
    if not apartment: return jsonify({"message": f"Flat {flat_no} does not exist."}), 404
    if apartment.resident_id: return jsonify({"message": f"Flat {flat_no} is already occupied."}), 400
    generated_email = f"{flat_no.lower()}@bms.com"
    if User.query.filter_by(email=generated_email).first(): return jsonify({"message": "Flat account already exists."}), 409
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    full_name = f"{first_name} {last_name}"
    default_pw = "123456" 
    new_user = User(full_name=full_name, email=generated_email, password_hash=generate_password_hash(default_pw), phone=data.get('phone'), nid=data.get('nid'), members_count=data.get('members'), role='resident')
    db.session.add(new_user)
    db.session.commit()
    apartment.resident_id = new_user.id
    db.session.commit()
    return jsonify({"status": "success", "message": f"Added {full_name} to {flat_no}"})

@app.route("/api/admin/notices", methods=['POST'])
@jwt_required()
def post_notice():
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin': return jsonify({"message": "Unauthorized"}), 403
    data = request.json
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
    if current_user.role != 'admin': return jsonify({"message": "Unauthorized"}), 403
    residents = User.query.filter_by(role='resident').all()
    output = []
    for r in residents:
        flat = "Not Assigned"
        if r.apartment: flat = r.apartment.unit_number
        output.append({"id": r.id, "name": r.full_name, "email": r.email, "phone": r.phone, "nid": r.nid, "flat": flat, "members": r.members_count})
    return jsonify(output)

@app.route("/api/admin/user/<int:user_id>", methods=['DELETE'])
@jwt_required()
def remove_family(user_id):
    current_user = User.query.filter_by(email=get_jwt_identity()).first()
    if current_user.role != 'admin': return jsonify({"message": "Unauthorized"}), 403
    user_to_delete = User.query.get(user_id)
    if not user_to_delete: return jsonify({"message": "User not found"}), 404
    if user_to_delete.apartment: user_to_delete.apartment.resident_id = None
    db.session.delete(user_to_delete)
    db.session.commit()
    return jsonify({"status": "success", "message": "Family removed successfully"})

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('send_message')
def handle_message(data):
    msg = ChatMessage(sender=data['sender'], text=data['text'])
    db.session.add(msg)
    db.session.commit()
    emit('receive_message', data, broadcast=True)

def seed_database():
    if not Apartment.query.first():
        print("Creating Building Flats...")
        floors = 5
        units = ['A', 'B']
        for f in range(1, floors + 1):
            for u in units:
                unit_num = f"{f}{u}"
                db.session.add(Apartment(unit_number=unit_num, floor=f))
        db.session.commit()

    if not User.query.filter_by(role='admin').first():
        print("Creating Default Admin...")
        admin = User(full_name="System Admin", email="admin@bms.com", password_hash=generate_password_hash("ABCdef123@"), role="admin")
        db.session.add(admin)
        db.session.commit()
        print("Login Successful")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_database()
    socketio.run(app, port=5000, debug=True)