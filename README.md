# bolt-action-general-backend
back end for my bolt action army planner

# Install dependencies
npm install

# Create data directory for SQLite
mkdir -p data

# Development
npm run dev

# Production build & start
npm run build

npm start

# API Endpoints:

    POST /api/auth/login - Login

    POST /api/auth/register - Register

    POST /api/auth/logout - Logout

    GET /api/auth/me - Get current user

    GET curl http://localhost:5509/api/auth - all users

    DELETE curl -X DELETE http://localhost:5509/api/auth/petri
