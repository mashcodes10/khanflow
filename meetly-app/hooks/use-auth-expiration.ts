"use client";

import { useEffect } from "react";

const useAuthExpiration = () => {
  useEffect(() => {
    const handleLogout = () => {
      console.log("Token expired, logging out...");
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('expiresAt');
        window.location.href = "/auth/signin";
      }
    };

    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const expiresAt = localStorage.getItem('expiresAt');

      if (accessToken && expiresAt) {
        const currentTime = Date.now();
        const timeUntilExpiration = parseInt(expiresAt) - currentTime;

        if (timeUntilExpiration <= 0) {
          // Token is already expired
          handleLogout();
        } else {
          // Set a timeout to log out the user when the token expires
          const timer = setTimeout(handleLogout, timeUntilExpiration);
          // Cleanup the timer on component unmount or token change
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);
};

export default useAuthExpiration;