'use client';

import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  LayoutDashboard, 
  UserCircle, 
  MapPin, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  PlusCircle,
  Search,
  Activity,
  Users,
  Hospital,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPinned,
  CheckCircle2,
  Clock,
  AlertCircle,
  Map as MapIcon,
  Filter,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  AlertTriangle,
  Info,
  Shield,
  Heart,
  ArrowRight,
  Check,
  MapPin as MapPinIcon,
  LocateFixed
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type Database } from '@/database.types';

// Mock Roles
type Role = 'donor' | 'recipient' | 'hospital' | 'admin';

// Mock Data
const MOCK_DONATION_HISTORY = [
  { id: 1, date: '2023-12-15', location: 'City General Hospital', units: 1, status: 'Completed' },
  { id: 2, date: '2023-08-20', location: 'Red Cross Center', units: 1, status: 'Completed' },
  { id: 3, date: '2023-04-10', location: 'Community Clinic', units: 1, status: 'Completed' },
];

const MOCK_BLOOD_REQUESTS = [
  { id: 1, group: 'O+', units: 2, status: 'Pending', hospital: 'City General', date: '2024-03-12', priority: 'Emergency' },
  { id: 2, group: 'A-', units: 1, status: 'Approved', hospital: 'St. Mary Hospital', date: '2024-03-10', priority: 'Normal' },
  { id: 3, group: 'O+', units: 3, status: 'Fulfilled', hospital: 'Community Clinic', date: '2024-02-28', priority: 'Emergency' },
];

const MOCK_NEARBY_DONORS = [
  { id: 1, name: 'Sarah Wilson', group: 'O+', distance: '0.8 km', available: true, lastDonation: '4 months ago' },
  { id: 2, name: 'Michael Chen', group: 'O+', distance: '1.2 km', available: true, lastDonation: '6 months ago' },
  { id: 3, name: 'Emma Davis', group: 'A-', distance: '2.5 km', available: false, lastDonation: '1 month ago' },
  { id: 4, name: 'James Miller', group: 'O+', distance: '3.1 km', available: true, lastDonation: '3 months ago' },
];

const MOCK_HOSPITAL_INVENTORY = [
  { group: 'O+', units: 45, status: 'Stable' },
  { group: 'A+', units: 12, status: 'Low' },
  { group: 'B+', units: 8, status: 'Critical' },
  { group: 'O-', units: 5, status: 'Critical' },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'emergency', title: 'Emergency Request', message: 'O- Negative needed at City General Hospital', time: '2 mins ago' },
  { id: 2, type: 'success', title: 'Donation Confirmed', message: 'Your donation at Red Cross was successful', time: '1 hour ago' },
  { id: 3, type: 'info', title: 'New Donor Nearby', message: 'A new A+ donor registered in your area', time: '3 hours ago' },
];

const MOCK_MAP_DONORS = [
  { id: 1, lat: 40, lng: 40, type: 'available', group: 'O+' },
  { id: 2, lat: 45, lng: 35, type: 'donated', group: 'A-' },
  { id: 3, lat: 35, lng: 45, type: 'emergency', group: 'B+' },
];

