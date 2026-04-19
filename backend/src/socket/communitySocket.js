const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { setCommunityNamespace } = require("../realtime/communityRealtime");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function attachCommunitySocket(io) {
  const nsp = io.of("/community");

  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select("role");
      if (!user) return next(new Error("Unauthorized"));
      if (!["jobseeker", "employer"].includes(user.role)) {
        return next(new Error("Forbidden"));
      }
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  nsp.on("connection", (socket) => {
    socket.join("community-global");

    socket.on("join-dm", (conversationId) => {
      if (conversationId && typeof conversationId === "string") {
        socket.join(`dm-${conversationId}`);
      }
    });

    socket.on("leave-dm", (conversationId) => {
      if (conversationId) socket.leave(`dm-${conversationId}`);
    });
  });

  setCommunityNamespace(nsp);
}

module.exports = { attachCommunitySocket };
