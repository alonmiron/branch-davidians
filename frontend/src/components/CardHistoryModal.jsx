import { useState, useEffect } from 'react';
import { getCardHistory } from '../services/api';

export default function CardHistoryModal({ customerId, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [customerId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await getCardHistory(customerId);
      setHistory(response.data);
    } catch (error) {
      console.error('Error loading card history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Card History
            </h3>

            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No card history found</div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Token
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Expiry
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Replaced
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-900 sm:pl-0">
                          {item.old_card_token.substring(0, 10)}...
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.old_card_expiry}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(item.replaced_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



