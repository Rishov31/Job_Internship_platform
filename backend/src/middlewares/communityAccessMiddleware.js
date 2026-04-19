/** Only students (jobseeker) and startups (employer) may use community APIs */
module.exports = function communityAccessOnly(req, res, next) {
  const role = req.user?.role;
  if (!role || !["jobseeker", "employer"].includes(role)) {
    return res.status(403).json({ message: "Community is only for students and startups" });
  }
  next();
}
