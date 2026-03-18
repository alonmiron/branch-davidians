import { Link } from 'react-router-dom';

const PAYMENT_LINKS = [
  {
    to: '/',
    label: 'Billing Dashboard',
    description: 'Monthly billing overview for all customers',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
    color: 'blue',
  },
  {
    to: '/customers',
    label: 'Customers',
    description: 'Manage payer accounts and details',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    color: 'indigo',
  },
  {
    to: '/manual-payments',
    label: 'Manual Payments',
    description: 'Record cash, check and bank transfer payments',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    color: 'green',
  },
  {
    to: '/cc-payments',
    label: 'Credit Card Payments',
    description: 'Charge and track credit card transactions',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    ),
    color: 'purple',
  },
  {
    to: '/cc-archive',
    label: 'CC Archive',
    description: 'Historical credit card payment records',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    ),
    color: 'yellow',
  },
  {
    to: '/batch',
    label: 'Batch Operations',
    description: 'Process payments in bulk for multiple customers',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    color: 'orange',
  },
  {
    to: '/failed',
    label: 'Failed Charges',
    description: 'Review and retry failed payment attempts',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
    color: 'red',
  },
];

const COLOR_MAP = {
  blue:   'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
  indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
  green:  'bg-green-50 text-green-600 group-hover:bg-green-100',
  purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
  yellow: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100',
  orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
  red:    'bg-red-50 text-red-600 group-hover:bg-red-100',
};

export default function PaymentsHub() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-2 text-sm text-gray-700">
            All payment tools and records for the community
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PAYMENT_LINKS.map(({ to, label, description, icon, color }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition"
          >
            <div className={`flex-shrink-0 h-11 w-11 rounded-lg flex items-center justify-center transition ${COLOR_MAP[color]}`}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {icon}
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
