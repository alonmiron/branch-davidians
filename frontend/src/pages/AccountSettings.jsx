import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword, updateEmail, verifyResetCode } from '../services/api';

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [emailCode, setEmailCode] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setEmail(user?.email || '');
  }, [user?.email]);

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setEmailLoading(true);
    try {
      const response = await updateEmail(email);
      setEmailMessage(response.data?.message || 'Verification code sent');
    } catch (err) {
      setEmailError(err.response?.data?.detail || 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailVerify = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setVerifyLoading(true);
    try {
      const response = await verifyResetCode(email, emailCode, 'email_verify');
      setEmailMessage(response.data?.message || 'Email verified');
      await refreshUser();
      setEmailCode('');
    } catch (err) {
      setEmailError(err.response?.data?.detail || 'Failed to verify code');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await changePassword(currentPassword, newPassword);
      setPasswordMessage(response.data?.message || 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Account settings</h2>
        <p className="text-sm text-gray-600">
          Update your email and password. Email is required for password recovery.
        </p>
        {user?.requires_email_update && (
          <div className="mt-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-800">
            Please update your email to continue using the system.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Email</h3>
        {emailMessage && (
          <div className="mb-4 rounded-lg bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-800">
            {emailMessage}
          </div>
        )}
        {emailError && (
          <div className="mb-4 rounded-lg bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-800">
            {emailError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleEmailUpdate}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-2 text-xs text-gray-500">
              Status: {user?.email_verified ? 'Verified' : 'Unverified'}
            </p>
          </div>
          <button
            type="submit"
            disabled={emailLoading}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {emailLoading ? 'Sending code...' : 'Send verification code'}
          </button>
        </form>

        <form className="mt-6 space-y-4" onSubmit={handleEmailVerify}>
          <div>
            <label htmlFor="emailCode" className="block text-sm font-medium text-gray-700 mb-2">
              Verification code
            </label>
            <input
              id="emailCode"
              name="emailCode"
              type="text"
              required
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              placeholder="6-digit code"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={verifyLoading}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {verifyLoading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change password</h3>
        {passwordMessage && (
          <div className="mb-4 rounded-lg bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-800">
            {passwordMessage}
          </div>
        )}
        {passwordError && (
          <div className="mb-4 rounded-lg bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-800">
            {passwordError}
          </div>
        )}
        <form className="space-y-4" onSubmit={handlePasswordChange}>
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {passwordLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
