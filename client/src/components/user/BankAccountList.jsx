import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BanknotesIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  StarIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { apiRequest } from '../../lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AddBankAccount from './AddBankAccount';
import EditBankAccount from './EditBankAccount';
import { API_BASE_URL } from '../../config';

const BankAccountList = () => {
  const { toast } = useToast();  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/bank/accounts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
        if (data.success) {
        setBankAccounts(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch bank accounts');
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load bank accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);
  // Handle setting primary account
  const handleSetPrimary = async (accountId) => {
    try {      const response = await fetch(`${API_BASE_URL}/api/bank/accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isPrimary: true
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Primary account updated successfully.",
        });
        fetchBankAccounts(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to update primary account');
      }
    } catch (error) {
      console.error('Error setting primary account:', error);
      toast({
        title: "Error",
        description: "Failed to update primary account. Please try again.",
        variant: "destructive",
      });
    }
  };
  // Handle edit account
  const handleEdit = (account) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  // Handle setting primary account
  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: ClockIcon,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-800 dark:text-yellow-400',
        label: 'Pending'
      },
      verified: {
        icon: CheckCircleIcon,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-800 dark:text-green-400',
        label: 'Verified'
      },
      rejected: {
        icon: XCircleIcon,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-800 dark:text-red-400',
        label: 'Rejected'
      },
      under_review: {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-800 dark:text-blue-400',
        label: 'Under Review'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bgColor} ${badge.textColor}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };  // Handle add success
  const handleAddSuccess = (newAccount) => {
    // Refresh the entire list to ensure data consistency
    fetchBankAccounts();
    setShowAddModal(false);
  };

  // Handle edit success
  const handleEditSuccess = (updatedAccount) => {
    // Refresh the entire list to ensure data consistency
    fetchBankAccounts();
    setShowEditModal(false);
    setSelectedAccount(null);
  };

  // View account details
  const viewDetails = (account) => {
    setSelectedAccount(account);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Accounts</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bank accounts for receiving donations
          </p>
        </div>
        <button
  onClick={() => setShowAddModal(true)}
  className="inline-flex items-center px-4 py-2 bg-[#800000] text-white font-medium rounded-lg hover:bg-[#660000] transition-colors"
>
  <PlusIcon className="w-5 h-5 mr-2" />
  Add Bank Account
</button>

      </div>

      {/* Bank Accounts List */}
      {bankAccounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
            <BanknotesIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No bank accounts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add your first bank account to start receiving donations from your campaigns.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Your First Bank Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bankAccounts.map((account) => (
            <motion.div
              key={account._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-4">
                      <BanknotesIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {account.bankName}
                        </h3>
                        {account.isPrimary && (
                          <StarIconSolid className="h-5 w-5 text-yellow-500" title="Primary Account" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        •••• •••• {account.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(account.verificationStatus)}
                </div>                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Account Holder:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {account.accountName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {account.associatedPhoneNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Added:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(account.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewDetails(account)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {account.verificationStatus === 'rejected' && (
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit Account"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {!account.isPrimary && account.verificationStatus === 'verified' && (
                    <button
                      onClick={() => handleSetPrimary(account._id)}
                      className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
                    >
                      <StarIcon className="h-4 w-4 mr-1" />
                      Set as Primary
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}      {/* Add Bank Account Modal */}
      {showAddModal && (
        <AddBankAccount
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Bank Account Modal */}
      {showEditModal && selectedAccount && (
        <EditBankAccount
          account={selectedAccount}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAccount(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Account Details Modal */}
      {showDetailsModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-4">
                  <BanknotesIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedAccount.bankName}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Account Details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                  {getStatusBadge(selectedAccount.verificationStatus)}
                </div>                {/* Account Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Bank Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.bankName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Account Number
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.accountNumber}</p>
                  </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Account Holder Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.accountName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Associated Phone Number
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.associatedPhoneNumber}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Document Type
                    </label>
                    <p className="text-gray-900 dark:text-white capitalize">{selectedAccount.documentType}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Document Number
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.documentNumber}</p>
                  </div>
                </div>                {/* Document Information */}
                {selectedAccount.documentImage && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Uploaded Document
                    </h3>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DocumentIcon className="h-6 w-6 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {selectedAccount.documentType}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Document Number: {selectedAccount.documentNumber}
                            </p>
                          </div>
                        </div>
                        <a
                          href={selectedAccount.documentImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedAccount.verificationStatus === 'rejected' && selectedAccount.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      Rejection Reason
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {selectedAccount.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date(selectedAccount.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date(selectedAccount.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountList;
