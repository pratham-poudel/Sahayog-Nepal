import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Building2, 
  UserCheck, 
  FileCheck, 
  CreditCard, 
  Landmark, 
  Scale,
  Shield,
  ChevronRight,
  Phone,
  KeyRound,
  LogIn
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DEPARTMENTS = [
  { id: 'USER_KYC_VERIFIER', name: 'User KYC Verification', description: 'Verify user identities and documents', icon: UserCheck },
  { id: 'CAMPAIGN_VERIFIER', name: 'Campaign Verification', description: 'Review and approve fundraising campaigns', icon: FileCheck },
  { id: 'WITHDRAWAL_DEPARTMENT', name: 'Withdrawal Processing', description: 'Process fund withdrawal requests', icon: CreditCard },
  { id: 'TRANSACTION_MANAGEMENT', name: 'Transaction Management', description: 'Process actual bank transfers to campaigners', icon: Landmark },
  { id: 'LEGAL_AUTHORITY_DEPARTMENT', name: 'Legal & Compliance', description: 'Handle legal and compliance matters', icon: Scale },
];

const EmployeePortal = () => {
  const [location, setLocation] = useLocation();
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [designationNumber, setDesignationNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [otp, setOtp] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  // Clear any existing employee session on mount
  useState(() => {
    localStorage.removeItem('employeeToken');
  });

  const handleDepartmentSelect = (dept) => {
    setSelectedDepartment(dept);
    setStep(2);
    setError('');
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedDepartment(null);
      setDesignationNumber('');
      setPhone('');
      setAccessCode('');
    } else if (step === 3) {
      setStep(2);
      setOtp('');
    }
    setError('');
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/request-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          designationNumber: designationNumber.toUpperCase(),
          phone: phone.trim(),
          accessCode: accessCode.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmployeeId(data.employeeId);
        setStep(3);
      } else setError(data.message || 'Failed to send OTP');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/verify-otp-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employeeId, otp: otp.trim() })
      });
      const data = await res.json();
      if (data.success) {
        // Store the token
        if (data.token) {
          localStorage.setItem('employeeToken', data.token);
        }
        
        // Route based on department - explicit routing for each department
        const department = data.employee.department;
        console.log('Employee department:', department); // Debug log
        
        switch(department) {
          case 'USER_KYC_VERIFIER':
            setLocation('/employee/kyc-dashboard');
            break;
          case 'CAMPAIGN_VERIFIER':
            setLocation('/employee/campaign-verifier');
            break;
          case 'WITHDRAWAL_DEPARTMENT':
            setLocation('/employee/withdrawal-processor');
            break;
          case 'TRANSACTION_MANAGEMENT':
            setLocation('/employee/transaction-management');
            break;
          case 'LEGAL_AUTHORITY_DEPARTMENT':
            setLocation('/employee/legal-authority');
            break;
          default:
            console.error('Unknown department:', department);
            setError('Unknown department type. Please contact administrator.');
        }
      } else setError(data.message || 'Invalid OTP');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* GOV HEADER */}
      <header className="bg-blue-900 text-white py-4 border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <img src="/gov_logo.png" alt="Government Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">
                DALLY TECH PVT LTD
              </h1>
              <p className="text-sm opacity-90">Sahayog Nepal – Department Management System</p>
            </div>
          </div>
          <div className="text-sm text-gray-100">
            <p>Official Employee Portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-blue-900 uppercase mb-1">
            Employee Login Portal
          </h2>
          <p className="text-sm text-gray-600">
            Authorized personnel only. Unauthorized access is punishable by law.
          </p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              return (
                <button
                  key={dept.id}
                  onClick={() => handleDepartmentSelect(dept)}
                  className="text-left border border-gray-300 bg-white p-6 rounded-md hover:border-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-md">
                      <Icon className="w-6 h-6 text-blue-800" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {dept.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">{dept.description}</p>
                  <div className="flex items-center text-blue-800 text-sm font-medium">
                    <span>Access Department</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && selectedDepartment && (
          <div className="max-w-md mx-auto bg-white border border-gray-300 rounded-md p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto bg-gray-100 flex items-center justify-center rounded-md mb-4">
                <selectedDepartment.icon className="w-7 h-7 text-blue-800" />
              </div>
              <h2 className="text-lg font-semibold text-blue-900 uppercase mb-2">
                {selectedDepartment.name}
              </h2>
              <p className="text-sm text-gray-700">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-3 border border-red-400 bg-red-50 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation Number
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={designationNumber}
                    onChange={(e) => setDesignationNumber(e.target.value.toUpperCase())}
                    placeholder="e.g., EMP001"
                    required
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Code (5-digit MPIN)
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 5-digit MPIN"
                    maxLength={5}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter your secure 5-digit access code</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 border border-gray-300 py-2 rounded font-medium text-gray-700 hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !designationNumber || phone.length !== 10 || accessCode.length !== 5}
                  className="flex-1 bg-blue-900 text-white py-2 rounded font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      Send OTP <LogIn className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="max-w-md mx-auto bg-white border border-gray-300 rounded-md p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto bg-gray-100 flex items-center justify-center rounded-md mb-4">
                <Shield className="w-7 h-7 text-green-700" />
              </div>
              <h2 className="text-lg font-semibold text-blue-900 uppercase mb-2">
                Verify OTP
              </h2>
              <p className="text-sm text-gray-700">
                Enter the 6-digit code sent to your phone
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 border border-red-400 bg-red-50 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="w-full text-center text-2xl font-mono tracking-widest border border-gray-300 rounded py-2 focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 border border-gray-300 py-2 rounded font-medium text-gray-700 hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-green-700 text-white py-2 rounded font-medium hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <span>Verifying...</span> : <>Verify & Login <LogIn className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="text-center text-sm text-gray-600 border-t border-gray-300 py-6 mt-12">
        © {new Date().getFullYear()}  Sahayog Nepal crowdfunding  System
      </footer>
    </div>
  );
};

export default EmployeePortal;
