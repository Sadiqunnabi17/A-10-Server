const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
};

const verifyWriter = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "writer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Writer access required" });
    }
    next();
  });
};

module.exports = { verifyToken, verifyAdmin, verifyWriter };