import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { API_URL as CONFIG_API_URL } from '../config/index.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User, Shield, AlertCircle, CheckCircle, Key, Mail } from 'lucide-react';

// Base API URL
const API_URL = `${CONFIG_API_URL}/api`;

const AdminLogin = () => {
    const [currentStep, setCurrentStep] = useState('accessCode'); // accessCode, login, otp
    const [accessCode, setAccessCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [adminId, setAdminId] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState(null);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    
    // Security configurations
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    
    useEffect(() => {
        // Check if already logged in
        const checkAuth = async () => {
            try {
                const response = await fetch(`${API_URL}/admin/check-auth`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    setLocation('/admin/dashboard');
                }
            } catch (error) {
                // Not authenticated, continue with login
            }
        };
        checkAuth();

        // Check for existing lockout
        const lockoutEnd = localStorage.getItem('adminLockoutEnd');
        if (lockoutEnd && new Date().getTime() < parseInt(lockoutEnd)) {
            setLockoutTime(parseInt(lockoutEnd));
        }

        // Load attempt count
        const savedAttempts = localStorage.getItem('adminAttempts');
        if (savedAttempts) {
            setAttempts(parseInt(savedAttempts));
        }
    }, [setLocation]);

    useEffect(() => {
        let timer;
        if (lockoutTime) {
            timer = setInterval(() => {
                if (new Date().getTime() >= lockoutTime) {
                    setLockoutTime(null);
                    setAttempts(0);
                    localStorage.removeItem('adminLockoutEnd');
                    localStorage.removeItem('adminAttempts');
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [lockoutTime]);

    const isLockedOut = lockoutTime && new Date().getTime() < lockoutTime;
    const timeRemaining = lockoutTime ? Math.ceil((lockoutTime - new Date().getTime()) / 1000) : 0;

    const handleFailedAttempt = () => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('adminAttempts', newAttempts.toString());

        if (newAttempts >= MAX_ATTEMPTS) {
            const lockoutEnd = new Date().getTime() + LOCKOUT_DURATION;
            setLockoutTime(lockoutEnd);
            localStorage.setItem('adminLockoutEnd', lockoutEnd.toString());
            toast({
                title: "Account Locked",
                description: `Too many failed attempts. Please wait 15 minutes.`,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Authentication Failed",
                description: `${MAX_ATTEMPTS - newAttempts} attempts remaining`,
                variant: "destructive",
            });
        }
    };

    const resetAttempts = () => {
        setAttempts(0);
        localStorage.removeItem('adminAttempts');
        localStorage.removeItem('adminLockoutEnd');
    };

    const handleAccessCodeSubmit = async (e) => {
        e.preventDefault();
        if (isLockedOut || loading) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/validate-access-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessCode }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentStep('login');
                resetAttempts();
                toast({
                    title: "Access Granted",
                    description: "Please enter your admin credentials.",
                });
            } else {
                handleFailedAttempt();
                setAccessCode('');
                toast({
                    title: "Invalid Access Code",
                    description: data.message || "Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Access code validation error:', error);
            handleFailedAttempt();
            setAccessCode('');
            toast({
                title: "Connection Error",
                description: "Please check your connection and try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLockedOut || loading) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/verify-credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                setAdminId(data.adminId);
                setMaskedEmail(data.maskedEmail);
                setCurrentStep('otp');
                resetAttempts();
                toast({
                    title: "OTP Sent",
                    description: `Verification code sent to ${data.maskedEmail}`,
                });
            } else {
                handleFailedAttempt();
                setPassword('');
                toast({
                    title: "Invalid Credentials",
                    description: data.message || "Please check your username and password.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            handleFailedAttempt();
            setPassword('');
            toast({
                title: "Connection Error",
                description: "Please check your connection and try again.",
                variant: "destructive",
            });
            
            // Log security events in production
            if (import.meta.env.MODE === 'production') {
                console.warn('Failed admin login attempt:', {
                    timestamp: new Date().toISOString(),
                    username,
                    error: error.message
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerification = async (e) => {
        e.preventDefault();
        if (isLockedOut || loading) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/verify-otp-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ adminId, otp }),
            });

            const data = await response.json();

            if (data.success) {
                resetAttempts();
                toast({
                    title: "Login Successful",
                    description: "Welcome to the admin dashboard",
                });
                setLocation('/admin/dashboard');
            } else {
                handleFailedAttempt();
                setOtp('');
                toast({
                    title: "Invalid OTP",
                    description: data.message || "Please check your verification code.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            handleFailedAttempt();
            setOtp('');
            toast({
                title: "Connection Error",
                description: "Please check your connection and try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adminId }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "OTP Resent",
                    description: `New verification code sent to ${data.maskedEmail}`,
                });
            } else {
                toast({
                    title: "Resend Failed",
                    description: data.message || "Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            toast({
                title: "Connection Error",
                description: "Please check your connection and try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Access Code Step
    if (currentStep === 'accessCode') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center mb-4">
                            <div className="rounded-full bg-blue-100 p-3">
                                <Shield className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Admin Access</CardTitle>
                        <CardDescription className="text-center">
                            Enter the access code to proceed to admin login
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLockedOut && (
                            <Alert className="mb-4 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    Account locked. Please wait {formatTime(timeRemaining)} before trying again.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isLockedOut && attempts > 0 && (
                            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    {MAX_ATTEMPTS - attempts} attempts remaining
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="accessCode">Access Code</Label>
                                <div className="relative">
                                    <Input
                                        id="accessCode"
                                        type="text"
                                        placeholder="Enter access code"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        disabled={isLockedOut || loading}
                                        className="pl-10"
                                        required
                                    />
                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={isLockedOut || loading || !accessCode.trim()}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Verifying...
                                    </div>
                                ) : isLockedOut ? (
                                    'Account Locked'
                                ) : (
                                    'Verify Access Code'
                                )}
                            </Button>
                        </form>
                        
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500">
                                Secure admin portal • All activities are monitored
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Login Credentials Step  
    if (currentStep === 'login') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center mb-4">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLockedOut && (
                            <Alert className="mb-4 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    Account locked. Please wait {formatTime(timeRemaining)} before trying again.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isLockedOut && attempts > 0 && (
                            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    {MAX_ATTEMPTS - attempts} attempts remaining
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLockedOut || loading}
                                        className="pl-10"
                                        required
                                    />
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLockedOut || loading}
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLockedOut || loading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={isLockedOut || loading || !username.trim() || !password.trim()}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Verifying...
                                    </div>
                                ) : isLockedOut ? (
                                    'Account Locked'
                                ) : (
                                    'Send OTP'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 space-y-4">
                            <div className="text-center">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setCurrentStep('accessCode')}
                                    disabled={loading}
                                >
                                    ← Back to Access Code
                                </Button>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-xs text-gray-500">
                                    Secure admin portal • All activities are monitored
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // OTP Verification Step
    if (currentStep === 'otp') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center mb-4">
                            <div className="rounded-full bg-blue-100 p-3">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Verify OTP</CardTitle>
                        <CardDescription className="text-center">
                            Enter the 6-digit code sent to {maskedEmail}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLockedOut && (
                            <Alert className="mb-4 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    Account locked. Please wait {formatTime(timeRemaining)} before trying again.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isLockedOut && attempts > 0 && (
                            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    {MAX_ATTEMPTS - attempts} attempts remaining
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleOtpVerification} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">Verification Code</Label>
                                <div className="relative">
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        disabled={isLockedOut || loading}
                                        className="pl-10 text-center text-lg font-mono tracking-wider"
                                        maxLength={6}
                                        required
                                    />
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={isLockedOut || loading || otp.length !== 6}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Verifying OTP...
                                    </div>
                                ) : isLockedOut ? (
                                    'Account Locked'
                                ) : (
                                    'Verify & Login'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 space-y-4">
                            <div className="text-center">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                >
                                    Resend OTP
                                </Button>
                            </div>
                            
                            <div className="text-center">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setCurrentStep('login')}
                                    disabled={loading}
                                >
                                    ← Back to Login
                                </Button>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-xs text-gray-500">
                                    Secure admin portal • All activities are monitored
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
};

export default AdminLogin;