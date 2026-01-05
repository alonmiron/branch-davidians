import { useState, useEffect } from 'react';
import { getCharges, getCustomers } from '../services/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [customers, setCustomers] = useState([]);
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersRes, chargesRes] = await Promise.all([
        getCustomers(),
        getCharges({ year })
      ]);
      setCustomers(customersRes.data);
      setCharges(chargesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChargeForCustomerMonth = (customerId, month) => {
    return charges.find(c => c.customer_id === customerId && c.month === month);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotal = (customerId) => {
    return charges
      .filter(c => c.customer_id === customerId && c.status === 'success')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);
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
          <h1 className="text-2xl font-semibold text-gray-900">Billing Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monthly billing overview for all customers
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="block rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-gray-50 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Customer
                </th>
                {MONTHS.map((month, idx) => (
                  <th key={month} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {month}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="sticky left-0 z-10 bg-white whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {customer.payee_name}
                  </td>
                  {MONTHS.map((month, idx) => {
                    const charge = getChargeForCustomerMonth(customer.id, idx + 1);
                    return (
                      <td key={month} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {charge ? (
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(charge.status)}`}>
                            {charge.status === 'success' ? `₪${charge.amount}` : charge.status}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900">
                    ₪{calculateTotal(customer.id).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



