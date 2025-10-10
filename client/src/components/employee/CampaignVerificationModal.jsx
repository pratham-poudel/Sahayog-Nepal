import { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Award,
  Tag,
  AlertTriangle,
  Download,
  ExternalLink,
  Shield
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AVAILABLE_TAGS = [
  'Featured',
  'Urgent',
  'Verified',
  'Medical Emergency',
  'Education Support',
  'Disaster Relief',
  'Community Project',
  'Environmental',
  'Animal Welfare'
];

const CampaignVerificationModal = ({ campaign, onClose, onVerificationComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTags, setSelectedTags] = useState(campaign.tags || []);
  const [featured, setFeatured] = useState(campaign.featured || false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [revertReason, setRevertReason] = useState('');
  const [action, setAction] = useState(''); // 'approve', 'reject', 'complete', 'revert'
  const [fullCampaignData, setFullCampaignData] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);

  useEffect(() => {
    fetchFullCampaignData();
  }, [campaign._id]);

  const fetchFullCampaignData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/campaigns/${campaign._id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setFullCampaignData(data.campaign);
      }
    } catch (error) {
      console.error('Failed to fetch full campaign data:', error);
    }
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleApprove = async () => {
    if (!fullCampaignData?.creator?.kycVerified) {
      setError('Cannot approve campaign. Creator KYC is not verified.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/campaigns/${campaign._id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tags: selectedTags,
          verificationNotes,
          featured
        })
      });

      const data = await res.json();

      if (data.success) {
        onVerificationComplete('approved', data.campaign);
        onClose();
      } else {
        setError(data.message || 'Failed to approve campaign');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/campaigns/${campaign._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rejectionReason,
          verificationNotes
        })
      });

      const data = await res.json();

      if (data.success) {
        onVerificationComplete('rejected', data.campaign);
        onClose();
      } else {
        setError(data.message || 'Failed to reject campaign');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/campaigns/${campaign._id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verificationNotes
        })
      });

      const data = await res.json();

      if (data.success) {
        onVerificationComplete('completed', data.campaign);
        onClose();
      } else {
        setError(data.message || 'Failed to mark campaign as completed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToPending = async () => {
    if (!revertReason.trim()) {
      setError('Please provide a reason for reversion');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/campaigns/${campaign._id}/revert-to-pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: revertReason,
          verificationNotes
        })
      });

      const data = await res.json();

      if (data.success) {
        onVerificationComplete('reverted', data.campaign);
        onClose();
      } else {
        setError(data.message || 'Failed to revert campaign');
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      active: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return styles[status] || styles.pending;
  };

  const campaignData = fullCampaignData || campaign;
  const allImages = [campaignData.coverImage, ...(campaignData.images || [])];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-md max-w-5xl w-full my-8">
        {/* HEADER */}
        <div className="bg-blue-900 text-white px-6 py-4 rounded-t-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Campaign Verification</h2>
              <p className="text-xs opacity-90">Review all details before taking action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 border border-red-400 bg-red-50 text-red-700 text-sm rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* CAMPAIGN STATUS & CREATOR KYC WARNING */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-xs text-gray-600 mb-1">Campaign Status</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium border rounded ${getStatusBadge(
                  campaignData.status
                )}`}
              >
                {campaignData.status.toUpperCase()}
              </span>
            </div>

            <div
              className={`border rounded-md p-4 ${
                campaignData.creator?.kycVerified
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <p className="text-xs text-gray-600 mb-1">Creator KYC Status</p>
              <div className="flex items-center gap-2">
                {campaignData.creator?.kycVerified ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-700" />
                    <span className="text-sm font-medium text-green-700">KYC Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-700" />
                    <span className="text-sm font-medium text-red-700">
                      KYC NOT VERIFIED - Cannot Approve
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CAMPAIGN BASIC INFO */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Campaign Information
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Title</p>
                <p className="text-base font-semibold text-gray-900">{campaignData.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Short Description</p>
                <p className="text-sm text-gray-700">{campaignData.shortDescription}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Category</p>
                  <p className="text-sm font-medium text-gray-900">{campaignData.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Target Amount</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(campaignData.targetAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Amount Raised</p>
                  <p className="text-sm font-medium text-green-700">
                    {formatCurrency(campaignData.amountRaised)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Donors</p>
                  <p className="text-sm font-medium text-gray-900">{campaignData.donors}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Start Date</p>
                  <p className="text-sm text-gray-700">{formatDate(campaignData.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">End Date</p>
                  <p className="text-sm text-gray-700">{formatDate(campaignData.endDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CAMPAIGN STORY */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Campaign Story</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaignData.story}</p>
            </div>
          </div>

          {/* IMAGES GALLERY */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Campaign Images ({allImages.length})
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {allImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setShowImageGallery(true);
                  }}
                  className="aspect-square rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img src={img} alt={`Campaign image ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Verification Documents
            </h3>

            {/* LAP Letter */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-700" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900">
                      Local Authority Permission (LAP) Letter
                    </p>
                    <p className="text-xs text-yellow-700">Required legal document</p>
                  </div>
                </div>
                <a
                  href={campaignData.lapLetter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </a>
              </div>
            </div>

            {/* Additional Documents */}
            {campaignData.verificationDocuments && campaignData.verificationDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">Additional Verification Documents:</p>
                {campaignData.verificationDocuments.map((doc, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Document {idx + 1}</span>
                      </div>
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-800 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CREATOR INFO */}
          {fullCampaignData?.creator && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Campaign Creator
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {fullCampaignData.creator.profilePictureUrl ? (
                      <img
                        src={fullCampaignData.creator.profilePictureUrl}
                        alt={fullCampaignData.creator.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-600">
                        {fullCampaignData.creator.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">
                      {fullCampaignData.creator.name}
                    </p>
                    <p className="text-sm text-gray-600">{fullCampaignData.creator.email}</p>
                    <p className="text-sm text-gray-600">{fullCampaignData.creator.phone}</p>
                  </div>
                  <div className="text-right">
                    {fullCampaignData.creator.kycVerified ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded border border-green-300">
                        KYC Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded border border-red-300">
                        KYC Not Verified
                      </span>
                    )}
                    {fullCampaignData.creator.isPremiumAndVerified && (
                      <span className="block mt-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded border border-purple-300">
                        Premium User
                      </span>
                    )}
                  </div>
                </div>
                {fullCampaignData.creator.bio && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Bio</p>
                    <p className="text-sm text-gray-700">{fullCampaignData.creator.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VERIFICATION ACTIONS */}
          {campaignData.status === 'pending' && (
            <>
              {/* TAG ASSIGNMENT */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Assign Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-900 text-white border-blue-900'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-800'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* FEATURED TOGGLE */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-5 h-5 text-blue-900 border-gray-300 rounded focus:ring-blue-800"
                  />
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-700" />
                    <span className="text-sm font-medium text-gray-900">
                      Mark as Featured Campaign
                    </span>
                  </div>
                </label>
                <p className="text-xs text-gray-600 ml-8 mt-1">
                  Featured campaigns get priority display on homepage and in search results
                </p>
              </div>

              {/* VERIFICATION NOTES */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Verification Notes (Optional)
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about the verification process..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm"
                />
              </div>

              {/* ACTION BUTTONS */}
              {action === '' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setAction('approve')}
                    disabled={!campaignData.creator?.kycVerified}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve & Activate Campaign
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Campaign
                  </button>
                </div>
              )}

              {/* APPROVE CONFIRMATION */}
              {action === 'approve' && (
                <div className="bg-green-50 border border-green-300 rounded-md p-4">
                  <p className="text-sm font-semibold text-green-900 mb-3">
                    Confirm Campaign Approval
                  </p>
                  <p className="text-sm text-green-800 mb-4">
                    Campaign will be activated and visible to donors. Selected tags and featured
                    status will be applied.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Approval'}
                    </button>
                    <button
                      onClick={() => setAction('')}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* REJECT FORM */}
              {action === 'reject' && (
                <div className="bg-red-50 border border-red-300 rounded-md p-4">
                  <p className="text-sm font-semibold text-red-900 mb-3">Reject Campaign</p>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide detailed reason for rejection (will be sent to campaign creator)..."
                    rows={4}
                    className="w-full px-3 py-2 border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600 text-sm mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={loading || !rejectionReason.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => {
                        setAction('');
                        setRejectionReason('');
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* MARK AS COMPLETED (FOR ACTIVE CAMPAIGNS) */}
          {campaignData.status === 'active' && (
            <>
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-300 rounded-md p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Mark Campaign as Completed</p>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add completion notes (optional)..."
                    rows={3}
                    className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm mb-3"
                  />
                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Mark as Completed'}
                  </button>
                </div>
              </div>

              {/* REVERT TO PENDING (FOR ACTIVE CAMPAIGNS) */}
              <div className="mb-6">
                <div className="bg-orange-50 border border-orange-300 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-orange-700" />
                    <p className="text-sm font-semibold text-orange-900">
                      Revert Campaign to Pending Status
                    </p>
                  </div>
                  <p className="text-xs text-orange-700 mb-3">
                    Use this option if the campaign needs re-verification. This will deactivate the campaign,
                    remove featured status and tags, and require fresh approval.
                  </p>

                  {action !== 'revert' ? (
                    <button
                      onClick={() => setAction('revert')}
                      className="w-full px-4 py-2 bg-orange-600 text-white font-medium rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Revert to Pending
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-orange-900 mb-2">
                        Reason for Reversion *
                      </label>
                      <textarea
                        value={revertReason}
                        onChange={(e) => setRevertReason(e.target.value)}
                        placeholder="Explain why this campaign needs re-verification (e.g., fraudulent documents detected, policy violation, etc.)..."
                        rows={4}
                        className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-600 text-sm"
                      />
                      <label className="block text-sm font-medium text-orange-900 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        placeholder="Add any additional internal notes..."
                        rows={2}
                        className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-600 text-sm"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleRevertToPending}
                          disabled={loading || !revertReason.trim()}
                          className="flex-1 px-4 py-2 bg-orange-600 text-white font-medium rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : 'Confirm Reversion'}
                        </button>
                        <button
                          onClick={() => {
                            setAction('');
                            setRevertReason('');
                          }}
                          disabled={loading}
                          className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* EXISTING VERIFICATION INFO */}
          {campaignData.verifiedBy && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification History</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Verified By</p>
                    <p className="font-medium text-gray-900">{campaignData.verifiedBy.employeeName}</p>
                    <p className="text-xs text-gray-600">{campaignData.verifiedBy.employeeDesignation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Verified At</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(campaignData.verifiedBy.verifiedAt)}
                    </p>
                  </div>
                </div>
                {campaignData.verificationNotes && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{campaignData.verificationNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-gray-100 px-6 py-4 rounded-b-md flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* IMAGE GALLERY LIGHTBOX */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4">
          <button
            onClick={() => setShowImageGallery(false)}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl w-full">
            <img
              src={allImages[activeImageIndex]}
              alt="Campaign"
              className="w-full h-auto max-h-[80vh] object-contain rounded"
            />
            <div className="flex justify-center gap-2 mt-4">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    idx === activeImageIndex ? 'bg-white' : 'bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignVerificationModal;
