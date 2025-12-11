# Building Management System - React Frontend

A modern React frontend for the Building Management System (BMS) application.

## Features

- **User Authentication**: Login and registration with JWT tokens
- **Resident Dashboard**:
  - View profile and apartment information
  - Submit maintenance requests
  - View maintenance request status
  - View building notices
- **Admin Dashboard**:
  - Assign apartments to residents
  - Post building notices
  - View vacant apartments

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Make sure the backend server is running on port 5000

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Login.jsx        # Login page
│   │   ├── Register.jsx     # Registration page
│   │   ├── ResidentDashboard.jsx  # Resident dashboard
│   │   ├── AdminDashboard.jsx     # Admin dashboard
│   │   ├── Layout.jsx       # Main layout with navbar
│   │   ├── ProtectedRoute.jsx     # Route protection
│   │   ├── Auth.css         # Auth page styles
│   │   ├── Layout.css       # Layout styles
│   │   └── Dashboard.css    # Dashboard styles
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication context
│   ├── services/
│   │   └── api.js           # API service layer
│   ├── App.jsx              # Main app component
│   ├── App.css              # Global styles
│   └── main.jsx             # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Default Admin Credentials

- Email: `admin@bms.com`
- Password: `supersecure`

## API Endpoints

The frontend communicates with the backend API at `http://localhost:5000`:

- `POST /register` - User registration
- `POST /login` - User login
- `GET /api/user_info` - Get user information
- `POST /api/maintenance` - Create maintenance request
- `GET /api/maintenance` - Get maintenance requests
- `GET /api/notices` - Get building notices
- `POST /api/admin/notices` - Post notice (admin only)
- `POST /api/admin/assign_apartment` - Assign apartment (admin only)
- `GET /api/apartments/vacant` - Get vacant apartments

## Technologies Used

- React 18
- React Router DOM 6
- Axios for API calls
- Vite for build tooling
- Font Awesome for icons

## Notes

- The app uses JWT tokens stored in localStorage for authentication
- Protected routes require authentication
- Admin routes require admin role
- The app automatically redirects to login if the token expires or is invalid

