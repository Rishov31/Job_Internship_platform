import React, { useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Simple Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      errorMessage: error?.message || error?.toString() || 'An unknown error occurred' 
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VideoCall Error:', error, errorInfo);
    if (this.props.onError && typeof this.props.onError === 'function') {
      // Pass error message string, not Error object
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      this.props.onError(errorMessage);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️ Error rendering video call</div>
            {this.state.errorMessage && (
              <div className="text-sm text-gray-400 mb-4">{this.state.errorMessage}</div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Separate component to use hooks inside Call context
function CallContent({ call, isMuted, isVideoOff, onToggleMute, onToggleVideo, onLeaveCall }) {
  const { useCallState, useParticipants } = useCallStateHooks();
  const callState = useCallState();
  const participants = useParticipants();
  
  // Render SpeakerLayout - it will show local video even if no remote participants yet
  return (
    <>
      <div className="w-full h-full" style={{ position: 'relative', height: '100%', minHeight: '100%', backgroundColor: '#111827', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%' }}>
          <SpeakerLayout participantsBarPosition="bottom" />
        </div>
      </div>
      
      {/* Custom Call Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-4 bg-gray-800/90 backdrop-blur-sm rounded-full px-6 py-3">
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </>
              )}
            </svg>
          </button>

          <button
            onClick={onToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVideoOff ? (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </button>

          <button
            onClick={onLeaveCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition"
            title="End call"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default function VideoCall({ roomId, onCallEnd, currentUserId, otherUser }) {
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    initializeStream();
    return () => {
      cleanup();
    };
  }, [roomId]);

  const cleanup = async () => {
    try {
      if (call) {
        await call.leave();
      }
      if (client) {
        await client.disconnectUser();
      }
    } catch (err) {
      console.error('Error cleaning up:', err);
    }
  };

  const initializeStream = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get Stream token from backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/stream/token`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get Stream token');
      }

      const { token: streamToken, apiKey, userId, userName } = await response.json();

      if (!apiKey || !streamToken) {
        throw new Error('Invalid Stream credentials received');
      }

      // Initialize Stream client
      const streamClient = new StreamVideoClient({
        apiKey: apiKey,
        user: {
          id: userId,
          name: userName,
        },
        token: streamToken,
      });

      setClient(streamClient);

      // Create call with type 'default' and call ID based on room
      const streamCall = streamClient.call('default', `call-${roomId}`);
      
      // Join the call
      await streamCall.join({ 
        create: true,
        ring: false,
      });
      
      // Enable camera and microphone after joining
      try {
        await streamCall.camera.enable();
      } catch (camErr) {
        console.warn('Could not enable camera:', camErr);
      }
      
      try {
        await streamCall.microphone.enable();
      } catch (micErr) {
        console.warn('Could not enable microphone:', micErr);
      }
      
      setCall(streamCall);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing Stream:', err);
      setError(err.message || 'Failed to initialize video call');
      setLoading(false);
    }
  };

  const handleLeaveCall = async () => {
    try {
      if (call) {
        await call.leave();
      }
      if (onCallEnd) {
        onCallEnd();
      }
    } catch (err) {
      console.error('Error leaving call:', err);
      if (onCallEnd) {
        onCallEnd();
      }
    }
  };

  const toggleMute = async () => {
    if (call) {
      try {
        await call.microphone.toggle();
        setIsMuted(prev => !prev);
      } catch (err) {
        console.error('Error toggling microphone:', err);
      }
    }
  };

  const toggleVideo = async () => {
    if (call) {
      try {
        await call.camera.toggle();
        setIsVideoOff(prev => !prev);
      } catch (err) {
        console.error('Error toggling camera:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white" style={{ minHeight: '100%' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Initializing video call...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white" style={{ minHeight: '100%' }}>
        <div className="text-center">
          <div className="text-red-500 mb-4 text-lg">⚠️ {error}</div>
          <div className="text-sm text-gray-400 mb-4">Please check your Stream API credentials in backend/.env</div>
          <button
            onClick={handleLeaveCall}
            className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white" style={{ minHeight: '100%' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Connecting to call...</div>
        </div>
      </div>
    );
  }

  // Ensure call is properly initialized before rendering
  if (!call || !call.id) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white" style={{ minHeight: '100%' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Preparing call...</div>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <div className="relative w-full h-full bg-gray-900" style={{ minHeight: '100%', height: '100%', position: 'relative' }}>
        <ErrorBoundary onError={(errorMsg) => setError(errorMsg)}>
          <Call call={call}>
            <CallContent 
              call={call}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onLeaveCall={handleLeaveCall}
            />
          </Call>
        </ErrorBoundary>
      </div>
    </StreamVideo>
  );
}
