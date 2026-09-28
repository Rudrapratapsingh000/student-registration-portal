// Centralized API Service for Student Registration Portal

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Check backend health & database connectivity
 */
export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server health check failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * Register a new student with multipart/form-data (text fields + binary profile photo)
 * @param {FormData} formData
 */
export async function registerStudent(formData) {
  const response = await fetch(`${API_BASE_URL}/api/students/register`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header manually when sending FormData,
    // the browser will automatically set multipart/form-data with boundary.
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.detail || (typeof data === 'string' ? data : `Registration failed with status ${response.status}`);
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Fetch a student record by ID
 * @param {number|string} studentId
 */
export async function getStudent(studentId) {
  const response = await fetch(`${API_BASE_URL}/api/students/${studentId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch student profile`);
  }
  return response.json();
}

/**
 * Construct URL to retrieve student profile photograph
 * @param {number|string} studentId
 */
export function getStudentPhotoUrl(studentId) {
  return `${API_BASE_URL}/api/students/${studentId}/photo`;
}

/**
 * Fetch all registered students (optional overview)
 */
export async function getStudents() {
  const response = await fetch(`${API_BASE_URL}/api/students`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch students list`);
  }
  return response.json();
}

export default {
  API_BASE_URL,
  getHealth,
  registerStudent,
  getStudent,
  getStudentPhotoUrl,
  getStudents,
};
