import { useState, useEffect } from 'react';

export default function CustomerForm({ customer, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    taxpayer_id: '',
    address: '',
    landlord_name: '',
    payee_name: '',
    monthly_amount: '',
    phone_number: '',
    email: '',
    payment_method: 'credit',
    current_card_token: '',
    current_card_expiry: '',
    currency: 1,
    tranmode: 'A',
    cred_type: 1,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        taxpayer_id: customer.taxpayer_id || '',
        address: customer.address || '',
        landlord_name: customer.landlord_name || '',
        payee_name: customer.payee_name || '',
        monthly_amount: customer.monthly_amount || '',
        phone_number: customer.phone_number || '',
        email: customer.email || '',
        payment_method: customer.payment_method || 'credit',
        current_card_token: customer.current_card_token || '',
        current_card_expiry: customer.current_card_expiry || '',
        currency: customer.currency || 1,
        tranmode: customer.tranmode || 'A',
        cred_type: customer.cred_type || 1,
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate card fields for credit customers
    if (formData.payment_method === 'credit') {
      if (!formData.current_card_token || !formData.current_card_expiry) {
        alert('Card token and expiry are required for credit card customers');
        return;
      }
    }
    
    onSubmit(formData);
  };

  const isCreditCustomer = formData.payment_method === 'credit';

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="taxpayer_id" className="block text-sm font-medium text-gray-700">
              Taxpayer ID *
            </label>
            <input
              type="text"
              name="taxpayer_id"
              id="taxpayer_id"
              required
              value={formData.taxpayer_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="payee_name" className="block text-sm font-medium text-gray-700">
              Payee Name *
            </label>
            <input
              type="text"
              name="payee_name"
              id="payee_name"
              required
              value={formData.payee_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address *
            </label>
            <input
              type="text"
              name="address"
              id="address"
              required
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="landlord_name" className="block text-sm font-medium text-gray-700">
              Landlord Name (if renting)
            </label>
            <input
              type="text"
              name="landlord_name"
              id="landlord_name"
              value={formData.landlord_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="monthly_amount" className="block text-sm font-medium text-gray-700">
              Monthly Amount *
            </label>
            <input
              type="number"
              step="0.01"
              name="monthly_amount"
              id="monthly_amount"
              required
              value={formData.monthly_amount}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              id="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
              Payment Method *
            </label>
            <select
              name="payment_method"
              id="payment_method"
              required
              value={formData.payment_method}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="credit">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
            </select>
          </div>

          {isCreditCustomer && (
            <>
              <div>
                <label htmlFor="current_card_token" className="block text-sm font-medium text-gray-700">
                  Card Token *
                </label>
                <input
                  type="text"
                  name="current_card_token"
                  id="current_card_token"
                  required={isCreditCustomer}
                  value={formData.current_card_token}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                />
              </div>

              <div>
                <label htmlFor="current_card_expiry" className="block text-sm font-medium text-gray-700">
                  Card Expiry (MMYY) *
                </label>
                <input
                  type="text"
                  name="current_card_expiry"
                  id="current_card_expiry"
                  required={isCreditCustomer}
                  pattern="\d{3,4}"
                  maxLength="4"
                  placeholder="1225"
                  value={formData.current_card_expiry}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {customer ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );
}



