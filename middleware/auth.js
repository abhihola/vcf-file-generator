module.exports = (req, res, next) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized access" });
  }
};
