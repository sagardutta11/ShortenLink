// Generates a 5-digit numeric OTP as a string
export const generateOtp = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Returns a Date object X minutes from now — used for otps.expires_at
export const getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};