import { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Building2,
    Mail,
    Phone,
    Key,
    Badge,
    Search,
    Filter,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    TrendingUp,
    UserCheck,
    FileCheck,
    CreditCard,
    Landmark,
    Scale
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DEPARTMENTS = [
    { id: 'USER_KYC_VERIFIER', name: 'User KYC Verification', icon: UserCheck, color: 'blue' },
    { id: 'CAMPAIGN_VERIFIER', name: 'Campaign Verification', icon: FileCheck, color: 'green' },
    { id: 'WITHDRAWAL_DEPARTMENT', name: 'Withdrawal Processing', icon: CreditCard, color: 'purple' },
    { id: 'TRANSACTION_MANAGEMENT', name: 'Transaction Management', icon: Landmark, color: 'orange' },
    { id: 'LEGAL_AUTHORITY_DEPARTMENT', name: 'Legal & Compliance', icon: Scale, color: 'red' }
];

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        accessCode: '',
        designationNumber: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEmployees();
        fetchStatistics();
    }, [selectedDepartment]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedDepartment) params.append('department', selectedDepartment);
            params.append('limit', '100');

            const response = await fetch(`${API_BASE_URL}/api/admin/employees?${params}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setEmployees(data.employees);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/employees/statistics/department`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setStatistics(data.statistics);
            }
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        }
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        setFormErrors({});
        setSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Employee created successfully!');
                setShowCreateModal(false);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    department: '',
                    accessCode: '',
                    designationNumber: ''
                });
                fetchEmployees();
                fetchStatistics();
            } else {
                setFormErrors({ general: data.message });
            }
        } catch (error) {
            setFormErrors({ general: 'Failed to create employee' });
            console.error('Error creating employee:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        setFormErrors({});
        setSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/employees/${selectedEmployee._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    department: formData.department,
                    isActive: formData.isActive
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Employee updated successfully!');
                setShowEditModal(false);
                setSelectedEmployee(null);
                fetchEmployees();
            } else {
                setFormErrors({ general: data.message });
            }
        } catch (error) {
            setFormErrors({ general: 'Failed to update employee' });
            console.error('Error updating employee:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (!confirm('Are you sure you want to deactivate this employee?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/employees/${employeeId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                alert('Employee deactivated successfully!');
                fetchEmployees();
                fetchStatistics();
            }
        } catch (error) {
            console.error('Error deactivating employee:', error);
            alert('Failed to deactivate employee');
        }
    };

    const openEditModal = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            department: employee.department,
            isActive: employee.isActive,
            accessCode: '',
            designationNumber: employee.designationNumber
        });
        setShowEditModal(true);
    };

    const getDepartmentColor = (deptId) => {
        const dept = DEPARTMENTS.find(d => d.id === deptId);
        return dept ? dept.color : 'gray';
    };

    return (
        <div className="space-y-6">
            {/* Statistics */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Employees</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
                            </div>
                            <Users className="w-12 h-12 text-blue-600 opacity-80" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
                                <p className="text-3xl font-bold text-green-600">{statistics.active}</p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-green-600 opacity-80" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inactive</p>
                                <p className="text-3xl font-bold text-red-600">{statistics.inactive}</p>
                            </div>
                            <XCircle className="w-12 h-12 text-red-600 opacity-80" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full md:w-auto">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Departments</option>
                                {DEPARTMENTS.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Employee</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Department</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Designation</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No employees found
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white">{employee.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700 dark:text-gray-300">{employee.email}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{employee.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${getDepartmentColor(employee.department)}-100 text-${getDepartmentColor(employee.department)}-700`}>
                                                {DEPARTMENTS.find(d => d.id === employee.department)?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-white">
                                            {employee.designationNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            {employee.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                                    <XCircle className="w-4 h-4" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(employee)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Edit Employee"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmployee(employee._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Deactivate Employee"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Employee Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Employee</h2>
                        </div>
                        
                        <form onSubmit={handleCreateEmployee} className="p-6 space-y-6">
                            {formErrors.general && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                                    {formErrors.general}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Phone (10 digits) *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={10}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Department *
                                    </label>
                                    <select
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Access Code (5 digits) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={5}
                                        value={formData.accessCode}
                                        onChange={(e) => setFormData({...formData, accessCode: e.target.value.replace(/\D/g, '')})}
                                        placeholder="12345"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Designation Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.designationNumber}
                                        onChange={(e) => setFormData({...formData, designationNumber: e.target.value.toUpperCase()})}
                                        placeholder="EMP001"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData({
                                            name: '',
                                            email: '',
                                            phone: '',
                                            department: '',
                                            accessCode: '',
                                            designationNumber: ''
                                        });
                                        setFormErrors({});
                                    }}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Creating...' : 'Create Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {showEditModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Employee</h2>
                        </div>
                        
                        <form onSubmit={handleUpdateEmployee} className="p-6 space-y-6">
                            {formErrors.general && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                                    {formErrors.general}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Department
                                    </label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {DEPARTMENTS.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.isActive ? 'true' : 'false'}
                                        onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Designation Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.designationNumber}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-mono uppercase cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedEmployee(null);
                                        setFormErrors({});
                                    }}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Updating...' : 'Update Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;
