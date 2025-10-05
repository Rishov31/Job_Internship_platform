// // Debug utility to check user authentication status
// export const debugUserAuth = () => {
//   // Check if token exists in localStorage
//   const token = localStorage.getItem('token');
//   console.log('Token in localStorage:', token);
  
//   // Check if token exists in cookies (if using cookies)
//   const cookies = document.cookie;
//   console.log('Cookies:', cookies);
  
//   // Try to decode token (basic check)
//   if (token) {
//     try {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       console.log('Token payload:', payload);
//       return payload;
//     } catch (error) {
//       console.log('Error decoding token:', error);
//     }
//   }
  
//   return null;
// };

// export const checkUserRole = async () => {
//   try {
//     const response = await fetch('/api/auth/me', {
//       credentials: 'include'
//     });
    
//     if (response.ok) {
//       const user = await response.json();
//       console.log('Current user from /api/auth/me:', user);
//       return user;
//     } else {
//       console.log('Failed to get user info:', response.status);
//     }
//   } catch (error) {
//     console.log('Error fetching user info:', error);
//   }
  
//   return null;
// };
