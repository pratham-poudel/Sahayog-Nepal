import { useState } from 'react';
import {
  X,
  User,
  Calendar,
  Building,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Phone,
  Mail,
  MapPin,
  Shield,
  ExternalLink,
  Eye
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const BankVerificationModal = ({ bankAccount, onClose, onVerificationComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState(''); // 'verify' or 'reject'
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(
        `${API_BASE_URL}/api/employee/bank-accounts/${bankAccount._id}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            notes: verificationNotes
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify bank account');
      }

      if (data.success) {
        onVerificationComplete();
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Error verifying bank account:', err);
      setError(err.message || 'Failed to verify bank account. Please try again.');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(
        `${API_BASE_URL}/api/employee/bank-accounts/${bankAccount._id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: rejectionReason
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject bank account');
      }

      if (data.success) {
        onVerificationComplete();
      } else {
        throw new Error(data.message || 'Rejection failed');
      }
    } catch (err) {
      console.error('Error rejecting bank account:', err);
      setError(err.message || 'Failed to reject bank account. Please try again.');
      setLoading(false);
    }
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

  const getStatusColor = (verified) => {
    if (verified) return 'text-green-700 bg-green-100 border-green-300';
    return 'text-yellow-700 bg-yellow-100 border-yellow-300';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* HEADER */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bank Account Verification</h2>
              <p className="text-xs opacity-90">Review and verify bank account details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-md p-2 transition-colors"
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

            {/* GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN - USER INFO */}
              <div className="space-y-6">
                {/* USER DETAILS */}
                <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900">Account Holder Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">FULL NAME</p>
                      <p className="font-medium text-gray-900">{bankAccount.user?.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">EMAIL ADDRESS</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-700">{bankAccount.user?.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">PHONE NUMBER</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-700">{bankAccount.user?.phone}</p>
                      </div>
                    </div>

                    {bankAccount.user?.country && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">COUNTRY</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-700">{bankAccount.user.country}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">KYC VERIFICATION STATUS</p>
                      {bankAccount.user?.kycVerified ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 border border-green-300 rounded text-xs text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            <span className="font-medium">KYC Verified</span>
                          </div>
                          {bankAccount.user?.isPremiumAndVerified && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-300 rounded text-xs text-blue-700">
                              <Shield className="w-3 h-3" />
                              <span className="font-medium">Premium</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-700 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-medium">KYC Not Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BANK ACCOUNT DETAILS */}
                <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900">Bank Account Details</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">BANK NAME</p>
                      <p className="font-medium text-gray-900 text-lg">{bankAccount.bankName}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ACCOUNT HOLDER NAME</p>
                      <p className="font-medium text-gray-900">{bankAccount.accountName}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ACCOUNT NUMBER</p>
                      <p className="font-mono text-lg font-bold text-blue-900 bg-blue-50 px-3 py-2 rounded border border-blue-200">
                        {bankAccount.accountNumber}
                      </p>
                    </div>

                    {bankAccount.associatedPhoneNumber && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ASSOCIATED PHONE</p>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-700">{bankAccount.associatedPhoneNumber}</p>
                        </div>
                      </div>
                    )}

                    {bankAccount.branchName && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">BRANCH NAME</p>
                        <p className="text-gray-700">{bankAccount.branchName}</p>
                      </div>
                    )}

                    {bankAccount.swiftCode && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">SWIFT CODE</p>
                        <p className="font-mono text-gray-900">{bankAccount.swiftCode}</p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">ACCOUNT STATUS</p>
                        <div className="flex items-center gap-2">
                          {bankAccount.isPrimary && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded border border-blue-300">
                              Primary Account
                            </span>
                          )}
                          {bankAccount.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded border border-green-300">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded border border-gray-300">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - VERIFICATION INFO */}
              <div className="space-y-6">
                {/* VERIFICATION STATUS */}
                <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900">Verification Status</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">CURRENT STATUS</p>
                      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border ${
                        bankAccount.verificationStatus === 'verified' 
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : bankAccount.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}>
                        {bankAccount.verificationStatus === 'verified' && <CheckCircle className="w-4 h-4" />}
                        {bankAccount.verificationStatus === 'rejected' && <XCircle className="w-4 h-4" />}
                        {bankAccount.verificationStatus === 'pending' && <AlertTriangle className="w-4 h-4" />}
                        {bankAccount.verificationStatus.toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">SUBMITTED ON</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-700">{formatDate(bankAccount.createdAt)}</p>
                      </div>
                    </div>

                    {bankAccount.updatedAt !== bankAccount.createdAt && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">LAST UPDATED</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-700">{formatDate(bankAccount.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* VERIFICATION DOCUMENT */}
                {bankAccount.documentImage && (
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-700" />
                      <h3 className="font-bold text-gray-900">Verification Document</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Document Type and Number */}
                      <div className="grid grid-cols-2 gap-3">
                        {bankAccount.documentType && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">DOCUMENT TYPE</p>
                            <p className="font-medium text-gray-900 capitalize">{bankAccount.documentType}</p>
                          </div>
                        )}
                        {bankAccount.documentNumber && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">DOCUMENT NUMBER</p>
                            <p className="font-medium text-gray-900">{bankAccount.documentNumber}</p>
                          </div>
                        )}
                      </div>

                      {/* Document Preview/Download */}
                      <div className="bg-white border border-gray-300 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Bank Document</p>
                              <p className="text-xs text-gray-500">Verification document attached</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowDocumentViewer(true)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <a
                              href={bankAccount.documentImage}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> Please verify that the account number and account holder name on the document match the details provided above.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* EMPLOYEE VERIFICATION HISTORY */}
                {bankAccount.employeeVerification?.employeeId && (
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-gray-700" />
                      <h3 className="font-bold text-gray-900">Employee Verification</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">VERIFIED BY</p>
                        <p className="font-medium text-gray-900">
                          {bankAccount.employeeVerification.employeeName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {bankAccount.employeeVerification.employeeDesignation}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">VERIFICATION DATE</p>
                        <p className="text-gray-700">{formatDate(bankAccount.employeeVerification.verifiedAt)}</p>
                      </div>

                      {bankAccount.employeeVerification.notes && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">NOTES</p>
                          <p className="text-sm text-gray-700 italic bg-white border border-gray-200 rounded p-2">
                            "{bankAccount.employeeVerification.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ADMIN VERIFICATION HISTORY */}
                {bankAccount.verifiedBy && bankAccount.verifiedByModel === 'Admin' && (
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-gray-700" />
                      <h3 className="font-bold text-gray-900">Admin Verification</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">
                        This bank account was verified by an administrator.
                      </p>
                      {bankAccount.verifiedAt && (
                        <p className="text-xs text-gray-500">
                          Verified on: {formatDate(bankAccount.verifiedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION SECTION */}
            {bankAccount.verificationStatus === 'pending' && (
              <div className="border-t border-gray-200 pt-6">
                {!action ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-1">Action Required</p>
                          <p className="text-sm text-yellow-700">
                            Please review all the information carefully before verifying or rejecting this bank account.
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
                        Cancel
                      </button>
                      <button
                        onClick={() => setAction('reject')}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Account
                      </button>
                      <button
                        onClick={() => setAction('verify')}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verify Account
                      </button>
                    </div>
                  </div>
                ) : action === 'verify' ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800 mb-1">Verify Bank Account</p>
                          <p className="text-sm text-green-700">
                            You are about to verify this bank account. The user will be able to use this account for withdrawals.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Notes (Optional)
                      </label>
                      <textarea
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Add any notes about this verification..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setAction('');
                          setVerificationNotes('');
                          setError('');
                        }}
                        className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerify}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Confirm Verification
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
                          <p className="text-sm font-medium text-red-800 mb-1">Reject Bank Account</p>
                          <p className="text-sm text-red-700">
                            You are about to reject this bank account. Please provide a clear reason.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Explain why you are rejecting this bank account (e.g., document unclear, account details mismatch, etc.)"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setAction('');
                          setRejectionReason('');
                          setError('');
                        }}
                        className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleReject}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                        disabled={loading || !rejectionReason.trim()}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Confirm Rejection
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
      {showDocumentViewer && bankAccount.documentImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Bank Document Preview</h3>
                {bankAccount.documentType && (
                  <p className="text-xs text-gray-400">
                    {bankAccount.documentType.toUpperCase()} - {bankAccount.documentNumber}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowDocumentViewer(false)}
                className="text-white hover:bg-gray-800 rounded p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-100 overflow-auto max-h-[calc(90vh-60px)]">
              {bankAccount.documentImage.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={bankAccount.documentImage}
                  className="w-full h-[calc(90vh-100px)] rounded shadow-lg"
                  title="Bank Document"
                />
              ) : (
                <img
                  src={bankAccount.documentImage}
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

export default BankVerificationModal;
