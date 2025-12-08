const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const MentoringSession = require("../models/MentoringSession");

// Get all chat rooms for the current user (jobseeker or mentor)
exports.getMyChatRooms = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const chatRooms = await ChatRoom.find({
      $or: [{ jobseeker: userId }, { mentor: userId }],
      isActive: true
    })
      .populate("mentor", "fullName avatarUrl")
      .populate("jobseeker", "fullName avatarUrl")
      .populate("mentoringSession", "status startTime minutes")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.json({ chatRooms });
  } catch (e) {
    next(e);
  }
};

// Get messages for a specific chat room
exports.getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    // Check authorization
    if (chatRoom.jobseeker.toString() !== req.user.id && 
        chatRoom.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const messages = await Message.find({ chatRoom: roomId })
      .populate("sender", "fullName avatarUrl")
      .populate("receiver", "fullName avatarUrl")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Mark messages as read
    const unreadMessages = messages.filter(
      msg => !msg.isRead && msg.receiver._id.toString() === req.user.id
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(m => m._id) } },
        { isRead: true, readAt: new Date() }
      );

      // Update unread count
      if (chatRoom.jobseeker.toString() === req.user.id) {
        chatRoom.unreadCountJobseeker = 0;
      } else {
        chatRoom.unreadCountMentor = 0;
      }
      await chatRoom.save();
    }

    res.json({ 
      messages: messages.reverse(), // Reverse to show oldest first
      chatRoom 
    });
  } catch (e) {
    next(e);
  }
};

// Send a message
exports.sendMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content, messageType = "text", fileUrl } = req.body;

    if (!content && !fileUrl) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    // Check authorization
    if (chatRoom.jobseeker.toString() !== req.user.id && 
        chatRoom.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Determine receiver
    const receiverId = chatRoom.jobseeker.toString() === req.user.id 
      ? chatRoom.mentor 
      : chatRoom.jobseeker;

    const message = await Message.create({
      chatRoom: roomId,
      sender: req.user.id,
      receiver: receiverId,
      content: content || "",
      messageType,
      fileUrl,
    });

    // Update chat room
    chatRoom.lastMessage = message._id;
    chatRoom.lastMessageAt = new Date();
    
    // Update unread count
    if (chatRoom.jobseeker.toString() === req.user.id) {
      chatRoom.unreadCountMentor += 1;
    } else {
      chatRoom.unreadCountJobseeker += 1;
    }
    
    await chatRoom.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "fullName avatarUrl")
      .populate("receiver", "fullName avatarUrl");

    res.status(201).json({ message: populatedMessage });
  } catch (e) {
    next(e);
  }
};

// Get a specific chat room
exports.getChatRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId)
      .populate("mentor", "fullName avatarUrl")
      .populate("jobseeker", "fullName avatarUrl")
      .populate("mentoringSession", "status startTime minutes motivation")
      .populate("lastMessage");

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    // Check authorization - handle both ObjectId and string comparisons
    const userId = req.user.id.toString();
    const jobseekerId = chatRoom.jobseeker?._id?.toString() || chatRoom.jobseeker?.toString();
    const mentorId = chatRoom.mentor?._id?.toString() || chatRoom.mentor?.toString();
    
    if (jobseekerId !== userId && mentorId !== userId) {
      return res.status(403).json({ message: "Unauthorized - You don't have access to this chat room" });
    }

    res.json({ chatRoom });
  } catch (e) {
    next(e);
  }
};

