import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, register, updateUser, deleteUser } from '../services/api';

const defaultForm = {
  username: '',
  email: '',
  full_name: '',
  role: 'payment_clerk',
  phone_country: '+972',
  phone_number: '',
  password: '',
};

const countryCodes = [
  { value: '+972', label: 'Israel (+972)' },
  { value: '+1', label: 'United States (+1)' },
  { value: '+44', label: 'United Kingdom (+44)' },
  { value: '+33', label: 'France (+33)' },
  { value: '+49', label: 'Germany (+49)' },
  { value: '+34', label: 'Spain (+34)' },
  { value: '+39', label: 'Italy (+39)' },
];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [passwordByUser, setPasswordByUser] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [formLoading, setFormLoading] = useState(false);
  const [hebrewFormat, setHebrewFormat] = useState(
    () => localStorage.getItem('adminUsersHebrewFormat') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('adminUsersHebrewFormat', hebrewFormat ? 'true' : 'false');
  }, [hebrewFormat]);

  const fetchUsers = async () => {
    setError('');
    try {
      const response = await getUsers();
      const normalized = (response.data || []).map((u) => ({
        ...u,
        phone_country: u.phone_country || '',
        phone_number: u.phone_number || '',
      }));
      setUsers(normalized);
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
        phone_country: user.phone_country,
        phone_number: user.phone_number,
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

  const handleSetPassword = async (user) => {
    const newPassword = passwordByUser[user.id];
    if (!newPassword) {
      return;
    }
    setError('');
    setMessage('');
    setSavingId(user.id);
    try {
      await updateUser(user.id, { password: newPassword });
      setMessage(`Password updated for ${user.username}.`);
      setPasswordByUser((prev) => ({ ...prev, [user.id]: '' }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setSavingId(null);
    }
  };

  const labels = hebrewFormat
    ? {
        title: 'ניהול משתמשים',
        subtitle: 'ניהול גישה, תפקידים ואיפוס סיסמה.',
        addUser: 'הוספת משתמש',
        allUsers: 'כל המשתמשים',
        username: 'שם משתמש',
        email: 'אימייל',
        fullName: 'שם מלא',
        role: 'תפקיד',
        active: 'פעיל',
        pwdReset: 'איפוס סיסמה',
        phone: 'טלפון',
        countryCode: 'קידומת',
        phoneNumber: 'מספר',
        tempPassword: 'סיסמה זמנית',
        createUser: 'צור משתמש',
        saving: 'שומר...',
        save: 'שמור',
        forceReset: 'חייב איפוס',
        delete: 'מחק',
        setPassword: 'עדכון סיסמה',
        newPassword: 'סיסמה חדשה',
        hebrewToggle: 'תצוגת עברית',
        actions: 'פעולות',
      }
    : {
        title: 'Admin users',
        subtitle: 'Manage user access, roles, and forced password resets.',
        addUser: 'Add user',
        allUsers: 'All users',
        username: 'Username',
        email: 'Email',
        fullName: 'Full name',
        role: 'Role',
        active: 'Active',
        pwdReset: 'Pwd reset',
        phone: 'Phone',
        countryCode: 'Country code',
        phoneNumber: 'Phone number',
        tempPassword: 'Temporary password',
        createUser: 'Create user',
        saving: 'Saving...',
        save: 'Save',
        forceReset: 'Force reset',
        delete: 'Delete',
        setPassword: 'Set password',
        newPassword: 'New password',
        hebrewToggle: 'Hebrew format',
        actions: 'Actions',
      };

  return (
    <div className={`space-y-6 ${hebrewFormat ? 'text-right' : ''}`} dir={hebrewFormat ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{labels.title}</h2>
            <p className="text-sm text-gray-600">{labels.subtitle}</p>
          </div>
          <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={hebrewFormat}
              onChange={(e) => setHebrewFormat(e.target.checked)}
            />
            <span>{labels.hebrewToggle}</span>
          </label>
        </div>
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{labels.allUsers}</h3>
        {loading ? (
          <div className="text-gray-600">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600 border-b">
                <tr>
                  <th className="py-2 pr-4">{labels.username}</th>
                  <th className="py-2 pr-4">{labels.email}</th>
                  <th className="py-2 pr-4">{labels.fullName}</th>
                  <th className="py-2 pr-4">{labels.role}</th>
                  <th className="py-2 pr-4">{labels.phone}</th>
                  <th className="py-2 pr-4">{labels.active}</th>
                  <th className="py-2 pr-4">{labels.pwdReset}</th>
                  <th className="py-2 pr-4">{labels.setPassword}</th>
                  <th className="py-2 pr-4">{labels.actions}</th>
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
                        <option value="mehamemet">Mehamemet</option>
                        <option value="community_data_administrator">Community Data Administrator</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-2">
                        <select
                          className="border border-gray-200 rounded px-2 py-1"
                          value={u.phone_country}
                          onChange={(e) => handleRowChange(u.id, 'phone_country', e.target.value)}
                        >
                          <option value="">{labels.countryCode}</option>
                          {countryCodes.map((code) => (
                            <option key={code.value} value={code.value}>
                              {code.label}
                            </option>
                          ))}
                        </select>
                        <input
                          className="w-full border border-gray-200 rounded px-2 py-1"
                          placeholder={labels.phoneNumber}
                          value={u.phone_number}
                          onChange={(e) => handleRowChange(u.id, 'phone_number', e.target.value)}
                        />
                      </div>
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
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="password"
                          className="border border-gray-200 rounded px-2 py-1"
                          placeholder={labels.newPassword}
                          value={passwordByUser[u.id] || ''}
                          onChange={(e) =>
                            setPasswordByUser((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleSetPassword(u)}
                          disabled={savingId === u.id || !(passwordByUser[u.id] || '')}
                          className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                        >
                          {labels.setPassword}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSave(u)}
                        disabled={savingId === u.id}
                        className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                      >
                        {savingId === u.id ? labels.saving : labels.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleForcePasswordReset(u)}
                        disabled={savingId === u.id}
                        className="px-3 py-1 rounded bg-yellow-500 text-white disabled:opacity-50"
                      >
                        {labels.forceReset}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={savingId === u.id || u.id === currentUser?.id}
                        className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
                      >
                        {labels.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{labels.addUser}</h3>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="username">
              {labels.username}
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
              {labels.email}
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
              {labels.fullName}
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
              {labels.role}
            </label>
            <select
              id="role"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="payment_clerk">Payment clerk</option>
              <option value="admin">Admin</option>
              <option value="mehamemet">Mehamemet</option>
              <option value="community_data_administrator">Community Data Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone_country">
              {labels.countryCode}
            </label>
            <select
              id="phone_country"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={form.phone_country}
              onChange={(e) => setForm({ ...form, phone_country: e.target.value })}
              required
            >
              {countryCodes.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone_number">
              {labels.phoneNumber}
            </label>
            <input
              id="phone_number"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
              {labels.tempPassword}
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
              {formLoading ? 'Creating...' : labels.createUser}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