export default function BloodBankApp() {
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'landing'>('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [role, setRole] = useState<Role>('donor');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Donor Specific State
  const [isAvailable, setIsAvailable] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mapRadius, setMapRadius] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) {
          setProfile(profile);
          setRole(profile.role as Role);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role }
          }
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            role: role
          });
        }
        alert('Check your email for verification!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAuthMode('landing');
  };

  const roles: { id: Role; label: string; icon: React.ReactNode }[] = [
    { id: 'donor', label: 'Donor', icon: <UserCircle size={18} /> },
    { id: 'recipient', label: 'Recipient', icon: <Droplets size={18} /> },
    { id: 'hospital', label: 'Hospital', icon: <Hospital size={18} /> },
    { id: 'admin', label: 'Admin', icon: <ShieldCheck size={18} /> },
  ];

  const sidebarItems = {
    donor: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'profile', label: 'My Profile', icon: <UserCircle size={20} /> },
      { id: 'history', label: 'Donation History', icon: <Activity size={20} /> },
    ],
    recipient: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'request', label: 'Request Blood', icon: <PlusCircle size={20} /> },
      { id: 'nearby', label: 'Nearby Donors', icon: <MapPin size={20} /> },
    ],
    hospital: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'emergency', label: 'Emergency Alert', icon: <Bell size={20} /> },
      { id: 'inventory', label: 'Blood Inventory', icon: <Droplets size={20} /> },
    ],
    admin: [
      { id: 'dashboard', label: 'Analytics', icon: <LayoutDashboard size={20} /> },
      { id: 'users', label: 'User Management', icon: <Users size={20} /> },
      { id: 'reports', label: 'Reports', icon: <Activity size={20} /> },
    ],
  };

  const renderLandingPage = () => (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <nav className="px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-2 rounded-lg text-white">
            <Droplets size={24} fill="currentColor" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-red-600">LifeFlow</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setAuthMode('login')} className="px-6 py-2 font-semibold text-slate-600 hover:text-red-600 transition-colors">Login</button>
          <button onClick={() => setAuthMode('signup')} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100">Get Started</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold">
            <Heart size={16} /> Every Drop Counts
          </div>
          <h1 className="text-6xl lg:text-7xl font-black text-slate-900 leading-tight">
            Connecting <span className="text-red-600">Life</span> <br />
            In Real Time.
          </h1>
          <p className="text-xl text-slate-500 max-w-lg leading-relaxed">
            The fastest way to find blood donors near you. Join our community of lifesavers and help bridge the gap between donors and recipients.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setAuthMode('signup')} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center gap-2">
              Register as Donor <ArrowRight size={20} />
            </button>
            <button onClick={() => setAuthMode('login')} className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-bold text-lg hover:border-red-200 transition-all">
              Find Blood Now
            </button>
          </div>
          <div className="flex items-center gap-8 pt-4">
            <div>
              <p className="text-3xl font-black text-slate-900">2.8k+</p>
              <p className="text-slate-500 font-medium">Active Donors</p>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div>
              <p className="text-3xl font-black text-slate-900">45+</p>
              <p className="text-slate-500 font-medium">Hospitals</p>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div>
              <p className="text-3xl font-black text-slate-900">12k+</p>
              <p className="text-slate-500 font-medium">Lives Saved</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
          <div className="relative bg-slate-50 rounded-[40px] p-8 border border-slate-100 shadow-2xl">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white">
                  <MapPinIcon size={24} />
                </div>
                <div>
                  <p className="font-bold">Emergency Request</p>
                  <p className="text-xs text-slate-500">O- Negative needed at City General</p>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 w-3/4 animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <p className="text-sm font-bold text-slate-400 mb-1">Donors Nearby</p>
                <p className="text-3xl font-black text-slate-900">12</p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <p className="text-sm font-bold text-slate-400 mb-1">Response Time</p>
                <p className="text-3xl font-black text-slate-900">4m</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderAuthPage = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div className="p-10">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="bg-red-600 p-2 rounded-lg text-white">
              <Droplets size={24} fill="currentColor" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-red-600">LifeFlow</span>
          </div>
          
          <h2 className="text-3xl font-black text-center mb-2">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 text-center mb-8">
            {authMode === 'login' ? 'Enter your credentials to continue' : 'Join our community of lifesavers today'}
          </p>

          <form className="space-y-4" onSubmit={handleAuth}>
            {authMode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button type="button" onClick={() => setRole('donor')} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${role === 'donor' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-100 text-slate-500'}`}>Donor</button>
                  <button type="button" onClick={() => setRole('recipient')} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${role === 'recipient' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-100 text-slate-500'}`}>Recipient</button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                  <input name="fullName" type="text" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="John Doe" />
                </div>
              </>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
              <input name="email" type="email" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="name@example.com" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
              <input name="password" type="password" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 mt-4 disabled:opacity-50">
              {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="ml-2 text-red-600 font-bold hover:underline">
                {authMode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDonorDashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
            <Activity size={24} />
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Total Donations</h3>
          <p className="text-2xl font-bold mt-1">12 Units</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Lives Impacted</h3>
          <p className="text-2xl font-bold mt-1">36 People</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <button 
              onClick={() => setIsAvailable(!isAvailable)}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isAvailable ? 'Available' : 'Busy'}
            </button>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Current Status</h3>
          <p className={`text-2xl font-bold mt-1 ${isAvailable ? 'text-green-600' : 'text-slate-400'}`}>
            {isAvailable ? 'Ready to Donate' : 'On Break'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-red-500 to-pink-500"></div>
          <div className="px-6 pb-6">
            <div className="relative -mt-12 mb-4">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
                <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                  {profile?.full_name?.substring(0, 2).toUpperCase() || 'JD'}
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold">{profile?.full_name || 'John Doe'}</h3>
            <p className="text-slate-500 text-sm mb-4">O+ Positive Donor</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span>+1 (555) 000-1234</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span>{user?.email || 'john.doe@example.com'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPinned size={16} className="text-slate-400" />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Last Donation: Dec 15, 2023</span>
              </div>
            </div>

            <button 
              onClick={() => setShowRegistration(true)}
              className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Donation History */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Donation History</h3>
            <button className="text-red-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {MOCK_DONATION_HISTORY.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                    <Droplets size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{item.location}</p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.units} Unit</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 size={12} />
                    <span>{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Refined Registration Form with all fields from spec
  const renderRegistrationForm = () => (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold">Donor Registration</h2>
            <p className="text-slate-500">Complete your profile to start saving lives.</p>
          </div>
          <button onClick={() => setShowRegistration(false)} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <form className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => { e.preventDefault(); setShowRegistration(false); }}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none" placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Blood Group</label>
            <select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none">
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Age</label>
            <input type="number" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none" placeholder="25" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Gender</label>
            <select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none">
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Contact Number</label>
            <input type="tel" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Current Location</label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Manual address or GPS" />
              <button type="button" className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LocateFixed size={20} />
              </button>
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-700">Health Eligibility Declaration</label>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm text-slate-600">I have not donated blood in the last 3 months.</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm text-slate-600">I am not currently on any major medication.</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm text-slate-600">I weigh more than 50kg and feel healthy today.</span>
              </label>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-3 pt-4">
            <button type="submit" className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
              Complete Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderRecipientDashboard = () => (
    <div className="space-y-8">
      {/* Request Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">1 ACTIVE</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Pending Requests</h3>
          <p className="text-2xl font-bold mt-1">01</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">LAST WEEK</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Approved</h3>
          <p className="text-2xl font-bold mt-1">05</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <Droplets size={24} />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">TOTAL</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Fulfilled</h3>
          <p className="text-2xl font-bold mt-1">12</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold">My Blood Requests</h3>
            <button onClick={() => setShowRequestForm(true)} className="text-red-600 text-sm font-bold flex items-center gap-1 hover:underline">
              <PlusCircle size={16} /> New Request
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Blood Group</th>
                  <th className="px-6 py-4 font-semibold">Hospital</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_BLOOD_REQUESTS.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs">
                          {req.group}
                        </div>
                        <span className="font-medium">{req.units} Units</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.hospital}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                        req.priority === 'Emergency' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          req.status === 'Fulfilled' ? 'bg-green-500' : req.status === 'Approved' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></div>
                        <span className="text-sm font-medium text-slate-700">{req.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nearby Donors List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Nearby Donors</h3>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Filter size={18} />
            </button>
          </div>
          <div className="space-y-4">
            {MOCK_NEARBY_DONORS.map((donor) => (
              <div key={donor.id} className="p-4 rounded-xl border border-slate-100 hover:border-red-100 hover:bg-red-50/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                      {donor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{donor.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={10} /> {donor.distance} away
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-black">
                    {donor.group}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <span className={`text-[10px] font-bold uppercase ${donor.available ? 'text-green-600' : 'text-slate-400'}`}>
                    {donor.available ? 'Available Now' : 'Unavailable'}
                  </span>
                  <button className="text-xs font-bold text-red-600 hover:underline">Contact</button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:border-red-200 hover:text-red-600 transition-all">
            View on Map
          </button>
        </div>
      </div>
    </div>
  );

  const renderBloodRequestForm = () => (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Request Blood</h2>
            <p className="text-slate-500">Fill in the details for your emergency or scheduled request.</p>
          </div>
          <button onClick={() => setShowRequestForm(false)} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); setShowRequestForm(false); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Blood Group Required</label>
              <select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none">
                <option>O+</option>
                <option>O-</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Units Needed</label>
              <input type="number" min="1" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none" placeholder="1" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Condition / Urgency</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="p-3 rounded-xl border-2 border-red-600 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2">
                <AlertCircle size={18} /> Emergency
              </button>
              <button type="button" className="p-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-2">
                Normal
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Hospital Name</label>
            <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Enter hospital name" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input type="text" className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Search hospital location" />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );

  const renderHospitalDashboard = () => (
    <div className="space-y-8">
      {/* Emergency Banner */}
      <div className="bg-red-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-xl shadow-red-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center animate-pulse">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Emergency Alert System</h3>
            <p className="text-red-100">Broadcast an immediate request to all nearby donors.</p>
          </div>
        </div>
        <button className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors">
          Trigger Alert
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold">Blood Inventory</h3>
            <button className="text-red-600 text-sm font-bold">Manage Stock</button>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {MOCK_HOSPITAL_INVENTORY.map((item) => (
              <div key={item.group} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-black text-red-600">{item.group}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'Critical' ? 'bg-red-100 text-red-600' : 
                    item.status === 'Low' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-2xl font-bold">{item.units}</p>
                <p className="text-xs text-slate-500">Units available</p>
              </div>
            ))}
          </div>
        </div>

        {/* Incoming Requests */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold mb-6">Incoming Requests</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                  O+
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Patient ID: #442{i}</p>
                  <p className="text-xs text-slate-500">Requested 15m ago</p>
                </div>
                <button className="text-xs font-bold text-red-600">Approve</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Donors', value: '2,840', trend: '+12%', icon: <Users />, color: 'blue' },
          { label: 'Active Requests', value: '142', trend: '+5%', icon: <Droplets />, color: 'red' },
          { label: 'Hospitals', value: '48', trend: '0%', icon: <Hospital />, color: 'purple' },
          { label: 'Success Rate', value: '94%', trend: '+2%', icon: <TrendingUp />, color: 'green' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                <ArrowUpRight size={12} /> {stat.trend}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold">User Management</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Verification</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { name: 'City General', role: 'Hospital', status: 'Active', verified: true },
              { name: 'Sarah Wilson', role: 'Donor', status: 'Active', verified: true },
              { name: 'Mark Thompson', role: 'Recipient', status: 'Pending', verified: false },
            ].map((user, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{user.role}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase">{user.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${user.verified ? 'bg-red-600' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${user.verified ? 'translate-x-6' : ''}`}></div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-slate-100 rounded-lg"><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMapComponent = () => (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Search Radius: {mapRadius}km</label>
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={mapRadius} 
            onChange={(e) => setMapRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600" 
          />
        </div>
        <div className="flex gap-2">
          {['A+', 'B+', 'O+', 'AB+', 'All'].map(g => (
            <button key={g} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${g === 'All' ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[600px] bg-slate-200 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-122.4194,37.7749,12,0/1000x600?access_token=mock')] bg-cover bg-center opacity-50"></div>
        
        {/* Mock Grid Lines */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        {/* Map Markers */}
        <div className="absolute top-1/4 left-1/3 group cursor-pointer">
          <div className="bg-red-600 text-white p-2 rounded-full shadow-lg animate-bounce">
            <Droplets size={20} fill="currentColor" />
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-white p-2 rounded-lg shadow-xl border border-slate-100 whitespace-nowrap">
            <p className="text-xs font-bold">Available Donor: O+</p>
          </div>
        </div>

        <div className="absolute bottom-1/3 right-1/4 group cursor-pointer">
          <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
            <Hospital size={20} />
          </div>
        </div>

        <div className="absolute top-1/2 right-1/2 group cursor-pointer">
          <div className="bg-amber-500 text-white p-2 rounded-full shadow-lg animate-pulse">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div> Available Donor
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div> Hospital
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div> Emergency Request
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsPanel = () => (
    <div className="absolute top-20 right-8 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold">Notifications</h3>
        <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {MOCK_NOTIFICATIONS.map((n) => (
          <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                n.type === 'emergency' ? 'bg-red-50 text-red-600' : 
                n.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {n.type === 'emergency' ? <AlertTriangle size={18} /> : n.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">{n.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full p-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">Mark all as read</button>
    </div>
  );

  if (isAuthenticated === null) return <div className="min-h-screen flex items-center justify-center"><Droplets className="animate-bounce text-red-600" size={48} /></div>;

  if (!isAuthenticated) {
    return authMode === 'landing' ? renderLandingPage() : renderAuthPage();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed h-full z-50`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-red-600 p-2 rounded-lg text-white">
            <Droplets size={24} fill="currentColor" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-red-600">LifeFlow</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems[role].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                console.log(`Sidebar tab clicked. activeTab: ${activeTab}, item.id: ${item.id}`);
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? 'bg-red-50 text-red-600 font-medium' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
            <Settings size={20} />
            {isSidebarOpen && <span>Settings</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id); setActiveTab('dashboard'); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    role === r.id ? 'bg-white text-red-600 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {r.icon}
                  <span className="hidden md:inline">{r.label}</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <button onClick={() => {
                console.log(`Notifications bell clicked. showNotifications: ${!showNotifications}`);
                setShowNotifications(!showNotifications);
              }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              {showNotifications && renderNotificationsPanel()}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! 👋</h2>
                <p className="text-slate-500 mt-1">Here's what's happening with your {role} account today.</p>
              </div>
              {role === 'donor' && activeTab === 'dashboard' && (
                <button onClick={() => {
                  console.log(`Donor dashboard: Update Info clicked. showRegistration: ${!showRegistration}`);
                  setShowRegistration(true);
                }} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                  <PlusCircle size={20} /> Update Info
                </button>
              )}
              {role === 'recipient' && activeTab === 'dashboard' && (
                <button onClick={() => {
                  console.log(`Recipient dashboard: Request Blood clicked. showRequestForm: ${!showRequestForm}`);
                  setShowRequestForm(true);
                }} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                  <PlusCircle size={20} /> Request Blood
                </button>
              )}
            </div>

            {/* Role-based Rendering */}
            {role === 'donor' && activeTab === 'dashboard' && renderDonorDashboard()}
            {role === 'recipient' && activeTab === 'dashboard' && renderRecipientDashboard()}
            {role === 'recipient' && activeTab === 'nearby' && renderMapComponent()}
            {role === 'hospital' && activeTab === 'dashboard' && renderHospitalDashboard()}
            {role === 'admin' && activeTab === 'dashboard' && renderAdminDashboard()}
            
            {/* Fallback for other tabs */}
            {activeTab !== 'dashboard' && activeTab !== 'nearby' && (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <LayoutDashboard size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Content for {activeTab} coming soon</h3>
                <p className="text-slate-400 max-w-xs mt-2">We are currently building the {activeTab} experience for {role}s.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showRegistration && renderRegistrationForm()}
      {showRequestForm && renderBloodRequestForm()}
    </div>
  );
}
