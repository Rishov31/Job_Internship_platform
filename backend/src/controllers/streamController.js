const { StreamChat } = require('stream-chat');

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

if (!STREAM_API_KEY || !STREAM_API_SECRET) {
  console.warn('⚠️  Stream API credentials not found. Video calling will not work.');
}

const serverClient = STREAM_API_KEY && STREAM_API_SECRET 
  ? StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET)
  : null;

// Generate Stream token for user
exports.generateToken = async (req, res, next) => {
  try {
    if (!serverClient) {
      return res.status(503).json({ 
        message: 'Stream service not configured. Please set STREAM_API_KEY and STREAM_API_SECRET in environment variables.' 
      });
    }

    const userId = req.user.id;
    const userEmail = req.user.email || `${userId}@example.com`;
    const userName = req.user.fullName || `User ${userId}`;

    // Create or update user in Stream
    const token = serverClient.createToken(userId);

    res.json({
      token,
      apiKey: STREAM_API_KEY,
      userId,
      userName,
      userEmail,
    });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    next(error);
  }
};

// Create a call for a chat room
exports.createCall = async (req, res, next) => {
  try {
    if (!serverClient) {
      return res.status(503).json({ 
        message: 'Stream service not configured' 
      });
    }

    const { roomId } = req.params;
    const { type = 'video' } = req.body; // 'video' or 'audio'

    // Get chat room to verify access
    const ChatRoom = require('../models/ChatRoom');
    const MentoringSession = require('../models/MentoringSession');
    
    const room = await ChatRoom.findById(roomId)
      .populate('mentor jobseeker mentoringSession');
    
    // If room has mentoringSession, get mentorUser from it
    let mentorUser = room.mentor;
    if (room.mentoringSession) {
      const session = await MentoringSession.findById(room.mentoringSession)
        .populate('mentorUser');
      if (session?.mentorUser) {
        mentorUser = session.mentorUser;
      }
    }

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Verify user has access to this room
    const userId = req.user.id.toString();
    const mentorId = mentorUser?._id?.toString() || mentorUser?.toString() || room.mentor?._id?.toString() || room.mentor?.toString();
    const jobseekerId = room.jobseeker?._id?.toString() || room.jobseeker?.toString();
    
    const isMentor = mentorId === userId;
    const isJobseeker = jobseekerId === userId;

    if (!isMentor && !isJobseeker) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    // Create a channel ID for the call (using room ID)
    const channelId = `call-${roomId}`;
    const channel = serverClient.channel('messaging', channelId, {
      name: `Call: ${mentorUser?.fullName || 'Mentor'} & ${room.jobseeker?.fullName || 'Jobseeker'}`,
      members: [mentorId, jobseekerId].filter(Boolean),
    });

    await channel.create();

    res.json({
      callId: channelId,
      type,
      roomId,
    });
  } catch (error) {
    console.error('Error creating call:', error);
    next(error);
  }
};

