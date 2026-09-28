import React, { useState } from 'react';
import {
  User,
  UserCheck,
  Calendar,
  Users,
  PhoneCall,
  Mail,
  Phone,
  MapPin,
  Building2,
  Map,
  Hash,
  BookOpen,
  School,
  Library,
  GitBranch,
  Layers,
  CalendarCheck,
  Lock,
  KeyRound,
  CheckCheck,
  FileCheck,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import FormSection from './FormSection';
import InputField from './InputField';
import SelectField from './SelectField';
import PasswordField from './PasswordField';
import ProfilePhotoUpload from './ProfilePhotoUpload';
import SubmitButton from './SubmitButton';
import ValidationMessage from './ValidationMessage';
import { registerStudent, getStudentPhotoUrl } from '../services/api';

const INITIAL_FORM_STATE = {
  full_name: '',
  dob: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  college: 'DBS Global University',
  course: '',
  branch: '',
  semester: '',
  admission_year: '2025',
  password: '',
  confirm_password: '',
  terms_agreed: false,
};

export default function RegistrationForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear specific field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handlePhotoSelected = (file, dataUrl) => {
    setPhotoFile(file);
    setPhotoPreviewUrl(dataUrl);
    if (errors.profile_photo) {
      setErrors((prev) => ({ ...prev, profile_photo: '' }));
    }
  };

  const handlePhotoRemoved = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Please select a gender';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      newErrors.phone = 'Phone number must be between 10 and 15 digits';
    }

    if (!formData.address.trim()) newErrors.address = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'Please select a state';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (formData.pincode.trim().length < 4 || formData.pincode.trim().length > 10) {
      newErrors.pincode = 'Invalid pincode format';
    }

    if (!formData.college.trim()) newErrors.college = 'College/University name is required';
    if (!formData.course) newErrors.course = 'Please select a course';
    if (!formData.branch) newErrors.branch = 'Please select a branch/specialization';
    if (!formData.semester) newErrors.semester = 'Please select semester';
    if (!formData.admission_year) newErrors.admission_year = 'Please select admission year';

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Confirm password is required';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (!formData.terms_agreed) {
      newErrors.terms_agreed = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      const firstError = Object.values(errors)[0] || 'Please complete all required fields correctly.';
      setServerError(firstError);
      return;
    }

    setLoading(true);

    try {
      // Build multipart/form-data for submission
      const payload = new FormData();
      payload.append('full_name', formData.full_name.trim());
      payload.append('dob', formData.dob);
      payload.append('gender', formData.gender);
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('phone', formData.phone.trim());
      payload.append('address', formData.address.trim());
      payload.append('city', formData.city.trim());
      payload.append('state', formData.state);
      payload.append('pincode', formData.pincode.trim());
      payload.append('college', formData.college.trim());
      payload.append('course', formData.course);
      payload.append('branch', formData.branch);
      payload.append('semester', formData.semester);
      payload.append('admission_year', formData.admission_year);
      payload.append('password', formData.password);

      // Append binary profile photo if selected
      if (photoFile) {
        payload.append('profile_photo', photoFile, photoFile.name);
      }

      const result = await registerStudent(payload);

      setSuccessData(result);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err) {
      console.error('Registration error:', err);
      setServerError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setErrors({});
    setServerError('');
    setSuccessData(null);
  };

  return (
    <div className="w-full">
      {/* SUCCESS MODAL / OVERLAY IF REGISTRATION SUCCEEDED */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Registration Successful!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Welcome to the university! Your student identity profile has been officially created in MySQL.
            </p>

            {/* Photo & Details Badge */}
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-left">
              {successData.student?.id && (
                <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-sm">
                  <img
                    src={getStudentPhotoUrl(successData.student.id)}
                    alt="Registered Student"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (photoPreviewUrl) e.target.src = photoPreviewUrl;
                    }}
                  />
                </div>
              )}
              <div className="flex-1 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    #{successData.student?.id || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-800">{successData.student?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800">{successData.student?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Course:</span>
                  <span className="font-semibold text-slate-800">
                    {successData.student?.course} - {successData.student?.branch}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Photo Stored:</span>
                  <span className="font-semibold text-emerald-600">MEDIUMBLOB in MySQL ✓</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Register Another Student</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Registration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Create your account and begin your academic journey
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Already registered?{' '}
          <a href="#login" className="text-blue-600 hover:underline font-bold">
            Sign in
          </a>
        </div>
      </div>

      {serverError && (
        <div className="mt-4">
          <ValidationMessage type="error" message={serverError} />
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* 1. PERSONAL INFORMATION SECTION */}
        <FormSection
          icon={User}
          iconTheme="blue"
          title="Personal Information"
          subtitle="Tell us about yourself"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Fields (8 cols) */}
            <div className="md:col-span-8 space-y-4">
              <InputField
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                icon={UserCheck}
                error={errors.full_name}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  icon={Calendar}
                  error={errors.dob}
                />

                <SelectField
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  placeholder="Select gender"
                  required
                  icon={Users}
                  error={errors.gender}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'nonbinary', label: 'Non-binary' },
                    { value: 'other', label: 'Prefer not to say' },
                  ]}
                />
              </div>
            </div>

            {/* Right: Interactive Profile Photo Component (4 cols) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center">
              <ProfilePhotoUpload
                photoFile={photoFile}
                photoPreviewUrl={photoPreviewUrl}
                onPhotoSelected={handlePhotoSelected}
                onPhotoRemoved={handlePhotoRemoved}
              />
              {errors.profile_photo && (
                <p className="text-xs text-red-500 mt-1 font-medium text-center">
                  {errors.profile_photo}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 2. CONTACT INFORMATION SECTION */}
        <FormSection
          icon={PhoneCall}
          iconTheme="emerald"
          title="Contact Information"
          subtitle="How can we reach you?"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              icon={Mail}
              error={errors.email}
            />

            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
              icon={Phone}
              error={errors.phone}
            />

            <InputField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter full street address"
              required
              icon={MapPin}
              error={errors.address}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <InputField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              required
              icon={Building2}
              error={errors.city}
            />

            <SelectField
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Select state"
              required
              icon={Map}
              error={errors.state}
              options={[
                { value: 'california', label: 'California' },
                { value: 'new_york', label: 'New York' },
                { value: 'texas', label: 'Texas' },
                { value: 'washington', label: 'Washington' },
                { value: 'illinois', label: 'Illinois' },
                { value: 'florida', label: 'Florida' },
                { value: 'massachusetts', label: 'Massachusetts' },
                { value: 'other', label: 'Other State / International' },
              ]}
            />

            <InputField
              label="Pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Enter postal code"
              required
              icon={Hash}
              error={errors.pincode}
            />
          </div>
        </FormSection>

        {/* 3. ACADEMIC INFORMATION SECTION */}
        <FormSection
          icon={BookOpen}
          iconTheme="amber"
          title="Academic Information"
          subtitle="Tell us about your education"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="College/University"
              name="college"
              value={formData.college}
              onChange={handleChange}
              placeholder="Enter college name"
              required
              icon={School}
              error={errors.college}
            />

            <SelectField
              label="Course"
              name="course"
              value={formData.course}
              onChange={handleChange}
              placeholder="Select course"
              required
              icon={Library}
              error={errors.course}
              options={[
                { value: 'btech', label: 'B.Tech / B.E.' },
                { value: 'bsc', label: 'B.Sc Computer Science' },
                { value: 'bba', label: 'BBA / Management' },
                { value: 'mtech', label: 'M.Tech / M.S.' },
                { value: 'mba', label: 'MBA' },
              ]}
            />

            <SelectField
              label="Branch/Specialization"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              placeholder="Select branch"
              required
              icon={GitBranch}
              error={errors.branch}
              options={[
                { value: 'cs', label: 'Computer Science & AI' },
                { value: 'it', label: 'Information Technology' },
                { value: 'ece', label: 'Electronics & Communication' },
                { value: 'ds', label: 'Data Science & Analytics' },
                { value: 'me', label: 'Mechanical Engineering' },
                { value: 'ce', label: 'Civil Engineering' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <SelectField
              label="Semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              placeholder="Select semester"
              required
              icon={Layers}
              error={errors.semester}
              options={[
                { value: '1', label: '1st Semester (Freshman)' },
                { value: '2', label: '2nd Semester' },
                { value: '3', label: '3rd Semester' },
                { value: '4', label: '4th Semester' },
                { value: '5', label: '5th Semester' },
                { value: '6', label: '6th Semester' },
                { value: '7', label: '7th Semester' },
                { value: '8', label: '8th Semester' },
              ]}
            />

            <SelectField
              label="Admission Year"
              name="admission_year"
              value={formData.admission_year}
              onChange={handleChange}
              placeholder="Select year"
              required
              icon={CalendarCheck}
              error={errors.admission_year}
              options={[
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
                { value: '2024', label: '2024' },
                { value: '2023', label: '2023' },
                { value: '2022', label: '2022' },
              ]}
            />
          </div>
        </FormSection>

        {/* 4. ACCOUNT INFORMATION SECTION */}
        <FormSection
          icon={Lock}
          iconTheme="purple"
          title="Account Information"
          subtitle="Create a secure account"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordField
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min 8 chars)"
              required
              icon={KeyRound}
              error={errors.password}
            />

            <PasswordField
              label="Confirm Password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Confirm password"
              required
              icon={CheckCheck}
              error={errors.confirm_password}
            />
          </div>
        </FormSection>

        {/* 5. CONSENT CHECKBOX SECTION */}
        <div className="bg-rose-50/40 rounded-2xl border border-rose-100 p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="flex items-start gap-2.5 pt-0.5">
            <input
              id="terms_agreed"
              name="terms_agreed"
              type="checkbox"
              checked={formData.terms_agreed}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <label
                htmlFor="terms_agreed"
                className="text-xs sm:text-sm text-slate-700 font-medium cursor-pointer leading-snug"
              >
                I agree to the{' '}
                <a href="#terms" className="text-blue-600 hover:underline font-semibold">
                  Terms & Conditions
                </a>{' '}
                and confirm that all academic & personal information provided is genuine and correct.{' '}
                <span className="text-rose-500">*</span>
              </label>
              {errors.terms_agreed && (
                <p className="text-xs text-rose-600 font-medium mt-1">
                  {errors.terms_agreed}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div>
          <SubmitButton
            loading={loading}
            disabled={loading}
            label="Create Account"
          />
        </div>
      </form>

      {/* Registration Complete Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 transform transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Registration Submitted!</h4>
          <p className="text-[11px] text-slate-300">
            Student enrollment profile created successfully.
          </p>
        </div>
      </div>
    </div>
  );
}
