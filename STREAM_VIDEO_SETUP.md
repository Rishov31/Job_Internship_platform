# Stream Video Setup Guide

This guide explains how to set up and use the Stream Video calling feature for mentoring sessions.

## Prerequisites

1. Create a Stream account at https://getstream.io/
2. Create a new application in the Stream dashboard
3. Get your API Key and API Secret from the dashboard

## Backend Setup

### 1. Environment Variables

Add the following to your `backend/.env` file:

```env
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here
```

### 2. Dependencies

The backend dependencies are already installed:
- `stream-chat` - For Stream token generation

## Frontend Setup

### 1. Dependencies

The frontend dependencies are already installed:
- `@stream-io/video-react-sdk` - Stream Video React SDK
- `stream-chat` - Stream Chat client

## Features Implemented

### For Mentors
- ✅ Video call page at `/mentor/video-call?room={roomId}`
- ✅ Start video call from chat interface
- ✅ Join video calls with jobseekers
- ✅ Mute/unmute microphone
- ✅ Turn camera on/off
- ✅ End call

### For Job Seekers
- ✅ Video call page at `/jobseeker/video-call?room={roomId}`
- ✅ Start video call from chat interface
- ✅ Join video calls with mentors
- ✅ Mute/unmute microphone
- ✅ Turn camera on/off
- ✅ End call

## Usage

### Starting a Video Call

1. **From Chat Interface:**
   - Navigate to `/mentor/chat` (for mentors) or `/jobseeker/mentor-chats` (for jobseekers)
   - Select a chat room
   - Click the "Video Call" button in the chat header

2. **Direct URL:**
   - Navigate to `/mentor/video-call?room={roomId}` or `/jobseeker/video-call?room={roomId}`
   - Replace `{roomId}` with the actual chat room ID

### During a Call

- **Mute/Unmute:** Click the microphone button
- **Camera On/Off:** Click the camera button
- **End Call:** Click the red end call button
- **View Participants:** The participants list is available in the call interface

## API Endpoints

### Generate Stream Token
```
GET /api/stream/token
Headers: Authorization: Bearer {token}
Response: { token, apiKey, userId, userName, userEmail }
```

### Create Call
```
POST /api/stream/calls/room/:roomId
Headers: Authorization: Bearer {token}
Body: { type: 'video' | 'audio' }
Response: { callId, type, roomId }
```

## Troubleshooting

### Video Call Not Starting

1. **Check Environment Variables:**
   - Ensure `STREAM_API_KEY` and `STREAM_API_SECRET` are set in backend `.env`
   - Restart the backend server after adding environment variables

2. **Check Browser Permissions:**
   - Allow camera and microphone access when prompted
   - Check browser settings if permissions are denied

3. **Check Console:**
   - Open browser developer tools (F12)
   - Check for any errors in the console
   - Check Network tab for failed API requests

### Common Issues

1. **"Stream service not configured" error:**
   - Add Stream API credentials to backend `.env` file
   - Restart backend server

2. **"Failed to get Stream token" error:**
   - Check if user is authenticated (has valid token)
   - Check backend logs for errors

3. **Video/audio not working:**
   - Check browser permissions for camera/microphone
   - Try refreshing the page
   - Check if other applications are using camera/microphone

## Security Notes

- Stream tokens are generated server-side for security
- Each user gets a unique token based on their user ID
- Calls are scoped to specific chat rooms
- Only users with access to a chat room can join its video call

## Stream Dashboard

You can monitor calls and usage in your Stream dashboard:
- View active calls
- Check usage statistics
- Configure call settings
- Set up webhooks for call events

## Next Steps

To enhance the video calling feature, consider:
- Adding screen sharing
- Adding call recording
- Adding chat during calls
- Adding call history
- Adding call notifications

