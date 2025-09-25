import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CreditCard,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

interface Invoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  total: number;
  invoicePdf: string;
}

interface BillingStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

interface BillingOverview {
  recentInvoices: Invoice[];
  upcomingInvoice: Invoice | null;
  stats: BillingStats;
}

const PaymentMethodForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update payment method on server
      await axios.put('/api/billing/payment-method', {
        paymentMethodId: paymentMethod.id,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }} />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update Payment Method'}
      </button>
    </form>
  );
};

const BillingDashboard: React.FC = () => {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBillingData();
  }, [userId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/billing/overview/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await axios.get(`/api/billing/invoice/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoice.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download invoice:', err);
    }
  };

  if (loading) return <div>Loading billing information...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!overview) return <div>No billing data available</div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'overdue':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Billing Dashboard</h1>

      {/* Billing Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Paid</p>
              <p className="text-2xl font-semibold text-green-500">
                {formatCurrency(overview.stats.totalPaid)}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Pending Payments</p>
              <p className="text-2xl font-semibold text-yellow-500">
                {formatCurrency(overview.stats.totalPending)}
              </p>
            </div>
            <Clock className="text-yellow-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Overdue Amount</p>
              <p className="text-2xl font-semibold text-red-500">
                {formatCurrency(overview.stats.totalOverdue)}
              </p>
            </div>
            <AlertCircle className="text-red-500" size={24} />
          </div>
        </div>
      </div>

      {/* Upcoming Invoice */}
      {overview.upcomingInvoice && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Upcoming Payment</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Invoice #{overview.upcomingInvoice.invoiceNumber}</p>
              <p className="text-2xl font-bold">{formatCurrency(overview.upcomingInvoice.total)}</p>
              <p className="text-gray-500">
                Due on {format(new Date(overview.upcomingInvoice.dueDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Pay Now
            </button>
          </div>
        </div>
      )}

      {/* Payment Method Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
        {showPaymentForm ? (
          <Elements stripe={stripePromise}>
            <PaymentMethodForm onSuccess={() => {
              setShowPaymentForm(false);
              fetchBillingData();
            }} />
          </Elements>
        ) : (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <CreditCard className="mr-2" size={20} />
            Update Payment Method
          </button>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Invoice #</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Amount</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentInvoices.map((invoice) => (
                <tr key={invoice._id} className="border-b">
                  <td className="py-3">{invoice.invoiceNumber}</td>
                  <td className="py-3">
                    {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3">{formatCurrency(invoice.total)}</td>
                  <td className="py-3">
                    <span className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDownloadInvoice(invoice._id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Download size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;