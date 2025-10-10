import { useState } from 'react';
import { 
  X, 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Shield,
  Eye,
  Download,
  Clock,
  Target,
  Banknote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TransactionProcessingModal = ({ transaction, onClose, onTransactionComplete }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState(''); // 'processing', 'complete', 'failed'
  const [transactionReference, setTransactionReference] = useState('');
  const [processingFee, setProcessingFee] = useState(0);
  const [notes, setNotes] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  const handleMarkProcessing = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/transactions/${transaction._id}/mark-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ notes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as processing');
      }

      toast({
        title: "Status Updated",
        description: "Transaction marked as processing successfully.",
        variant: "default"
      });

      if (onTransactionComplete) {
        onTransactionComplete();
      }

      onClose();
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to mark transaction as processing.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!transactionReference.trim()) {
      setError('Transaction reference is required');
      toast({
        title: "Validation Error",
        description: "Transaction reference is required to complete the transaction.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/transactions/${transaction._id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          transactionReference: transactionReference.trim(),
          processingFee: parseFloat(processingFee) || 0,
          notes: notes.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete transaction');
      }

      toast({
        title: "Transaction Completed",
        description: `Transaction completed successfully. Reference: ${transactionReference}`,
        variant: "default"
      });

      if (onTransactionComplete) {
        onTransactionComplete();
      }

      onClose();
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to complete transaction.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleMarkFailed = async () => {
    if (!failureReason.trim()) {
      setError('Failure reason is required');
      toast({
        title: "Validation Error",
        description: "Please provide a reason for marking this transaction as failed.",
        variant: "destructive"
      });
      return;
    }

    if (failureReason.trim().length < 10) {
      setError('Failure reason must be at least 10 characters');
      toast({
        title: "Validation Error",
        description: "Failure reason must be at least 10 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/transactions/${transaction._id}/mark-failed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: failureReason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as failed');
      }

      toast({
        title: "Transaction Failed",
        description: "Transaction has been marked as failed. Amount returned to campaign.",
        variant: "default"
      });

      if (onTransactionComplete) {
        onTransactionComplete();
      }

      onClose();
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to mark transaction as failed.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'text-blue-700 bg-blue-100 border-blue-300',
      processing: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      completed: 'text-green-700 bg-green-100 border-green-300',
      failed: 'text-red-700 bg-red-100 border-red-300'
    };
    return colors[status] || 'text-gray-700 bg-gray-100 border-gray-300';
  };

  const finalAmount = transaction.requestedAmount - (parseFloat(processingFee) || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* HEADER */}
        <div className="bg-green-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Transaction Processing</h2>
              <p className="text-xs opacity-90">Process fund transfer to campaign creator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-green-800 rounded-md p-2 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="p-6 space-y-6">
            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-md p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* TRANSACTION STATUS */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">CURRENT STATUS</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border ${getStatusColor(transaction.status)}`}>
                    {transaction.status === 'approved' && <CheckCircle className="w-4 h-4" />}
                    {transaction.status === 'processing' && <Clock className="w-4 h-4" />}
                    {transaction.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                    {transaction.status === 'failed' && <XCircle className="w-4 h-4" />}
                    {transaction.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-1">WITHDRAWAL AMOUNT</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(transaction.requestedAmount)}</p>
                </div>
              </div>
            </div>

            {/* GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                {/* CAMPAIGN INFORMATION */}
                <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900">Campaign Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {transaction.campaign?.coverImage && (
                      <img 
                        src={transaction.campaign.coverImage} 
                        alt={transaction.campaign.title}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    )}
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">CAMPAIGN TITLE</p>
                      <p className="font-medium text-gray-900">{transaction.campaign?.title}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">TARGET</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.campaign?.targetAmount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">RAISED</p>
                        <p className="text-sm font-medium text-green-700">{formatCurrency(transaction.campaign?.amountRaised || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">WITHDRAWN</p>
                        <p className="text-sm font-medium text-orange-700">{formatCurrency(transaction.campaign?.amountWithdrawn || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CREATOR INFORMATION */}
                <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900">Campaign Creator</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {transaction.creator?.profilePictureUrl && (
                        <img 
                          src={transaction.creator.profilePictureUrl}
                          alt={transaction.creator.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{transaction.creator?.name}</p>
                        {transaction.creator?.kycVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            <CheckCircle className="w-3 h-3" />
                            KYC Verified
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">EMAIL</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-700">{transaction.creator?.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">PHONE</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-700">{transaction.creator?.phone}</p>
                      </div>
                    </div>

                    {transaction.creator?.country && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">COUNTRY</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-700">{transaction.creator.country}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* WITHDRAWAL DETAILS */}
                <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900">Withdrawal Details</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">REQUEST ID</p>
                      <p className="font-mono text-sm text-gray-900">{transaction._id?.slice(-8).toUpperCase()}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">REQUESTED ON</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-700">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">WITHDRAWAL TYPE</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{transaction.withdrawalType || 'Partial'}</p>
                    </div>

                    {transaction.reason && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">REASON</p>
                        <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded p-2">{transaction.reason}</p>
                      </div>
                    )}

                    {transaction.employeeProcessedBy && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">APPROVED BY</p>
                        <p className="text-sm text-gray-900">{transaction.employeeProcessedBy.employeeName}</p>
                        <p className="text-xs text-gray-600">{transaction.employeeProcessedBy.employeeDesignation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                {/* BANK ACCOUNT DETAILS */}
                <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900">Destination Bank Account</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">BANK NAME</p>
                      <p className="font-medium text-gray-900 text-lg">{transaction.bankAccount?.bankName}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ACCOUNT HOLDER NAME</p>
                      <p className="font-medium text-gray-900">{transaction.bankAccount?.accountName}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ACCOUNT NUMBER</p>
                      <p className="font-mono text-lg font-bold text-blue-900 bg-blue-50 px-3 py-2 rounded border border-blue-200">
                        {transaction.bankAccount?.accountNumber}
                      </p>
                    </div>

                    {transaction.bankAccount?.associatedPhoneNumber && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ASSOCIATED PHONE</p>
                        <p className="text-sm text-gray-700">{transaction.bankAccount.associatedPhoneNumber}</p>
                      </div>
                    )}

                    {transaction.bankAccount?.documentType && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">VERIFICATION DOCUMENT</p>
                        <p className="text-sm text-gray-900 capitalize">{transaction.bankAccount.documentType} - {transaction.bankAccount.documentNumber}</p>
                        {transaction.bankAccount.documentImage && (
                          <button
                            onClick={() => setShowDocumentViewer(true)}
                            className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            View Document
                          </button>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                        transaction.bankAccount?.verificationStatus === 'verified'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {transaction.bankAccount?.verificationStatus === 'verified' ? 'Verified Bank Account' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PROCESSING DETAILS (if exists) */}
                {transaction.processingDetails && (
                  <div className="bg-green-50 border border-green-300 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-700" />
                      <h3 className="font-bold text-gray-900">Transaction Completed</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {transaction.processingDetails.transactionReference && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">TRANSACTION REFERENCE</p>
                          <p className="font-mono text-sm font-medium text-gray-900 bg-white px-2 py-1 rounded border border-green-200">
                            {transaction.processingDetails.transactionReference}
                          </p>
                        </div>
                      )}

                      {transaction.processingDetails.processingFee > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">PROCESSING FEE</p>
                          <p className="text-sm font-medium text-red-700">{formatCurrency(transaction.processingDetails.processingFee)}</p>
                        </div>
                      )}

                      {transaction.processingDetails.finalAmount && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">FINAL AMOUNT TRANSFERRED</p>
                          <p className="text-lg font-bold text-green-700">{formatCurrency(transaction.processingDetails.finalAmount)}</p>
                        </div>
                      )}

                      {transaction.processingDetails.processedBy && (
                        <div className="pt-2 border-t border-green-200">
                          <p className="text-xs text-gray-500 mb-1">PROCESSED BY</p>
                          <p className="text-sm text-gray-900">{transaction.processingDetails.processedBy.name}</p>
                          <p className="text-xs text-gray-600">{transaction.processingDetails.processedBy.designationNumber}</p>
                        </div>
                      )}

                      {transaction.processingDetails.processedAt && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">PROCESSED ON</p>
                          <p className="text-sm text-gray-700">{formatDate(transaction.processingDetails.processedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION SECTION */}
            {['approved', 'processing'].includes(transaction.status) && (
              <div className="border-t border-gray-200 pt-6">
                {!action ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-1">Transaction Processing Required</p>
                          <p className="text-sm text-yellow-700">
                            This withdrawal has been approved and requires manual bank transfer. Please process the transaction from the company's bank account to the campaign creator's bank account shown above.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => setAction('failed')}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4" />
                        Mark as Failed
                      </button>
                      {transaction.status === 'approved' && (
                        <button
                          onClick={() => setAction('processing')}
                          className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                          disabled={loading}
                        >
                          <Clock className="w-4 h-4" />
                          Mark as Processing
                        </button>
                      )}
                      <button
                        onClick={() => setAction('complete')}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Transaction
                      </button>
                    </div>
                  </div>
                ) : action === 'processing' ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-1">Mark as Processing</p>
                          <p className="text-sm text-yellow-700">
                            This will update the status to "Processing" indicating that the bank transfer is in progress.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Add any notes about this transaction..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setAction('');
                          setNotes('');
                          setError('');
                        }}
                        className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleMarkProcessing}
                        className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            Confirm Processing
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : action === 'complete' ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800 mb-1">Complete Transaction</p>
                          <p className="text-sm text-green-700">
                            Mark this transaction as completed after successfully transferring {formatCurrency(transaction.requestedAmount)} to the campaign creator's bank account.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Transaction Reference <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter bank transaction reference number"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter the unique transaction reference from your bank transfer</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Processing Fee (NPR)
                      </label>
                      <input
                        type="number"
                        value={processingFee}
                        onChange={(e) => setProcessingFee(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Bank transfer fees or processing charges (if any)</p>
                    </div>

                    {processingFee > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Final amount to be transferred:</strong> {formatCurrency(finalAmount)}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          (Requested: {formatCurrency(transaction.requestedAmount)} - Processing Fee: {formatCurrency(processingFee)})
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Add any additional notes about this transaction..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setAction('');
                          setTransactionReference('');
                          setProcessingFee(0);
                          setNotes('');
                          setError('');
                        }}
                        className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCompleteTransaction}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading || !transactionReference.trim()}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Completing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Complete Transaction
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800 mb-1">Mark Transaction as Failed</p>
                          <p className="text-sm text-red-700">
                            Use this only if the bank transfer failed or cannot be completed. The pending amount will be released back to the campaign.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Failure Reason <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Explain why the transaction failed (e.g., bank account details incorrect, transfer rejected by bank, etc.)"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setAction('');
                          setFailureReason('');
                          setError('');
                        }}
                        className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleMarkFailed}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading || !failureReason.trim()}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Marking as Failed...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Confirm Failure
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DOCUMENT VIEWER MODAL */}
      {showDocumentViewer && transaction.bankAccount?.documentImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Bank Verification Document</h3>
                <p className="text-xs text-gray-400">
                  {transaction.bankAccount.documentType?.toUpperCase()} - {transaction.bankAccount.documentNumber}
                </p>
              </div>
              <button
                onClick={() => setShowDocumentViewer(false)}
                className="text-white hover:bg-gray-800 rounded p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-100 overflow-auto max-h-[calc(90vh-60px)]">
              {transaction.bankAccount.documentImage.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={transaction.bankAccount.documentImage}
                  className="w-full h-[calc(90vh-100px)] rounded shadow-lg"
                  title="Bank Document"
                />
              ) : (
                <img
                  src={transaction.bankAccount.documentImage}
                  alt="Bank Document"
                  className="max-w-full h-auto mx-auto rounded shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionProcessingModal;
