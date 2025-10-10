import { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  User, 
  CreditCard, 
  MapPin, 
  Calendar, 
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  Shield,
  TrendingUp,
  Activity,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AlertReviewModal = ({ alert, onClose, onReviewComplete }) => {
  const { toast } = useToast();
  const [reviewing, setReviewing] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [reportType, setReportType] = useState('');
  const [notes, setNotes] = useState('');

  const handleReview = async () => {
    if (!outcome) {
      toast({
        title: "Outcome Required",
        description: "Please select a review outcome.",
        variant: "destructive"
      });
      return;
    }

    if (outcome === 'reported' && !reportType) {
      toast({
        title: "Report Type Required",
        description: "Please select STR or TTR when reporting.",
        variant: "destructive"
      });
      return;
    }

    setReviewing(true);

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/legal/alerts/${alert._id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          outcome,
          reportType: outcome === 'reported' ? reportType : 'none',
          notes
        })
      });

      if (!response.ok) throw new Error('Failed to review alert');

      toast({
        title: "Review Submitted",
        description: `Alert marked as ${outcome}.`,
        variant: "default"
      });

      onReviewComplete();
    } catch (error) {
      console.error('Error reviewing alert:', error);
      toast({
        title: "Review Failed",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setReviewing(false);
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
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskLevel = (score) => {
    if (score >= 85) return { text: 'Critical', color: 'text-red-600', bg: 'bg-red-100' };
    if (score >= 70) return { text: 'High', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (score >= 50) return { text: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Low', color: 'text-blue-600', bg: 'bg-blue-100' };
  };

  const riskLevel = getRiskLevel(alert.riskScore);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${riskLevel.bg} rounded-lg flex items-center justify-center`}>
              <AlertTriangle className={`w-6 h-6 ${riskLevel.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Alert Review</h2>
              <p className="text-sm text-gray-600">Risk Score: {alert.riskScore} ({riskLevel.text})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Risk Score & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Risk Score</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{alert.riskScore}</p>
              <p className="text-sm text-gray-600 mt-1">{riskLevel.text} Risk Level</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Review Status</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {alert.reviewed ? 'Reviewed' : 'Pending Review'}
              </p>
              {alert.outcome !== 'none' && (
                <p className="text-sm text-gray-600 mt-1 capitalize">{alert.outcome.replace('_', ' ')}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Created</span>
              </div>
              <p className="text-sm text-gray-900">{formatDate(alert.createdAt)}</p>
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Risk Indicators</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {alert.indicators.map((indicator, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-300"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {indicator}
                </span>
              ))}
            </div>
          </div>

          {/* User Information */}
          {alert.userId && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">User Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  {alert.userId.profilePictureUrl && (
                    <img
                      src={alert.userId.profilePictureUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{alert.userId.name}</p>
                    <p className="text-sm text-gray-600">{alert.userId.email}</p>
                    {alert.userId.phone && (
                      <p className="text-sm text-gray-600">{alert.userId.phone}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{alert.userId.country || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      KYC: {alert.userId.kycVerified ? (
                        <span className="text-green-600 font-medium">Verified</span>
                      ) : (
                        <span className="text-red-600 font-medium">Not Verified</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      User Risk Score: {alert.userId.riskScore || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction/Donation Details */}
          {(alert.donationId || alert.paymentId) && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Transaction Details</h3>
              </div>

              {alert.donationId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(alert.donationId.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Donor Name</span>
                    <span className="text-sm font-medium text-gray-900">
                      {alert.donationId.donorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Donor Email</span>
                    <span className="text-sm font-medium text-gray-900">
                      {alert.donationId.donorEmail}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(alert.donationId.createdAt)}
                    </span>
                  </div>

                  {/* Campaign Info */}
                  {alert.donationId.campaignId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Campaign</p>
                      <div className="flex items-start gap-3">
                        {alert.donationId.campaignId.coverImage && (
                          <img
                            src={alert.donationId.campaignId.coverImage}
                            alt=""
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {alert.donationId.campaignId.title}
                          </p>
                          {alert.donationId.campaignId.creator && (
                            <p className="text-sm text-gray-600">
                              Creator: {alert.donationId.campaignId.creator.name}
                              {alert.donationId.campaignId.creator.kycVerified && (
                                <CheckCircle className="inline w-3 h-3 text-green-600 ml-1" />
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 capitalize">
                            Status: {alert.donationId.campaignId.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {alert.paymentId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(alert.paymentId.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Transaction ID</span>
                    <span className="text-sm font-mono text-gray-900">
                      {alert.paymentId.transactionId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Method</span>
                    <span className="text-sm font-medium text-gray-900">
                      {alert.paymentId.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {alert.paymentId.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(alert.paymentId.createdAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Previous Review Info */}
          {alert.reviewed && alert.metadata?.reviewedBy && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Previous Review</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reviewed By</span>
                  <span className="text-sm font-medium text-gray-900">
                    {alert.metadata.reviewedBy.employeeName} ({alert.metadata.reviewedBy.designationNumber})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reviewed At</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(alert.metadata.reviewedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Outcome</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {alert.outcome.replace('_', ' ')}
                  </span>
                </div>
                {alert.reportType !== 'none' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Report Type</span>
                    <span className="text-sm font-bold text-red-600">
                      {alert.reportType}
                    </span>
                  </div>
                )}
                {alert.metadata.reviewNotes && (
                  <div className="pt-2">
                    <span className="text-sm text-gray-600">Notes:</span>
                    <p className="text-sm text-gray-900 mt-1">{alert.metadata.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Form */}
          {!alert.reviewed && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Submit Review</h3>
              
              <div className="space-y-4">
                {/* Outcome Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Outcome *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setOutcome('reported')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        outcome === 'reported'
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-red-400'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                      <span className="font-medium">Reported</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutcome('under_review')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        outcome === 'under_review'
                          ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-400'
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Under Review</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutcome('dismissed')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        outcome === 'dismissed'
                          ? 'border-gray-600 bg-gray-50 text-gray-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Dismissed</span>
                    </button>
                  </div>
                </div>

                {/* Report Type (only if reported) */}
                {outcome === 'reported' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setReportType('STR')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          reportType === 'STR'
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-red-400'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">STR (Suspicious Transaction Report)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReportType('TTR')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          reportType === 'TTR'
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-red-400'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">TTR (Threshold Transaction Report)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Add any additional notes about this review..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {alert.reviewed ? 'Close' : 'Cancel'}
          </button>
          {!alert.reviewed && (
            <button
              onClick={handleReview}
              disabled={reviewing || !outcome}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {reviewing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertReviewModal;
