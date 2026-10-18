# 🚗 Smart Parking Management System

A full MERN-stack web app for campus parking: time-based slot booking, live parking view,
role-based dashboards (Student / Faculty / Admin), notifications, RFID card fields, and
an analytics dashboard for admins.

This package contains a working website (React frontend + Node/Express backend +
MongoDB database) and a broker-backed hardware integration. ESP32 devices communicate
with the backend through MQTT; browsers never connect to the hardware or control a
servo directly.

---

## 1. What's inside

```
smart-parking/
├── client/     → React (Vite) frontend
├── server/     → Node.js + Express + MongoDB backend
├── hardware/   → ESP32 gate controller reference firmware
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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@smartparking.com
ADMIN_PASSWORD=Admin@123
MQTT_URL=mqtts://your-broker.example.com:8883
MQTT_USERNAME=smart-parking-backend
MQTT_PASSWORD=use-a-secret-from-your-broker
MQTT_CLIENT_ID=smart-parking-backend
MQTT_TLS_REJECT_UNAUTHORIZED=true
DEVICE_OFFLINE_AFTER_MS=120000
PARKING_TIMEZONE=Asia/Kolkata
```

- If you're using **MongoDB Atlas**, replace `MONGO_URI` with the connection string you
  copied earlier (add `/smart_parking` before the `?` if there's a query string, e.g.
  `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/smart_parking?retryWrites=true&w=majority`)
- If you're using **local MongoDB**, the default value already works.
- Change `JWT_SECRET` to any random long string (this signs login tokens).
- Set `PARKING_TIMEZONE` to the IANA timezone used by your facility. Gate authorization
  evaluates booking date and time in this timezone instead of the server timezone.
- You can change the default admin email/password here too.
- For Gmail, enable 2-Step Verification and create an App Password. Use that App Password
  as `SMTP_PASS`; do not use your regular Gmail password. If SMTP variables are omitted,
  forgot-password remains available in local demo mode and displays the OTP in the response.

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
- View live device health and real RFID access events under Sensors and RFID

### MQTT topic contract

The backend subscribes to:

| Topic | Payload |
|---|---|
| `parking/gate/entry/rfid` | `{"eventId":"...", "deviceId":"gate-entry-01", "rfidCardId":"RFID-1001", "timestamp":"2026-10-13T10:30:00Z"}` |
| `parking/gate/entry/qr` | `{"eventId":"...", "deviceId":"gate-entry-01", "qrToken":"...", "timestamp":"..."}` |
| `parking/gate/+/status` | `{"deviceId":"gate-entry-01","commandId":"...","status":"open"}` |
| `parking/devices/{deviceId}/heartbeat` | `{"firmware":"1.0.0","ip":"192.168.1.20"}` |
| `parking/slots/{slotNumber}/status` | `{"status":"occupied"}` |

It publishes authorization commands to `parking/gate/{entry|exit}/command`:
`{"commandId":"...","eventId":"...","command":"open|deny","reason":"..."}`.
Use QoS 1, a unique `eventId` per physical scan, and MQTT over TLS with device-specific
credentials in production.

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
| RFID is denied unexpectedly | Confirm the card is assigned, the account is not blocked, the booking uses the same vehicle, and the booking covers the current `PARKING_TIMEZONE` date/time |

---

## 9. Deploying online (optional, later)

When you're ready to make this publicly accessible:
- Backend: deploy to Render, Railway, or Cyclic (Node.js hosting) with your MongoDB Atlas URI
- Frontend: deploy to Vercel or Netlify, set `VITE_API_URL` to your deployed backend URL
- Update `CLIENT_URL` in the backend `.env` to your deployed frontend URL (for CORS)
- If the Vercel project root is set to `client`, the included `client/vercel.json` enables
  refreshes on React Router URLs such as `/dashboard` and `/parking`.

---

## 10. Hardware deployment checklist

1. Configure a Mosquitto, HiveMQ Cloud, or EMQX broker and create separate credentials
   for the backend and each ESP32.
2. Set `MQTT_URL`, credentials, and TLS settings in the server environment.
3. Program each ESP32 to publish heartbeats, RFID/QR events, slot status, and gate status
   using the topic contract above. The ESP32 must only open the servo after receiving an
   `open` command and should publish an acknowledgment.
4. Register RFID cards and vehicles in the admin UI, then create a booking covering the
   current date/time before testing entry.
5. Confirm device health and access events in the admin dashboard.

For a reproducible firmware build, open `hardware/esp32_gate_controller` in
PlatformIO and run `pio run`. The included `platformio.ini` points PlatformIO at
the `.ino` source in this directory and installs the required libraries
automatically. In Arduino IDE, install the same four libraries manually and
select an ESP32 board such as "ESP32 Dev Module".

The integration includes reconnecting MQTT clients, duplicate-event protection,
authorization through one RFID/QR path, command acknowledgments, persisted access logs,
slot updates, Socket.IO broadcasts, and offline device detection. SMS, AI prediction,
and waiting-list automation remain separate future features.

Enjoy your project! 🚗💚
