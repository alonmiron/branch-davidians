import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCardHistory } from '../services/api';
import CustomerForm from '../components/CustomerForm';
import CardHistoryModal from '../components/CardHistoryModal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }
    try {
      await deleteCustomer(customerId);
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
      } else {
        await createCustomer(data);
      }
      setShowForm(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const viewHistory = (customerId) => {
    setSelectedCustomerHistory(customerId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer information and payment details
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleCreate}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Customer
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="mt-8">
          <CustomerForm
            customer={editingCustomer}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Taxpayer ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Payee Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Address
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Monthly Amount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Card Expiry
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        {customer.taxpayer_id}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{customer.payee_name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{customer.address}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">₪{customer.monthly_amount}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{customer.current_card_expiry}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <button
                          onClick={() => viewHistory(customer.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedCustomerHistory && (
        <CardHistoryModal
          customerId={selectedCustomerHistory}
          onClose={() => setSelectedCustomerHistory(null)}
        />
      )}
    </div>
  );
}



