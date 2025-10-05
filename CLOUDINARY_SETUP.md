# Cloudinary Setup Guide

## 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. After signing up, you'll be taken to your dashboard

## 2. Get Your Credentials
From your Cloudinary dashboard, copy:
- **Cloud Name** (found in the dashboard)
- **API Key** (found in the dashboard)
- **API Secret** (found in the dashboard)

## 3. Configure Backend Environment
Add these to your `backend/.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## 4. Configure Frontend
Update `frontend/src/services/cloudinaryService.js`:
```javascript
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name_here';
const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset_here';
```

## 5. Create Upload Preset
1. In your Cloudinary dashboard, go to **Settings** > **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Name it something like `job-platform-unsigned`
5. Set **Signing Mode** to **Unsigned**
6. Set **Folder** to `job-platform`
7. Click **Save**

## 6. Install Cloudinary Package
```bash
cd backend
npm install cloudinary
```

## 7. Test the Integration
1. Start your backend server
2. Go to the admin dashboard
3. Try uploading a video or image in the resource management section

## Features Included:
- ✅ Video upload with automatic thumbnail generation
- ✅ Image upload for thumbnails
- ✅ File organization in Cloudinary folders
- ✅ Secure unsigned uploads for frontend
- ✅ Admin-only upload access
- ✅ Automatic cleanup on resource deletion

## File Structure in Cloudinary:
```
job-platform/
├── videos/
│   ├── video1.mp4
│   └── video2.mp4
└── thumbnails/
    ├── thumbnail1.jpg
    └── thumbnail2.jpg
```

## Troubleshooting:
- Make sure your environment variables are set correctly
- Check that the upload preset is set to "Unsigned"
- Verify your Cloudinary credentials are correct
- Check browser console for any CORS errors
