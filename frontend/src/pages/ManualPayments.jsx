import { useState, useEffect } from 'react';
import { 
  getManualPayments, 
  createManualPayment, 
  deleteManualPayment,
  createCustomer 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import ManualPaymentForm from '../components/ManualPaymentForm';

export default function ManualPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    payment_type: '',
    start_date: '',
    end_date: '',
  });
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.payment_type) params.payment_type = filters.payment_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      
      const response = await getManualPayments(params);
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      setError('');
      setSuccess('');
      
      let customerId = paymentData.customer_id;
      
      // If creating new customer
      if (paymentData.new_customer) {
        const customerResponse = await createCustomer(paymentData.new_customer);
        customerId = customerResponse.data.id;
      }
      
      // Create payment with proper datetime format
      const paymentPayload = {
        customer_id: parseInt(customerId),
        payment_type: paymentData.payment_type,
        amount: parseFloat(paymentData.amount),
        payment_date: new Date(paymentData.payment_date).toISOString(),
        check_number: paymentData.payment_type === 'check' ? paymentData.check_number : null,
        notes: paymentData.notes || null,
      };
      
      await createManualPayment(paymentPayload);
      setSuccess('Payment recorded successfully');
      setShowForm(false);
      loadPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      setError(error.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }
    
    try {
      await deleteManualPayment(id);
      setSuccess('Payment deleted successfully');
      loadPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      setError(error.response?.data?.detail || 'Failed to delete payment');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Customer', 'Type', 'Amount', 'Check #', 'Recorded By', 'Notes'];
    const rows = payments.map(p => [
      formatDate(p.payment_date),
      p.customer_name || '',
      p.payment_type,
      p.amount,
      p.check_number || '',
      p.recorded_by_name || '',
      p.notes || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manual-payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <svg className="h-8 w-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Manual Payments
              </h1>
              <p className="mt-2 text-blue-100">
                Record and manage cash and check payments from community members
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition duration-150 font-medium"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition duration-150 font-medium shadow-lg"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-400 p-4 shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 border-l-4 border-green-400 p-4 shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mt-6">
          <ManualPaymentForm
            onSubmit={handleCreatePayment}
            onCancel={() => {
              setShowForm(false);
              setError('');
            }}
          />
        </div>
      )}

      {/* Filters Card */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter Payments
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
            <select
              name="payment_type"
              value={filters.payment_type}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition"
            >
              <option value="">All Types</option>
              <option value="cash">💵 Cash</option>
              <option value="check">📝 Check</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ payment_type: '', start_date: '', end_date: '' })}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition duration-150"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payments List - Card Based Design */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="animate-spin h-10 w-10 mx-auto text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600">Start by recording a new payment</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-150 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      payment.payment_type === 'cash' 
                        ? 'bg-green-100' 
                        : 'bg-blue-100'
                    }`}>
                      {payment.payment_type === 'cash' ? (
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{payment.customer_name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.payment_type === 'cash' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {payment.payment_type === 'cash' ? '💵 Cash' : '📝 Check'}
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(payment.payment_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{formatAmount(payment.amount)}</div>
                    {payment.check_number && (
                      <div className="text-sm text-gray-500 mt-1">Check #{payment.check_number}</div>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Recorded by:</span>
                      <span className="ml-2 font-medium text-gray-900">{payment.recorded_by_name}</span>
                    </div>
                    {payment.notes && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Notes:</span>
                        <p className="mt-1 text-gray-700">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  {isAdmin() && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Payment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

