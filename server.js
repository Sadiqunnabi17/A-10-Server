require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Routes (add as you build them)
// app.use("/api/auth", require("./src/routes/auth.routes"));
// app.use("/api/ebooks", require("./src/routes/ebook.routes"));
// app.use("/api/users", require("./src/routes/user.routes"));
// app.use("/api/admin", require("./src/routes/admin.routes"));

app.get("/", (req, res) => {
  res.send("Fable API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});