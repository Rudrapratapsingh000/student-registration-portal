/**
 * Validation utility functions for Student Registration Portal
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[0-9\s\-]{10,15}$/;

export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
  return null;
}

export function validatePhone(phone) {
  if (!phone || !phone.trim()) return 'Phone number is required';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return 'Phone number must contain between 10 and 15 digits';
  }
  return null;
}

export function validatePassword(password, confirmPassword = null) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (confirmPassword !== null && password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}

export function validateImageSpec(file, width, height) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowed.includes(file.type.toLowerCase())) {
    return 'Unsupported image format. Allowed formats: JPG, JPEG, PNG';
  }
  const sizeKb = file.size / 1024;
  if (sizeKb > 600) {
    return `File size is ${Math.round(sizeKb)} KB. Maximum allowed size is 600 KB.`;
  }
  if (width < 200 || height < 260) {
    return 'Image resolution is too small. Minimum allowed is 200 × 260 pixels.';
  }
  if (height < width) {
    return 'Please upload a portrait-oriented photograph.';
  }
  return null;
}
