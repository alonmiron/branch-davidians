import { useState, useEffect } from 'react';
import { getCustomers, getNonCreditCustomers } from '../services/api';

export default function ManualPaymentForm({ onSubmit, onCancel }) {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    payment_type: 'cash',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    check_number: '',
    notes: '',
  });

  const [newCustomer, setNewCustomer] = useState({
    taxpayer_id: '',
    payee_name: '',
    address: '',
    phone_number: '',
    email: '',
    monthly_amount: '',
    payment_method: 'cash',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If creating new customer, submit that data along with payment
    if (showNewCustomer) {
      onSubmit({ ...formData, new_customer: newCustomer });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg sm:rounded-lg border-2 border-blue-100">
      <div className="px-4 py-5 sm:p-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-lg">
          <h3 className="text-xl font-bold leading-6 text-white flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Manual Payment
          </h3>
          <p className="mt-1 text-sm text-blue-100">
            Enter payment details for cash or check transactions
          </p>
        </div>

        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                Customer *
              </label>
              <button
                type="button"
                onClick={() => setShowNewCustomer(!showNewCustomer)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showNewCustomer ? 'Select Existing' : 'Create New Customer'}
              </button>
            </div>

            {!showNewCustomer ? (
              <select
                name="customer_id"
                required
                value={formData.customer_id}
                onChange={handleChange}
                disabled={loadingCustomers}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.payee_name} ({customer.taxpayer_id})
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 border-2 border-blue-100 rounded-lg bg-white">
                <div className="sm:col-span-2">
                  <p className="text-xs text-blue-600 font-medium mb-3">Create new non-credit customer</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Taxpayer ID *
                  </label>
                  <input
                    type="text"
                    name="taxpayer_id"
                    required={showNewCustomer}
                    value={newCustomer.taxpayer_id}
                    onChange={handleNewCustomerChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="payee_name"
                    required={showNewCustomer}
                    value={newCustomer.payee_name}
                    onChange={handleNewCustomerChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required={showNewCustomer}
                    value={newCustomer.address}
                    onChange={handleNewCustomerChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={newCustomer.phone_number}
                    onChange={handleNewCustomerChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newCustomer.email}
                    onChange={handleNewCustomerChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Monthly Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="monthly_amount"
                    required={showNewCustomer}
                    value={newCustomer.monthly_amount}
                    onChange={handleNewCustomerChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Type */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Payment Type *
            </label>
            <div className="flex space-x-4">
              <label className="flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition duration-150 hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="payment_type"
                  value="cash"
                  checked={formData.payment_type === 'cash'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-base font-medium text-gray-900">💵 Cash</span>
              </label>
              <label className="flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition duration-150 hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="payment_type"
                  value="check"
                  checked={formData.payment_type === 'check'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-base font-medium text-gray-900">📝 Check</span>
              </label>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₪) *
              </label>
              <input
                type="number"
                step="0.01"
                name="amount"
                id="amount"
                required
                value={formData.amount}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                name="payment_date"
                id="payment_date"
                required
                value={formData.payment_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {formData.payment_type === 'check' && (
              <div>
                <label htmlFor="check_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Check Number *
                </label>
                <input
                  type="text"
                  name="check_number"
                  id="check_number"
                  required={formData.payment_type === 'check'}
                  value={formData.check_number}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}

            <div className={formData.payment_type === 'check' ? '' : 'sm:col-span-2'}>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                id="notes"
                rows="2"
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3 pt-5 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border-2 border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
          >
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Record Payment
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}

