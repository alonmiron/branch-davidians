import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      setMessage(response.data?.message || 'If the email exists, a code has been sent.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email and we will send a one-time verification code.
        </p>

        {message && (
          <div className="mb-4 rounded-lg bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-md hover:shadow-lg"
          >
            {loading ? 'Sending...' : 'Send code'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600 flex items-center justify-between">
          <Link to="/reset-password" className="text-blue-600 hover:text-blue-700 font-medium">
            I have a code
          </Link>
          <Link to="/login" className="text-gray-600 hover:text-gray-800">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
