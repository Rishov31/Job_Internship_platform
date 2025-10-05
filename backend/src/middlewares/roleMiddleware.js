module.exports = function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is admin (can access admin routes regardless of role)
    if (req.user.isAdmin) {
      return next();
    }
    
    // Check if user's role is in allowed roles
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
};


