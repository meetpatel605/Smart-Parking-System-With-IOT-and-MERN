# 🚗 Smart Parking Management System

A full MERN-stack web app for campus parking: time-based slot booking, live parking view,
role-based dashboards (Student / Faculty / Admin), notifications, RFID card fields, and
an analytics dashboard for admins.

This package contains a **working website** (React frontend + Node/Express backend +
MongoDB database). The physical RFID/ESP32 hardware described in the design doc is
represented in the software as data fields (RFID Card ID) — wiring real hardware is a
separate step not included here, but the API is ready for an ESP32 to call into.

---

## 1. What's inside

```
smart-parking/
├── client/     → React (Vite) frontend
├── server/     → Node.js + Express + MongoDB backend
└── README.md   → this file
```

---

## 2. Prerequisites (install these first)

You need 3 things installed on your computer:

1. **Node.js** (v18 or higher) — download from https://nodejs.org (choose the LTS version)
   - Check it's installed: open a terminal/command prompt and run `node -v`
2. **MongoDB** — you have two options, pick ONE:
   - **Option A (easiest): MongoDB Atlas (free cloud database)**
     1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account
     2. Create a free "M0" cluster
     3. Click "Connect" → "Drivers" → copy the connection string
        (looks like `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)
     4. Make sure to add your IP to the Atlas "Network Access" allow-list (or allow access from anywhere for testing)
   - **Option B: Install MongoDB locally**
     - Download from https://www.mongodb.com/try/download/community and install it
     - Make sure the MongoDB service is running (on Windows it usually starts automatically;
       on Mac with `brew services start mongodb-community`)
3. A code editor like **VS Code** (optional, but helpful) — https://code.visualstudio.com

---

## 3. Unzip the project

Unzip `smart-parking.zip` anywhere on your computer, e.g. to your Desktop.
You'll get a `smart-parking` folder with `client` and `server` inside it.

---

## 4. Backend setup (server)

Open a terminal and run:

```bash
cd smart-parking/server
npm install
```

This downloads all backend packages (Express, Mongoose, JWT, etc.) — takes 1-2 minutes.

### Configure environment variables

Copy the example env file:

```bash
# Mac/Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env
```

Open the new `.env` file in a text editor and set:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_parking
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@smartparking.com
ADMIN_PASSWORD=Admin@123
```

- If you're using **MongoDB Atlas**, replace `MONGO_URI` with the connection string you
  copied earlier (add `/smart_parking` before the `?` if there's a query string, e.g.
  `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/smart_parking?retryWrites=true&w=majority`)
- If you're using **local MongoDB**, the default value already works.
- Change `JWT_SECRET` to any random long string (this signs login tokens).
- You can change the default admin email/password here too.

### Seed the database (creates admin account + demo parking slots)

```bash
npm run seed
```

You should see output like:
```
✅ Admin created -> email: admin@smartparking.com  password: Admin@123
✅ 18 demo parking slots created
```

### Start the backend server

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected: ...
🚗 Server running on http://localhost:5000
```

Leave this terminal window open and running. Test it works by opening
http://localhost:5000/api/health in your browser — you should see a small JSON message.

---

## 5. Frontend setup (client)

Open a **second, new terminal window** (keep the backend one running) and run:

```bash
cd smart-parking/client
npm install
```

### Configure environment variables

```bash
# Mac/Linux
cp .env.example .env

# Windows
copy .env.example .env
```

The default value `VITE_API_URL=http://localhost:5000/api` already matches the backend, so
you usually don't need to change anything.

### Start the frontend

```bash
npm run dev
```

You should see something like:
```
VITE ready
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser — the website should load! 🎉

---

## 6. Using the website

- **Register** a new Student/Faculty account from the Register page, or
- **Login as Admin** using the credentials from the seed step:
  - Email: `admin@smartparking.com`
  - Password: `Admin@123`
  - (Change these in `server/.env` before seeding if you want different credentials)

As a student/faculty user you can:
- View the dashboard (available/occupied slots, bookings, notifications)
- Go to **Live Parking** → pick a date/time range → "Find Available Slots" → click a green
  slot → confirm booking
- View/cancel bookings under **History**
- Edit your profile and RFID card ID under **Profile**

As an admin (login then go to **Admin** in the navbar) you can:
- View overview stats
- Manage users (search, block/unblock, assign RFID, delete)
- Manage parking slots (add, change status, delete)
- Manage bookings (mark completed/cancelled)
- View analytics charts (booking trends, peak hours, most used slots, status breakdown)

---

## 7. Stopping / restarting

To stop either server, click into its terminal and press `Ctrl + C`.
To start again later, just re-run `npm run dev` in both the `server` and `client` folders
(no need to `npm install` or `npm run seed` again unless you delete `node_modules` or want
fresh demo data).

---

## 8. Common issues

| Problem | Fix |
|---|---|
| `MongoDB connection failed` | Make sure MongoDB is running locally, or that your Atlas connection string/IP allow-list is correct in `server/.env` |
| Frontend loads but API calls fail / blank data | Make sure the backend terminal is still running and shows no errors; check `client/.env` has the correct `VITE_API_URL` |
| `Port 5000 already in use` | Change `PORT` in `server/.env` to something else (e.g. 5001) and update `VITE_API_URL` in `client/.env` to match |
| Login fails after seeding | Double check the admin email/password in `server/.env` match what you're typing in |

---

## 9. Deploying online (optional, later)

When you're ready to make this publicly accessible:
- Backend: deploy to Render, Railway, or Cyclic (Node.js hosting) with your MongoDB Atlas URI
- Frontend: deploy to Vercel or Netlify, set `VITE_API_URL` to your deployed backend URL
- Update `CLIENT_URL` in the backend `.env` to your deployed frontend URL (for CORS)

---

## 10. What's simplified vs. the original design doc

This build implements the full software side (auth, live parking, time-based booking with
overlap prevention, RFID field, gate/zone metadata, notifications, admin panel, analytics).
Not included (left as future scope, same as the original doc suggested):
- Actual ESP32/RFID/servo hardware firmware and wiring
- SMS notifications (Twilio)
- AI-based parking prediction
- Waiting list auto-offer system (great next feature to add!)

Enjoy your project! 🚗💚
