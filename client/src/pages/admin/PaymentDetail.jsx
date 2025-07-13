import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { API_URL } from '../../config/index';
import { 
  ArrowLeft, CreditCard, User, Calendar, DollarSign,
  CheckCircle, XCircle, Clock, AlertTriangle, Download, Eye
} from 'lucide-react';

const PaymentDetail = ({ id }) => {
  const [location, setLocation] = useLocation();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    fetchPaymentDetail();
  }, [id]);  const fetchPaymentDetail = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/admin/payments/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPayment(data.data);
      } else {
        setError(data.error || 'Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      setError('Failed to fetch payment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'refunded': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      case 'refunded': return AlertTriangle;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error ? 'Error Loading Payment' : 'Payment Not Found'}
          </h2>
          {error && (
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          )}
          <button
            onClick={() => setLocation('/admin')}
            className="text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  const StatusIcon = getStatusIcon(payment?.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">              <button
                onClick={() => setLocation('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center space-x-3">
                <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment?.status)}`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {payment?.status || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Details
              </h1>              <p className="text-gray-600 dark:text-gray-400">
                Transaction ID: {payment?.transactionId || payment?.purchaseOrderId || payment?._id || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Payment Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Information</h3>
              
              <div className="space-y-4">                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    NPR {payment?.amount?.toLocaleString() || '0'}
                  </span>
                </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Platform Fee</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    NPR {payment?.platformFee?.toLocaleString() || '0'}
                  </span>
                </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {payment?.paymentMethod?.toUpperCase() || 'N/A'}
                  </span>
                </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Transaction Date</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                  {payment?.transactionId && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
                    <span className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                      {payment.transactionId}
                    </span>
                  </div>
                )}
                
                {payment?.purchaseOrderId && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Purchase Order ID</span>
                    <span className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                      {payment.purchaseOrderId}
                    </span>
                  </div>
                )}
                
                {payment?.pidx && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 dark:text-gray-400">Payment Index</span>
                    <span className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                      {payment.pidx}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Donor Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Donor Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {payment?.donorName || payment?.userId?.name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {payment?.donorEmail || payment?.userId?.email || 'No email provided'}
                    </div>
                  </div>
                </div>
                  {payment?.donorPhone && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Phone</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {payment.donorPhone}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Anonymous Donation</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {payment?.donorName === 'Anonymous' ? 'Yes' : 'No'}
                  </span>
                </div>
                
                {payment?.donorMessage && (
                  <div className="py-3">
                    <span className="text-gray-600 dark:text-gray-400 block mb-2">Message</span>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {payment.donorMessage}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>        {/* Campaign Information */}
        {payment?.campaignId && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Information</h3>
                {payment.campaignId && (
                  <button
                    onClick={() => {
                      const campaignId = typeof payment.campaignId === 'object' 
                        ? payment.campaignId?._id 
                        : payment.campaignId;
                      if (campaignId) {
                        setLocation(`/admin/campaign/${campaignId}`);
                      }
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-500 text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Campaign
                  </button>
                )}
              </div><div className="flex items-center space-x-4">
                {payment.campaignId?.images?.[0] && (
                  <img 
                    src={payment.campaignId.images[0]} 
                    alt={payment.campaignId?.title || 'Campaign'}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    {payment.campaignId?.title || 'Campaign Title Not Available'}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {payment.campaignId?.status || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Target</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        NPR {payment.campaignId?.targetAmount?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Raised</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        NPR {payment.campaignId?.amountRaised?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {payment.campaignId?.targetAmount 
                          ? Math.round((payment.campaignId?.amountRaised || 0) / payment.campaignId.targetAmount * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Technical Details</h3>
              <button className="text-blue-600 hover:text-blue-500 text-sm">
                <Download className="w-4 h-4 inline mr-1" />
                Export Details
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment ID</span>
                  <div className="text-sm font-mono text-gray-900 dark:text-white">{payment?._id || 'N/A'}</div>
                </div>                {payment?.userId && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</span>
                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                      {typeof payment.userId === 'object' ? payment.userId?._id : payment.userId}
                    </div>
                  </div>
                )}<div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Campaign ID</span>
                  <div className="text-sm font-mono text-gray-900 dark:text-white">
                    {payment.campaignId 
                      ? (typeof payment.campaignId === 'object' ? payment.campaignId?._id : payment.campaignId) 
                      : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</span>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated At</span>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {payment.updatedAt ? new Date(payment.updatedAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                  <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Is Processed</span>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {payment?.isProcessed ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
            <div className="flex space-x-4">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-5 h-5 mr-2" />
                Download Receipt
              </button>
                {payment?.status === 'Completed' && (
                <button className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Issue Refund
                </button>
              )}
              
              <button 
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Print Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
