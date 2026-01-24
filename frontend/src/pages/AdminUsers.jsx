import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, register, updateUser, deleteUser } from '../services/api';

const defaultForm = {
  username: '',
  email: '',
  full_name: '',
  role: 'payment_clerk',
  password: '',
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setError('');
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setFormLoading(true);
    try {
      await register(form);
      setMessage('User created successfully.');
      setForm(defaultForm);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRowChange = (id, field, value) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  };

  const handleSave = async (user) => {
    setError('');
    setMessage('');
    setSavingId(user.id);
    try {
      await updateUser(user.id, {
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        requires_password_reset: user.requires_password_reset,
      });
      setMessage(`Updated ${user.username}.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setSavingId(null);
    }
  };

  const handleForcePasswordReset = async (user) => {
    setError('');
    setMessage('');
    setSavingId(user.id);
    try {
      await updateUser(user.id, { requires_password_reset: true });
      handleRowChange(user.id, 'requires_password_reset', true);
      setMessage(`Password reset required for ${user.username}.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to force password reset');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      return;
    }
    if (!window.confirm(`Delete user ${user.username}?`)) {
      return;
    }
    setError('');
    setMessage('');
    setSavingId(user.id);
    try {
      await deleteUser(user.id);
      setMessage(`Deleted ${user.username}.`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Admin users</h2>
        <p className="text-sm text-gray-600">
          Manage user access, roles, and forced password resets.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add user</h3>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="full_name">
              Full name
            </label>
            <input
              id="full_name"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="payment_clerk">Payment clerk</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
              Temporary password
            </label>
            <input
              id="password"
              type="password"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={formLoading}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">All users</h3>
        {loading ? (
          <div className="text-gray-600">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600 border-b">
                <tr>
                  <th className="py-2 pr-4">Username</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Active</th>
                  <th className="py-2 pr-4">Pwd reset</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="text-gray-800">
                    <td className="py-3 pr-4 font-medium">{u.username}</td>
                    <td className="py-3 pr-4">
                      <input
                        className="w-full border border-gray-200 rounded px-2 py-1"
                        value={u.email}
                        onChange={(e) => handleRowChange(u.id, 'email', e.target.value)}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        className="w-full border border-gray-200 rounded px-2 py-1"
                        value={u.full_name}
                        onChange={(e) => handleRowChange(u.id, 'full_name', e.target.value)}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className="border border-gray-200 rounded px-2 py-1"
                        value={u.role}
                        onChange={(e) => handleRowChange(u.id, 'role', e.target.value)}
                      >
                        <option value="payment_clerk">Payment clerk</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={!!u.is_active}
                        onChange={(e) => handleRowChange(u.id, 'is_active', e.target.checked)}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={!!u.requires_password_reset}
                        onChange={(e) =>
                          handleRowChange(u.id, 'requires_password_reset', e.target.checked)
                        }
                      />
                    </td>
                    <td className="py-3 pr-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSave(u)}
                        disabled={savingId === u.id}
                        className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => handleForcePasswordReset(u)}
                        disabled={savingId === u.id}
                        className="px-3 py-1 rounded bg-yellow-500 text-white disabled:opacity-50"
                      >
                        Force reset
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={savingId === u.id || u.id === currentUser?.id}
                        className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
