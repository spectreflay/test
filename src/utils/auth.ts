// Utility functions for authentication and redirection
export const clearPreviousUserData = (currentUserEmail: string) => {
    // Get previous user's email
    const previousUserEmail = localStorage.getItem("lastLoggedInEmail");
  
    // Clear store-related data
    localStorage.removeItem("selectedStoreId");
  
    // If there was a different user logged in before, clear their data
    if (previousUserEmail && previousUserEmail !== currentUserEmail) {
      localStorage.removeItem(`lastLocation_${previousUserEmail}`);
    }
  };
  
  export const saveUserLocation = (email: string, path: string) => {
    // Only save root paths
    if (path === "/stores") {
      localStorage.setItem(`lastLocation_${email}`, path);
    }
    localStorage.setItem("lastLoggedInEmail", email);
  };
  
  export const getUserLastLocation = (email: string): string => {
    return "/stores"; // Always redirect to /stores
  };