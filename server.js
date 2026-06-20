require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();

// Connect Database
connectDB();

// Middleware
// app.use(cors({
//   origin: [
//     "http://localhost:3000",
//     "https://a-10-client-4c3pasl3r-sadiqunnabis-projects.vercel.app",
//     "https://a-10-client-q9pr65wh6-sadiqunnabis-projects.vercel.app"
//   ],
//   credentials: true
// // }));
// app.use(express.json());

app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      "http://localhost:3000",
      "https://a-10-client.vercel.app"
    ];
    // Allow all vercel deployments
    if (!origin || allowed.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/ebooks", require("./src/routes/ebook.routes"));
app.use("/api/users", require("./src/routes/user.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));
app.use("/api/payment", require("./src/routes/payment.routes"));

app.get("/", (req, res) => {
  res.send("Fable API is running");
});

const PORT = process.env.PORT || 5000;

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});