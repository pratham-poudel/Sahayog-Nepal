import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { API_URL as CONFIG_API_URL } from '../config/index.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';

// Base API URL
const API_URL = `${CONFIG_API_URL}/api`;

const AdminLogin = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState(null);
    const [, setLocation] = useLocation();
    const { toast } = useToast();    // Security configurations
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    const ACCESS_CODE = import.meta.env.VITE_ADMIN_ACCESS_CODE || '250529';

    useEffect(() => {
        // Check if already logged in
        const checkAuth = async () => {
            try {
                const response = await axios.get(`${API_URL}/admin/check-auth`, { withCredentials: true });
                if (response.data.success) {
                    setLocation('/admin/dashboard');
                }
            } catch (error) {
                // Not logged in, continue with login flow
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
                description: `Too many failed attempts. Please try again in ${LOCKOUT_DURATION / 60000} minutes.`,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Invalid credentials",
                description: `${MAX_ATTEMPTS - newAttempts} attempts remaining`,
                variant: "destructive"
            });
        }
    };

    const resetAttempts = () => {
        setAttempts(0);
        localStorage.removeItem('adminAttempts');
        localStorage.removeItem('adminLockoutEnd');
    };

    const handleAccessCodeSubmit = (e) => {
        e.preventDefault();
        if (isLockedOut) return;

        if (accessCode === ACCESS_CODE) {
            setShowLogin(true);
            resetAttempts();
            toast({
                title: "Access Granted",
                description: "Please enter your admin credentials",
                className: "bg-green-50 border-green-200"
            });
        } else {
            handleFailedAttempt();
            setAccessCode('');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLockedOut || loading) return;

        setLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/admin/login`, 
                { username, password },
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                resetAttempts();
                toast({
                    title: "Login Successful",
                    description: "Welcome to the admin dashboard",
                    className: "bg-green-50 border-green-200"
                });
                setLocation('/admin/dashboard');
            }
        } catch (error) {            handleFailedAttempt();
            setPassword('');
            
            // Log security events in production
            if (import.meta.env.MODE === 'production') {
                console.warn('Failed admin login attempt:', {
                    timestamp: new Date().toISOString(),
                    username,
                    error: error.response?.data?.message
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };    if (!showLogin) {
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
                                    Account locked due to multiple failed attempts. 
                                    Please wait {formatTime(timeRemaining)} before trying again.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isLockedOut && attempts > 0 && (
                            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    {MAX_ATTEMPTS - attempts} attempts remaining before lockout
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="accessCode">Access Code</Label>
                                <div className="relative">
                                    <Input
                                        id="accessCode"
                                        type="password"
                                        placeholder="Enter access code"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        disabled={isLockedOut}
                                        className="pl-10"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={isLockedOut || !accessCode.trim()}
                            >
                                {isLockedOut ? 'Locked' : 'Verify Access'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500">
                                Authorized personnel only. All access attempts are logged.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                        Enter your credentials to access the admin dashboard
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
                                    Authenticating...
                                </div>
                            ) : isLockedOut ? (
                                'Account Locked'
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 space-y-4">
                        <div className="text-center">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    setShowLogin(false);
                                    setUsername('');
                                    setPassword('');
                                }}
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
            </Card>        </div>
    );
};

export default AdminLogin;