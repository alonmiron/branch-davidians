import { useState, useEffect } from 'react';
import { getFailedCharges, getCustomers, updateChargeNotes, getErrorCodes } from '../services/api';

export default function FailedCharges() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [charges, setCharges] = useState([]);
  const [customers, setCustomers] = useState({});
  const [errorCodes, setErrorCodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notes, setNotes] = useState('');
  const [contacted, setContacted] = useState(0);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chargesRes, customersRes, errorCodesRes] = await Promise.all([
        getFailedCharges(year),
        getCustomers(),
        getErrorCodes()
      ]);
      
      setCharges(chargesRes.data);
      
      const customersMap = {};
      customersRes.data.forEach(c => {
        customersMap[c.id] = c;
      });
      setCustomers(customersMap);

      const errorCodesMap = {};
      errorCodesRes.data.forEach(ec => {
        errorCodesMap[ec.response_code] = ec.description;
      });
      setErrorCodes(errorCodesMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNotes = (charge) => {
    setEditingNotes(charge.id);
    setNotes(charge.notes || '');
    setContacted(charge.contacted);
  };

  const handleSaveNotes = async () => {
    try {
      await updateChargeNotes(editingNotes, { notes, contacted });
      setEditingNotes(null);
      loadData();
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes');
    }
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNotes('');
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
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
          <h1 className="text-2xl font-semibold text-gray-900">Failed Charges</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and manage failed payment charges
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

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {charges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No failed charges found for {year}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Month
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Error
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Notes
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {charges.map((charge) => {
                    const customer = customers[charge.customer_id];
                    return (
                      <tr key={charge.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          {customer ? customer.payee_name : 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getMonthName(charge.month)} {charge.year}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ₪{charge.amount}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="font-mono text-xs text-red-600">Code: {charge.error_code}</div>
                          <div className="text-xs">{errorCodes[charge.error_code] || 'Unknown error'}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            charge.contacted ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {charge.contacted ? 'Contacted' : 'Not Contacted'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {editingNotes === charge.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                rows="2"
                              />
                              <div className="flex items-center space-x-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={contacted === 1}
                                    onChange={(e) => setContacted(e.target.checked ? 1 : 0)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-600">Contacted</span>
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm">{charge.notes || '-'}</div>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          {editingNotes === charge.id ? (
                            <>
                              <button
                                onClick={handleSaveNotes}
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditNotes(charge)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



