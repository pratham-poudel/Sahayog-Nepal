import { useState } from 'react';
import {
  X,
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Building,
  CreditCard,
  Phone,
  Shield,
  ExternalLink,
  Eye,
  Target
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const WithdrawalVerificationModal = ({ withdrawal, onClose, onVerificationComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState(''); // 'approve' or 'reject'
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      const res = await fetch(`${API_BASE_URL}/api/employee/withdrawals/${withdrawal._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: approvalNotes
        })
      });

      const data = await res.json();

      if (data.success) {
        onVerificationComplete();
        onClose();
      } else {
        setError(data.message || 'Failed to approve withdrawal');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason (minimum 10 characters)');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      const res = await fetch(`${API_BASE_URL}/api/employee/withdrawals/${withdrawal._id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: rejectionReason
        })
      });

      const data = await res.json();

      if (data.success) {
        onVerificationComplete();
        onClose();
      } else {
        setError(data.message || 'Failed to reject withdrawal');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      approved: 'text-green-700 bg-green-100 border-green-300',
      rejected: 'text-red-700 bg-red-100 border-red-300',
      processing: 'text-blue-700 bg-blue-100 border-blue-300',
      completed: 'text-purple-700 bg-purple-100 border-purple-300'
    };
    return colors[status] || colors.pending;
  };

  const canProcess = withdrawal.status === 'pending' && !withdrawal.employeeProcessedBy?.employeeId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-blue-900 text-white p-4 flex items-center justify-between border-b-4 border-red-600 z-10">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide">Withdrawal Request Verification</h2>
            <p className="text-sm opacity-90">Review and process withdrawal request</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-md border ${getStatusColor(withdrawal.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg uppercase">Status: {withdrawal.status}</p>
                <p className="text-sm">Request ID: {withdrawal._id}</p>
                <p className="text-sm">Created: {formatDate(withdrawal.createdAt)}</p>
              </div>
              {!canProcess && (
                <div className="text-sm">
                  <AlertTriangle className="w-8 h-8 inline-block mb-1" />
                  <p className="font-medium">Cannot process this request</p>
                  <p className="text-xs">Status: {withdrawal.status}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-md flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Campaign Information */}
              <div className="border border-gray-300 rounded-md p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Campaign Information
                </h3>
                {withdrawal.campaign?.coverImage && (
                  <img
                    src={withdrawal.campaign.coverImage}
                    alt={withdrawal.campaign.title}
                    className="w-full h-40 object-cover rounded-md mb-3"
                  />
                )}
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-lg">{withdrawal.campaign?.title}</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>Target: {formatCurrency(withdrawal.campaign?.targetAmount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Raised: {formatCurrency(withdrawal.campaign?.amountRaised || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Withdrawn: {formatCurrency(withdrawal.campaign?.amountWithdrawn || 0)}</span>
                  </div>
                  <div className={`inline-block px-2 py-1 rounded text-xs border ${getStatusColor(withdrawal.campaign?.status)}`}>
                    {withdrawal.campaign?.status?.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Creator Information */}
              <div className="border border-gray-300 rounded-md p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Creator Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {withdrawal.creator?.profilePicture && (
                      <img
                        src={withdrawal.creator.profilePicture}
                        alt={withdrawal.creator.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{withdrawal.creator?.name}</p>
                      <p className="text-sm text-gray-600">{withdrawal.creator?.email}</p>
                      <p className="text-sm text-gray-600">{withdrawal.creator?.phone}</p>
                    </div>
                  </div>

                  {/* KYC Status */}
                  <div className={`p-3 rounded-md border ${withdrawal.creator?.kycVerified ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex items-center gap-2">
                      {withdrawal.creator?.kycVerified ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-700" />
                          <div className="flex-1">
                            <p className="font-medium text-green-900">KYC Verified</p>
                            <p className="text-xs text-green-700">Creator identity verified</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-700" />
                          <div className="flex-1">
                            <p className="font-medium text-red-900">KYC Not Verified</p>
                            <p className="text-xs text-red-700">Creator identity not verified</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Reason */}
              <div className="border border-gray-300 rounded-md p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Withdrawal Reason
                </h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md italic">
                  "{withdrawal.reason}"
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Type: <span className="font-medium">{withdrawal.withdrawalType}</span>
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Bank Account Details */}
              <div className="border border-gray-300 rounded-md p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Bank Account Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Bank Name</p>
                      <p className="font-medium">{withdrawal.bankAccount?.bankName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Account Number</p>
                      <p className="font-medium font-mono">{withdrawal.bankAccount?.accountNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Account Name</p>
                      <p className="font-medium">{withdrawal.bankAccount?.accountName}</p>
                    </div>
                  </div>

                  {withdrawal.bankAccount?.ifscCode && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">IFSC Code</p>
                        <p className="font-medium font-mono">{withdrawal.bankAccount.ifscCode}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Associated Phone</p>
                      <p className="font-medium">{withdrawal.bankAccount?.associatedPhoneNumber}</p>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className={`p-3 rounded-md border mt-3 ${withdrawal.bankAccount?.verificationStatus === 'verified' ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
                    <div className="flex items-center gap-2">
                      {withdrawal.bankAccount?.verificationStatus === 'verified' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-700" />
                          <div className="flex-1">
                            <p className="font-medium text-green-900">Bank Account Verified</p>
                            <p className="text-xs text-green-700">
                              Verified on {withdrawal.bankAccount.verificationDate ? formatDate(withdrawal.bankAccount.verificationDate) : 'N/A'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-yellow-700" />
                          <div className="flex-1">
                            <p className="font-medium text-yellow-900">Bank Account Not Verified</p>
                            <p className="text-xs text-yellow-700">Verification pending</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Document Viewer */}
                  {withdrawal.bankAccount?.documentImage && (
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <p className="text-xs text-gray-500 mb-2">
                        Document Type: <span className="font-medium">{withdrawal.bankAccount.documentType}</span>
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Document Number: <span className="font-medium">{withdrawal.bankAccount.documentNumber}</span>
                      </p>
                      <button
                        onClick={() => setShowDocumentViewer(!showDocumentViewer)}
                        className="flex items-center gap-2 text-blue-900 hover:text-blue-700 font-medium text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        {showDocumentViewer ? 'Hide' : 'View'} Bank Verification Document
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Viewer */}
              {showDocumentViewer && withdrawal.bankAccount?.documentImage && (
                <div className="border border-gray-300 rounded-md p-4">
                  <h3 className="font-bold text-gray-900 mb-3">Bank Verification Document</h3>
                  <img
                    src={withdrawal.bankAccount.documentImage}
                    alt="Bank Document"
                    className="w-full rounded-md border border-gray-300"
                  />
                  <a
                    href={withdrawal.bankAccount.documentImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-900 hover:text-blue-700 text-sm mt-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in new tab
                  </a>
                </div>
              )}

              {/* Withdrawal Amount Summary */}
              <div className="border border-blue-300 rounded-md p-4 bg-blue-50">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Withdrawal Amount Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Available Amount:</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(withdrawal.availableAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-200 pt-3">
                    <span className="text-sm text-gray-700">Requested Amount:</span>
                    <span className="font-bold text-xl text-blue-900">{formatCurrency(withdrawal.requestedAmount)}</span>
                  </div>
                  {withdrawal.requestedAmount > withdrawal.availableAmount && (
                    <div className="bg-red-50 border border-red-300 p-2 rounded-md text-xs text-red-800">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Requested amount exceeds available balance!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Processing History */}
          {withdrawal.employeeProcessedBy?.employeeId && (
            <div className="border border-indigo-300 rounded-md p-4 bg-indigo-50">
              <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Employee Processing History
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Processed By:</span>{' '}
                  <span className="font-medium">{withdrawal.employeeProcessedBy.employeeName}</span>
                  {' '}({withdrawal.employeeProcessedBy.employeeDesignation})
                </p>
                <p>
                  <span className="text-gray-600">Action:</span>{' '}
                  <span className={`font-bold ${withdrawal.employeeProcessedBy.action === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                    {withdrawal.employeeProcessedBy.action?.toUpperCase()}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Processed At:</span>{' '}
                  <span className="font-medium">{formatDate(withdrawal.employeeProcessedBy.processedAt)}</span>
                </p>
                {withdrawal.employeeProcessedBy.notes && (
                  <div className="bg-white border border-indigo-200 p-3 rounded-md mt-2">
                    <p className="text-xs text-gray-600 mb-1">Notes:</p>
                    <p className="italic text-gray-800">"{withdrawal.employeeProcessedBy.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canProcess && !action && (
            <div className="flex gap-4 pt-4 border-t border-gray-300">
              <button
                onClick={() => setAction('approve')}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Approve Withdrawal
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-5 h-5" />
                Reject Withdrawal
              </button>
            </div>
          )}

          {/* Approval Form */}
          {action === 'approve' && canProcess && (
            <div className="border border-green-300 rounded-md p-4 bg-green-50">
              <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approve Withdrawal Request
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter any notes or comments about this approval..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
                  >
                    {loading ? 'Processing...' : 'Confirm Approval'}
                  </button>
                  <button
                    onClick={() => setAction('')}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {action === 'reject' && canProcess && (
            <div className="border border-red-300 rounded-md p-4 bg-red-50">
              <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Reject Withdrawal Request
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason (Required - Min 10 characters) *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Provide a detailed reason for rejection..."
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {rejectionReason.length}/10 characters minimum
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={loading || rejectionReason.trim().length < 10}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
                  >
                    {loading ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => {
                      setAction('');
                      setRejectionReason('');
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalVerificationModal;
