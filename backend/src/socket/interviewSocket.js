/**
 * Real-time collaborative editor + chat for coding interviews.
 * Room id should match InterviewSession._id (string).
 */
function attachInterviewSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join-interview-room", (roomId) => {
      if (roomId && typeof roomId === "string") {
        socket.join(roomId);
      }
    });

    socket.on("leave-interview-room", (roomId) => {
      if (roomId) socket.leave(roomId);
    });

    socket.on("interview-editor-change", ({ roomId, payload }) => {
      if (!roomId || !payload) return;
      socket.to(roomId).emit("interview-editor-remote", payload);
    });

    socket.on("interview-chat", ({ roomId, message }) => {
      if (!roomId || !message) return;
      io.to(roomId).emit("interview-chat-broadcast", message);
    });

    /** Broadcast code run output to other participants in the room */
    socket.on("interview-terminal-run", ({ roomId, output, fromName }) => {
      if (!roomId || output == null) return;
      socket.to(roomId).emit("interview-terminal-remote", {
        output: String(output),
        fromName: fromName || "Partner",
      });
    });
  });
}

module.exports = { attachInterviewSocket };
