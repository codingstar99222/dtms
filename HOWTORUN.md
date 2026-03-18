# How to Run

## 1. Clone the repository

```bash
git clone https://github.com/codingstar99222/dtms.git
```

## 2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install

# Install global dependencies
# on the root directory
npm install
```

## 3. Install database

```bash
cd backend
npm run db:setup
```

---

This will require the information for the default admin user

```bash
Enter admin email: <Type in the email address for the admin user>
Enter admin password (min 6 chars): <Your password>
Enter admin name: <Admin's name>
```

## 4. Create .env files

Copy .env.example files in both backend and frontend and rename to .env, and change values as you want

## 5. Run development server

```bash
# on the root of the repository
npm run dev
```

Then open your browser and visit [http://localhost:5173]
