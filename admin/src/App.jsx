import React, { useState, useMemo, useEffect } from 'react';
import api from './services/api';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  ArrowLeftRight,
  ShieldCheck,
  Plus,
  Search,
  Bell,
  Settings,
  Users,
  Activity,
  BarChart3,
  Landmark,
  Lock,
  Wallet,
  MoreVertical,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  LogOut,
  Key,
  Shield,
  Cpu,
  UserCheck,
  ToggleLeft,
  Menu,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
import logo from './assets/logo.png';

// Standard fallback mock images for party avatars
const avatarList = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
];

export default function App() {
  // Session authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Apply theme class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter status dropdown state
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Date filter state
  const [dateRange, setDateRange] = useState('Today');

  // Admin profile state details
  const [adminName, setAdminName] = useState('Admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminAvatar, setAdminAvatar] = useState('https://ui-avatars.com/api/?name=Admin&background=00D285&color=000&bold=true');

  // Admin Profile Edit states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Platform setting parameter configurations
  const [platformFee, setPlatformFee] = useState(0);
  const [settlementMode, setSettlementMode] = useState('AUTOMATED');
  const [complianceThreshold, setComplianceThreshold] = useState(0);

  // Edit settings form fields
  const [editFee, setEditFee] = useState(0);
  const [editMode, setEditMode] = useState('AUTOMATED');
  const [editThreshold, setEditThreshold] = useState(0);

  // Notifications feed state
  const [notifications, setNotifications] = useState([]);

  // Markets list state
  const [markets, setMarkets] = useState([]);
  const [newMarketPair, setNewMarketPair] = useState('');
  const [newMarketRate, setNewMarketRate] = useState('');
  const [newMarketVol, setNewMarketVol] = useState('');
  const [newMarketStatus, setNewMarketStatus] = useState('ACTIVE');
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);

  // User Portfolio balances ledger
  const [userBalances, setUserBalances] = useState([]);

  // KYC User Verification requests state
  const [kycUsers, setKycUsers] = useState([]);
  const [kycSearchQuery, setKycSearchQuery] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState('ALL');
  const [selectedKycUser, setSelectedKycUser] = useState(null);

  // Portfolio vault reserve states
  const [vaultBalances, setVaultBalances] = useState({
    custodyPool: 0,
    escrowLocked: 0,
    coldReserve: 0,
    payoutBank: 0
  });
  const [transferSource, setTransferSource] = useState('payoutBank');
  const [transferDest, setTransferDest] = useState('coldReserve');
  const [transferAmount, setTransferAmount] = useState('');

  // Security credentials form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Transactions list state
  const [txnStatusFilter, setTxnStatusFilter] = useState('ALL');
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  
  // Dashboard stats from server
  const [dbStats, setDbStats] = useState({
    users: 0,
    activeTrades: 0,
    volume: 0,
    revenue: 0,
    inEscrow: 0,
    coldWalletBalance: 0,
    liquidity: 0
  });

  // Security audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

  // Trade list state
  const [trades, setTrades] = useState([]);

  // Modal forms state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPartyA, setNewPartyA] = useState('');
  const [newPartyB, setNewPartyB] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newStatus, setNewStatus] = useState('SETTLED');

  // Active action menu row index
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Chart data
  const tradeFrequencyData = [
    { hour: '08:00 AM', count: 18, highlighted: false },
    { hour: '10:00 AM', count: 24, highlighted: false },
    { hour: '12:00 PM', count: 32, highlighted: false },
    { hour: '02:00 PM', count: 48, highlighted: false },
    { hour: '04:00 PM', count: 56, highlighted: true },
    { hour: '06:00 PM', count: 38, highlighted: false },
    { hour: '08:00 PM', count: 35, highlighted: false },
    { hour: '10:00 PM', count: 29, highlighted: false },
    { hour: '12:00 AM', count: 20, highlighted: false },
    { hour: '02:00 AM', count: 12, highlighted: false }
  ];

  // Dynamically calculate dashboard overview metrics based on state
  const metrics = useMemo(() => {
    return {
      users: dbStats.users.toLocaleString(),
      activeTrades: dbStats.activeTrades.toLocaleString(),
      volume: '₦' + dbStats.volume.toLocaleString(),
      revenue: '₦' + dbStats.revenue.toLocaleString(),
      inEscrow: '₦' + dbStats.inEscrow.toLocaleString(),
      coldWalletBalance: '₦' + (dbStats.coldWalletBalance / 1000000000).toFixed(2) + 'B',
      liquidity: '₦' + (dbStats.liquidity / 1000000000).toFixed(2) + 'B'
    };
  }, [dbStats]);

  // Fetch data on mount if logged in
  // Pre-fill email if "Remember Me" was previously used
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmailInput(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardStats();
      fetchUsers();
      fetchTransactions();
      fetchTrades();
      fetchMarkets();
      fetchSettings();
      fetchSecurityLogs();
      fetchVaults();
    }
  }, [isLoggedIn]);

  const fetchDashboardStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setDbStats(data);
      // Update platform fee etc from actual settings if exists
      setPlatformFee(1.5); // Placeholder or fetch from settings
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      // Map server users to userBalances structure
      const mappedUsers = data.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        phone: u.phone,
        balance: u.balance,
        status: u.isVerified ? 'Healthy' : 'Unverified'
      }));
      setUserBalances(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/admin/transactions');
      const mappedTxns = data.map(t => ({
        hash: t.reference,
        type: t.type.toUpperCase(),
        amount: t.amount,
        fromTo: t.type === 'deposit' ? `Bank -> ${t.user?.firstName || 'User'}` : `${t.user?.firstName || 'User'} -> Bank`,
        userName: t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Unknown',
        userEmail: t.user?.email || 'N/A',
        userPhone: t.user?.phone || 'N/A',
        time: new Date(t.createdAt).toLocaleString(),
        status: t.status === 'completed' ? 'SUCCESS' : t.status === 'pending' ? 'PENDING' : 'FAILED'
      }));
      setTransactions(mappedTxns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchTrades = async () => {
    try {
      const { data } = await api.get('/admin/trades');
      const mappedTrades = data.map(t => ({
        id: t._id,
        partyA: t.initiator ? `${t.initiator.firstName} ${t.initiator.lastName}` : 'System',
        partyB: t.responder ? `${t.responder.firstName} ${t.responder.lastName}` : 'Unpaired',
        avatarA: avatarList[Math.floor(Math.random() * avatarList.length)],
        avatarB: avatarList[Math.floor(Math.random() * avatarList.length)],
        asset: 'NGN',
        amount: t.amount,
        time: new Date(t.createdAt).toLocaleTimeString(),
        status: t.status
      }));
      setTrades(mappedTrades);
    } catch (error) {
       console.error('Error fetching trades:', error);
    }
  };

  const fetchMarkets = async () => {
    try {
      const { data } = await api.get('/admin/markets');
      setMarkets(data.map(m => ({
        id: m._id,
        pair: m.pair,
        rate: m.rate,
        change: m.change,
        volume: m.volume,
        status: m.status
      })));
    } catch (error) {
       console.error('Error fetching markets:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      setPlatformFee(data.platformFee);
      setSettlementMode(data.settlementMode);
      setComplianceThreshold(data.complianceThreshold);
      
      setEditFee(data.platformFee);
      setEditMode(data.settlementMode);
      setEditThreshold(data.complianceThreshold);
    } catch (error) {
       console.error('Error fetching settings:', error);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const { data } = await api.get('/admin/security-logs');
      setAuditLogs(data.map(l => ({
        id: l._id,
        type: l.type,
        text: l.text,
        meta: l.meta,
        icon: l.icon,
        time: new Date(l.createdAt).toLocaleString()
      })));
    } catch (error) {
       console.error('Error fetching security logs:', error);
    }
  };

  const fetchVaults = async () => {
    try {
      const { data } = await api.get('/admin/vaults');
      setVaultBalances({
        custodyPool: data.custodyPool,
        escrowLocked: data.escrowLocked,
        coldReserve: data.coldReserve,
        payoutBank: data.payoutBank
      });
    } catch (error) {
       console.error('Error fetching vaults:', error);
    }
  };



  const handleExportReport = () => {
    try {
      showToast('Preparing analytical report for download...', 'success');
      const headers = ['Transaction Hash', 'Type', 'Amount', 'User', 'Time', 'Status'];
      const rows = transactions.map(t => [
        t.hash,
        t.type,
        t.amount,
        t.userName,
        t.time,
        t.status
      ]);
      
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `peeritrade_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
       showToast('Failed to generate export.', 'error');
    }
  };

  // Log in administrative session
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    setLoginSuccess('');

    try {
      const { data } = await api.post('/auth/login', {
        email: emailInput,
        password: passwordInput
      });

      if (data.role !== 'admin') {
        setLoginError('Access denied: Unauthorized biological or machine signature.');
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('token', data.token);
      setAdminName(data.firstName + ' ' + data.lastName);
      setAdminEmail(data.email);
      setAdminPhone(data.phone);
      
      // Handle "Remember Me"
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', emailInput);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      setLoginSuccess('Authentication successful. Redirecting to terminal...');
      
      logSecurityEvent('success', `Administrative login authorized for ${emailInput}`, 'IP Detected', 'login');
      
      // Delay transition for visual feedback
      setTimeout(() => {
        setIsLoggedIn(true);
        setLoginSuccess('');
        setIsSubmitting(false);
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);
      const msg = error.response?.data?.message || 'Gateway rejection: Invalid credentials or server offline.';
      setLoginError(msg);
      setIsSubmitting(false);
    }
  };

  // Helper to log security events
  const logSecurityEvent = async (type, text, meta, iconType) => {
    try {
      await api.post('/admin/security-logs', { type, text, meta, icon: iconType });
      fetchSecurityLogs(); // Refresh logs
    } catch (error) {
      console.error('Error logging event:', error);
    }
  };

  // Handle New Trade Creation
  const handleCreateTrade = (e) => {
    e.preventDefault();
    if (!newPartyA || !newPartyB || !newAmount) return;

    const amountNum = parseFloat(newAmount) || 0;
    const randomId = `#TRD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord = {
      id: randomId,
      partyA: newPartyA,
      partyB: newPartyB,
      avatarA: avatarList[Math.floor(Math.random() * avatarList.length)],
      avatarB: avatarList[Math.floor(Math.random() * avatarList.length)],
      asset: 'NGN',
      amount: amountNum,
      time: 'Just now',
      status: newStatus
    };

    setTrades([newRecord, ...trades]);
    setIsModalOpen(false);
    setNewPartyA('');
    setNewPartyB('');
    setNewAmount('');
    setNewStatus('SETTLED');
    setCurrentPage(1);

    // Write audit log
    logSecurityEvent('success', `New simulated escrow trade locked successfully: ${randomId} for ₦${amountNum.toLocaleString()}`, `Initiator: HASHIM . Just now`, 'success');

    // Prepend a Transaction record too
    const newTx = {
      hash: '0x' + Math.random().toString(16).substring(2, 18),
      type: 'ESCROW_LOCK',
      amount: amountNum,
      fromTo: `${newPartyA} -> Escrow Pool`,
      userName: newPartyA,
      userEmail: `${newPartyA.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      userPhone: '090' + Math.floor(10000000 + Math.random() * 90000000),
      time: 'Just now',
      status: 'SUCCESS'
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Handle Changing Trade Status
  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      await api.post('/admin/trades/status', { tradeId: id, status: nextStatus });
      showToast(`Trade status updated to ${nextStatus}`, 'success');
      fetchTrades();
      setActiveMenuId(null);
      
      logSecurityEvent(
        nextStatus === 'SETTLED' ? 'success' : 'warning', 
        `Trade record ${id} status modified to ${nextStatus} via manual override`, 
        `Operator Authorization: ${adminName}`, 
        nextStatus === 'SETTLED' ? 'shield' : 'alert-triangle'
      );
    } catch (error) {
      showToast('Failed to update trade status.', 'error');
    }
  };

  // Handle Deleting Trade
  const handleDeleteTrade = (id) => {
    setTrades(trades.filter((trade) => trade.id !== id));
    setActiveMenuId(null);

    // Write audit log
    logSecurityEvent('warning', `Simulated trade record ${id} was purged from compliance tables`, `Operator: HASHIM . Just now`, 'shield');
  };

  // Handle Change Password Form
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match sequential signature.', 'error');
      return;
    }
    
    try {
      await api.post('/admin/change-password', { oldPassword, newPassword });
      showToast('Administrative credentials updated successfully.', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      logSecurityEvent('success', 'Admin master access token updated', `Operator: ${adminName}`, 'key');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update credentials.', 'error');
    }
  };

  // Handle saving administrator profile updates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) {
      showToast('Validation failed: Required administrative fields missing.', 'error');
      return;
    }
    
    try {
      const names = editName.split(' ');
      await api.post('/admin/profile', {
        firstName: names[0],
        lastName: names.slice(1).join(' '),
        email: editEmail,
        phone: editPhone
      });
      setAdminName(editName);
      setAdminEmail(editEmail);
      setAdminPhone(editPhone);
      setAdminAvatar(editAvatar);
      showToast('Administrator profile metadata synchronized.', 'success');
      logSecurityEvent('info', `Admin identity modified: ${editName}`, `Signature: ${editEmail}`, 'user-check');
    } catch (error) {
      showToast('Failed to update administrative profile.', 'error');
    }
  };

  // Handle saving platform config settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const feeNum = parseFloat(editFee);
    if (isNaN(feeNum) || feeNum < 0 || feeNum > 100) {
      showToast('Invalid commission value detected.', 'error');
      return;
    }
    
    try {
      await api.post('/admin/settings', {
        platformFee: feeNum,
        settlementMode: editMode,
        complianceThreshold: parseFloat(editThreshold) || 0
      });
      setPlatformFee(feeNum);
      setSettlementMode(editMode);
      setComplianceThreshold(parseFloat(editThreshold) || 0);
      showToast('Platform parameters committed to mainframe.', 'success');
      logSecurityEvent('warning', `System configuration updated: ${feeNum}% fee, ${editMode} mode`, `Authorized by ${adminName}`, 'cpu');
    } catch (error) {
      showToast('Failed to commit system settings.', 'error');
    }
  };

  // Handle simulated market creation
  const handleCreateMarket = async (e) => {
    e.preventDefault();
    if (!newMarketPair.trim() || !newMarketRate || !newMarketVol) return;
    const rateNum = parseFloat(newMarketRate) || 0;
    
    try {
      await api.post('/admin/markets', {
        pair: newMarketPair.toUpperCase(),
        rate: rateNum,
        volume: '₦' + (parseFloat(newMarketVol) || 0).toLocaleString(),
        status: newMarketStatus
      });
      fetchMarkets();
      setIsMarketModalOpen(false);
      setNewMarketPair('');
      setNewMarketRate('');
      setNewMarketVol('');
      setNewMarketStatus('ACTIVE');
      showToast(`Market pair ${newMarketPair.toUpperCase()} successfully registered.`, 'success');
      logSecurityEvent('success', `New market pair synchronized: ${newMarketPair.toUpperCase()}`, `Authorized: ${adminName}`, 'trending-up');
    } catch (error) {
      showToast('Failed to register new market pair.', 'error');
    }
  };

  // Handle internal vault reserves transfers
  const handleVaultTransfer = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(transferAmount) || 0;
    if (amountVal <= 0) {
      showToast('Please enter a valid transfer amount.', 'error');
      return;
    }
    if (transferSource === transferDest) {
      showToast('Source and destination vault partitions must be different.', 'error');
      return;
    }
    if (vaultBalances[transferSource] < amountVal) {
      showToast('Insufficient reserves inside selected source vault.', 'error');
      return;
    }

    try {
      const nextBalances = {
        ...vaultBalances,
        [transferSource]: vaultBalances[transferSource] - amountVal,
        [transferDest]: vaultBalances[transferDest] + amountVal
      };
      
      await api.post('/admin/vaults', nextBalances);
      setVaultBalances(nextBalances);
      setTransferAmount('');
      showToast(`Transfer of ₦${amountVal.toLocaleString()} completed successfully between vault partitions!`);
      logSecurityEvent('success', `Internal vault reserve clearing: ₦${amountVal.toLocaleString()} moved from ${transferSource} to ${transferDest}`, `Authorized by ${adminName}`, 'shield');
    } catch (error) {
      showToast('Vault transfer synchronization failed.', 'error');
    }
  };

  // Handle notification actions
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
    logSecurityEvent('success', `All system notifications marked as READ`, 'Operator Authorization', 'login');
  };

  const handleDismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Handle approving or rejecting KYC users registration
  const handleUpdateKycStatus = async (userId, nextStatus) => {
    try {
      await api.post('/admin/kyc-verify', { userId, status: nextStatus });
      fetchUsers(); // Refresh list
      logSecurityEvent(
        nextStatus === 'APPROVED' ? 'success' : 'warning',
        `User registration request updated to ${nextStatus}`,
        'Operator Authorization',
        nextStatus === 'APPROVED' ? 'login' : 'warning'
      );
      showToast(`User profile verification updated to ${nextStatus} successfully!`);
    } catch (error) {
      console.error('Error updating KYC status:', error);
      showToast('Failed to update KYC status.', 'error');
    }
  };

  // Handle Approve/Reject Transactions
  const handleUpdateTxnStatus = async (hash, nextStatus) => {
    try {
      // Need endpoint for updating transaction status
      await api.post('/admin/transactions/status', { reference: hash, status: nextStatus.toLowerCase() === 'success' ? 'completed' : 'failed' });
      showToast(`Transaction ${nextStatus === 'SUCCESS' ? 'approved' : 'rejected'} successfully.`, 'success');
      fetchTransactions();
      
      logSecurityEvent(
        nextStatus === 'SUCCESS' ? 'success' : 'warning', 
        `Transaction record ${hash.substring(0, 10)}... was manually ${nextStatus === 'SUCCESS' ? 'validated' : 'voided'}`, 
        `Authorization: ${adminName}`, 
        nextStatus === 'SUCCESS' ? 'shield' : 'alert-triangle'
      );
    } catch (error) {
      showToast('Failed to update transaction status.', 'error');
    }
  };

  // Filtered transactions calculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // 1. Status Filter
      const matchesStatus =
        txnStatusFilter === 'ALL' || txn.status === txnStatusFilter;

      // 2. Search query (matching email, phone, name, hash, or type)
      const q = txnSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (txn.hash && txn.hash.toLowerCase().includes(q)) ||
        (txn.type && txn.type.toLowerCase().includes(q)) ||
        (txn.userName && txn.userName.toLowerCase().includes(q)) ||
        (txn.userEmail && txn.userEmail.toLowerCase().includes(q)) ||
        (txn.userPhone && txn.userPhone.includes(q)) ||
        (txn.fromTo && txn.fromTo.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [transactions, txnSearchQuery, txnStatusFilter]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalTxnPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;

  // Log out administrative session
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  // Filtered and searched records
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // 1. Status Filter
      const matchesStatus =
        statusFilter === 'ALL' || trade.status === statusFilter;

      // 2. Search box
      const matchesSearch =
        trade.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.partyA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.partyB.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [trades, searchQuery, statusFilter]);

  // Filtered and searched KYC users
  const filteredKycUsers = useMemo(() => {
    return kycUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(kycSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(kycSearchQuery.toLowerCase()) ||
        user.phone.includes(kycSearchQuery);
      const matchesFilter = kycStatusFilter === 'ALL' || user.status === kycStatusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [kycUsers, kycSearchQuery, kycStatusFilter]);

  // Paginated records
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrades, currentPage]);

  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage) || 1;

  // Render Login view if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-wrap" style={{ padding: '0', background: 'transparent', border: 'none' }}>
              <img src={logo} alt="Logo" style={{ width: '48px', height: '48px' }} />
            </div>
            <h1 className="login-title">Peeritrade</h1>
            <span className="login-subtitle">Admin Access Portal</span>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-input-group">
              <label htmlFor="login-email">Username Email</label>
              <input
                type="email"
                id="login-email"
                className="login-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="login-password">Access Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  className="login-input"
                  style={{ width: '100%', paddingRight: '40px' }}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError ? (
              <div className="login-feedback error">
                <AlertTriangle size={14} />
                <span>{loginError}</span>
              </div>
            ) : null}

            {loginSuccess ? (
              <div className="login-feedback success">
                <CheckCircle size={14} />
                <span>{loginSuccess}</span>
              </div>
            ) : null}

            <div className="login-options" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                id="remember-me" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="remember-me" style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '500' }}>
                Remember my email
              </label>
            </div>

            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : 'Access Terminal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sticky Left Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon" style={{ padding: '0', background: 'transparent', border: 'none' }}>
            <img src={logo} alt="Logo" style={{ width: '32px', height: '32px' }} />
          </div>
          <div className="logo-text-container">
            <h1 className="logo-title">Peeritrade</h1>
            <span className="logo-subtitle">Admin Terminal</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li>
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsSidebarOpen(false);
              }}
              className={`menu-item-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard className="menu-icon" size={16} />
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setActiveTab('users');
                setCurrentPage(1);
                setIsSidebarOpen(false);
              }}
              className={`menu-item-btn ${activeTab === 'users' ? 'active' : ''}`}
            >
              <Users className="menu-icon" size={16} />
              <span>Users</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setActiveTab('markets');
                setIsSidebarOpen(false);
              }}
              className={`menu-item-btn ${activeTab === 'markets' ? 'active' : ''}`}
            >
              <TrendingUp className="menu-icon" size={16} />
              <span>Live Markets</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setActiveTab('portfolio');
                setIsSidebarOpen(false);
              }}
              className={`menu-item-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            >
              <Briefcase className="menu-icon" size={16} />
              <span>Portfolio</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setActiveTab('transactions');
                setIsSidebarOpen(false);
              }}
              className={`menu-item-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            >
              <ArrowLeftRight className="menu-icon" size={16} />
              <span>Transactions</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setActiveTab('security');
                setIsSidebarOpen(false);
              }}
              className={`menu-item-btn ${activeTab === 'security' ? 'active' : ''}`}
            >
              <ShieldCheck className="menu-icon" size={16} />
              <span>Security</span>
            </button>
          </li>
        </ul>

        {/* Sidebar Footer with Logout trigger */}
        <div className="sidebar-footer">
          <button 
            className="logout-item-btn" 
            onClick={handleLogout}
            id="btn-admin-logout"
          >
            <LogOut className="menu-icon" size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="main-wrapper">
        {/* Top Control Bar */}
        <header className="top-bar">
          <button 
            className="menu-toggle-btn" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="search-box-container">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search markets, trades, or users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              id="top-bar-search"
            />
          </div>

          <div className="top-bar-controls">
            <button 
              className="control-icon-btn" 
              title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
              onClick={toggleTheme}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              className={`control-icon-btn ${activeTab === 'notifications' ? 'active' : ''}`} 
              title="Notifications"
              onClick={() => {
                setActiveTab('notifications');
                setCurrentPage(1);
              }}
            >
              <Bell size={18} />
            </button>
            <button 
              className={`control-icon-btn ${activeTab === 'settings' ? 'active' : ''}`} 
              title="Portal Settings"
              onClick={() => {
                setActiveTab('settings');
                setCurrentPage(1);
              }}
            >
              <Settings size={18} />
            </button>
            <div 
              className={`user-badge ${activeTab === 'profile' ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setActiveTab('profile');
                setCurrentPage(1);
              }}
            >
              <span className="user-name">{adminName}</span>
            </div>
          </div>
        </header>

        {/* Dynamic screen views switching */}
        {activeTab === 'dashboard' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Market Overview</h2>
                <p className="overview-sub">Institutional performance metrics for the last 24 hours.</p>
              </div>
              <div className="header-action-row">
                <select
                  className="dropdown-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="Aug 12 - Aug 19">Aug 12 - Aug 19</option>
                  <option value="Aug 20 - Aug 27">Aug 20 - Aug 27</option>
                  <option value="All Time">All Time</option>
                </select>

                <button 
                  className="export-btn" 
                  onClick={handleExportReport}
                >
                  <Download size={14} />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Metrics cards grid */}
            <section className="metrics-grid">
              {/* Metric 1 */}
              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <Users size={16} color="#00D285" />
                  </div>
                  <span className="metric-change-badge positive">+8%</span>
                </div>
                <span className="metric-label">Total Users</span>
                <span className="metric-value">{metrics.users}</span>
              </div>

              {/* Metric 2 */}
              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <Activity size={16} color="#3B82F6" />
                  </div>
                  <span className="metric-change-badge positive">+15.2%</span>
                </div>
                <span className="metric-label">Active Trades</span>
                <span className="metric-value">{metrics.activeTrades}</span>
              </div>

              {/* Metric 3 */}
              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <BarChart3 size={16} color="#F59E0B" />
                  </div>
                  <span className="metric-change-badge negative">-0.4%</span>
                </div>
                <span className="metric-label">Total Vol (₦)</span>
                <span className="metric-value">{metrics.volume}</span>
              </div>

              {/* Metric 4 */}
              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <Landmark size={16} color="#00D285" />
                  </div>
                  <span className="metric-change-badge positive">+12%</span>
                </div>
                <span className="metric-label">Platform Revenue</span>
                <span className="metric-value">{metrics.revenue}</span>
              </div>
            </section>

            {/* Charts & oversight grid */}
            <section className="charts-grid">
              {/* Trade Frequency Bar Chart */}
              <div className="chart-card">
                <div className="card-title-row">
                  <div>
                    <h3 className="card-heading">Trade Frequency</h3>
                    <p className="card-subheading">Cumulative transactional activity per hour</p>
                  </div>
                  <div className="chart-period-selectors">
                    <button className="period-btn">1H</button>
                    <button className="period-btn active">4H</button>
                    <button className="period-btn">1W</button>
                  </div>
                </div>

                <div className="bar-chart-container">
                  {tradeFrequencyData.map((data, index) => (
                    <div
                      key={index}
                      className={`bar-wrapper ${data.highlighted ? 'highlighted' : ''}`}
                    >
                      <div className="bar-tooltip">{data.count} Trades</div>
                      <div
                        className="bar-column"
                        style={{ height: `${(data.count / 60) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="chart-x-labels">
                  <span className="x-label-text">08:00 AM</span>
                  <span className="x-label-text">12:00 PM</span>
                  <span className="x-label-text">04:00 PM</span>
                  <span className="x-label-text">08:00 PM</span>
                  <span className="x-label-text">02:00 AM</span>
                </div>
              </div>

              {/* Financial Oversight Panel */}
              <div className="chart-card">
                <div className="card-title-row" style={{ marginBottom: 16 }}>
                  <div>
                    <h3 className="card-heading">Financial Oversight</h3>
                  </div>
                </div>

                <div className="oversight-row">
                  {/* Escrow balance */}
                  <div className="oversight-item-card">
                    <div className="oversight-info-left">
                      <div className="oversight-icon-wrap">
                        <Lock size={16} />
                      </div>
                      <div className="oversight-details">
                        <span className="oversight-label">In Escrow</span>
                        <span className="oversight-value">{metrics.inEscrow}</span>
                      </div>
                    </div>
                    <span className="oversight-badge risk-low">Low Risks</span>
                  </div>

                  {/* Cold wallet balance */}
                  <div className="oversight-item-card">
                    <div className="oversight-info-left">
                      <div className="oversight-icon-wrap">
                        <Wallet size={16} />
                      </div>
                      <div className="oversight-details">
                        <span className="oversight-label">Cold Wallet Balance</span>
                        <span className="oversight-value">{metrics.coldWalletBalance}</span>
                      </div>
                    </div>
                    <span className="oversight-badge change-pos">+3.4%</span>
                  </div>

                  {/* Progress segment */}
                  <div>
                    <div className="liquidity-progress-header">
                      <span>LIQUIDITY DISTRIBUTION</span>
                    </div>
                    <div className="liquidity-progress-bar-container">
                      <div className="progress-section-bank" style={{ width: '65%' }} />
                      <div className="progress-section-cards" style={{ width: '35%' }} />
                    </div>
                    <div className="liquidity-labels-row">
                      <div className="liquidity-dot-label">
                        <span className="liquidity-dot bank" />
                        <span>Bank (65%)</span>
                      </div>
                      <div className="liquidity-dot-label">
                        <span className="liquidity-dot cards" />
                        <span>Cards (35%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Market Trades Table Card */}
            <section className="recent-trades-card">
              <div className="table-filter-row">
                <div>
                  <h3 className="card-heading">Recent Market Trades</h3>
                  <p className="card-subheading">Real-time settlement activity across all regions</p>
                </div>
                <div className="filter-controls-right">
                  <select
                    className="dropdown-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    id="table-status-select"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SETTLED">Settled</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                  <button
                    className="filter-btn"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    title="Reset Filter"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th>Trade ID</th>
                      <th>Parties</th>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map((trade) => (
                      <tr key={trade.id}>
                        <td className="trade-id-col">{trade.id}</td>
                        <td>
                          <div className="parties-cell">
                            <div className="avatars-overlap-container">
                              <img
                                src={trade.avatarA}
                                alt={trade.partyA}
                                className="overlap-avatar first"
                              />
                              <img
                                src={trade.avatarB}
                                alt={trade.partyB}
                                className="overlap-avatar second"
                              />
                            </div>
                            <span className="parties-names">
                              {trade.partyA} & {trade.partyB}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="asset-cell">
                            <span className="asset-flag">🇳🇬</span>
                            <span>{trade.asset}</span>
                          </div>
                        </td>
                        <td className="amount-cell">
                          ₦{trade.amount.toLocaleString()}
                        </td>
                        <td>{trade.time}</td>
                        <td>
                          <span
                            className={`status-badge-td ${
                              trade.status === 'SETTLED' ? 'settled' : 'blocked'
                            }`}
                          >
                            {trade.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', position: 'relative' }}>
                          <button
                            className="action-row-btn"
                            onClick={() =>
                              setActiveMenuId(
                                activeMenuId === trade.id ? null : trade.id
                              )
                            }
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Action Menu drop */}
                          {activeMenuId === trade.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: 32,
                                backgroundColor: '#131c30',
                                border: '1px solid #1e293b',
                                borderRadius: 6,
                                zIndex: 50,
                                width: 140,
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                              }}
                            >
                              <button
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: '8px 12px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#00D285',
                                  fontSize: 11,
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                                onClick={() =>
                                  handleUpdateStatus(trade.id, 'SETTLED')
                                }
                              >
                                <CheckCircle size={12} color="#00D285" />
                                <span>Settle Trade</span>
                              </button>
                              <button
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: '8px 12px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#F59E0B',
                                  fontSize: 11,
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  borderTop: '1px solid #1e293b'
                                }}
                                onClick={() =>
                                  handleUpdateStatus(trade.id, 'BLOCKED')
                                }
                              >
                                <AlertTriangle size={12} color="#F59E0B" />
                                <span>Block Trade</span>
                              </button>
                              <button
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: '8px 12px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#EF4444',
                                  fontSize: 11,
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  borderTop: '1px solid #1e293b'
                                }}
                                onClick={() => handleDeleteTrade(trade.id)}
                              >
                                <Trash2 size={12} color="#EF4444" />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {paginatedTrades.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                          No matching transactional trades found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table pagination controller */}
              <div className="table-pagination-row">
                <span className="pagination-info">
                  Showing {filteredTrades.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredTrades.length)} of{' '}
                  {filteredTrades.length} trades
                </span>
                <div className="pagination-controls">
                  <button
                    className="pag-btn"
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    className="pag-btn"
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </section>
          </main>
        ) : activeTab === 'transactions' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Transaction Registry</h2>
                <p className="overview-sub">Institutional ledger audits and escrow clearing settlements.</p>
              </div>
              <div className="header-action-row">
                <button 
                  className="export-btn" 
                  onClick={() => alert('Exporting full transaction registry CSV...')}
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Transactions table card */}
            <section className="recent-trades-card">
              <div className="table-filter-row">
                <div>
                  <h3 className="card-heading">All Transactions</h3>
                  <p className="card-subheading">Comprehensive history of ledger logs</p>
                </div>
                <div className="filter-controls-right">
                  <div className="search-box-container" style={{ margin: 0, width: 240, height: 38 }}>
                    <Search className="search-icon" size={14} style={{ left: 10 }} />
                    <input
                      type="text"
                      className="search-input"
                      style={{ fontSize: 12, paddingLeft: 34 }}
                      placeholder="Search name, email, phone..."
                      value={txnSearchQuery}
                      onChange={(e) => {
                        setTxnSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      id="txn-search-input"
                    />
                  </div>
                  <select
                    className="dropdown-select"
                    value={txnStatusFilter}
                    onChange={(e) => {
                      setTxnStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    id="txn-status-select"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUCCESS">Success</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                  <button
                    className="filter-btn"
                    onClick={() => {
                      setTxnStatusFilter('ALL');
                      setTxnSearchQuery('');
                      setCurrentPage(1);
                    }}
                    title="Reset Filter"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th>Txn Hash</th>
                      <th>Type</th>
                      <th>User Details</th>
                      <th>Amount</th>
                      <th>Date/Time</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => (
                      <tr key={txn.hash}>
                        <td className="trade-id-col" style={{ fontSize: 11 }}>{txn.hash}</td>
                        <td>
                          <span style={{ 
                            fontWeight: '700', 
                            fontSize: 10,
                            color: txn.type === 'ESCROW_LOCK' ? '#3B82F6' : 
                                   txn.type === 'SETTLEMENT_PAYOUT' ? '#00D285' :
                                   txn.type === 'DEPOSIT' ? '#10B981' : '#EF4444',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            padding: '3px 8px',
                            borderRadius: 4
                          }}>
                            {txn.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: '600', color: '#ffffff', fontSize: 13 }}>{txn.fromTo}</span>
                            {txn.userName && (
                              <span style={{ fontSize: 10, color: '#64748b' }}>
                                {txn.userName} &bull; {txn.userEmail} &bull; {txn.userPhone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="amount-cell" style={{ color: '#00D285' }}>
                          ₦{txn.amount.toLocaleString()}
                        </td>
                        <td>{txn.time}</td>
                        <td>
                          <span
                            className="status-badge-td"
                            style={{
                              backgroundColor: txn.status === 'SUCCESS' ? 'rgba(0, 210, 133, 0.08)' :
                                               txn.status === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                              border: txn.status === 'SUCCESS' ? '1px solid rgba(0, 210, 133, 0.2)' :
                                      txn.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                              color: txn.status === 'SUCCESS' ? '#00D285' :
                                     txn.status === 'PENDING' ? '#F59E0B' : '#EF4444'
                            }}
                          >
                            {txn.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', position: 'relative' }}>
                          {txn.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                style={{
                                  backgroundColor: 'rgba(0, 210, 133, 0.1)',
                                  border: '1px solid rgba(0, 210, 133, 0.3)',
                                  color: '#00D285',
                                  fontSize: 10,
                                  fontWeight: 'bold',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleUpdateTxnStatus(txn.hash, 'SUCCESS')}
                              >
                                Approve
                              </button>
                              <button
                                style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#EF4444',
                                  fontSize: 10,
                                  fontWeight: 'bold',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleUpdateTxnStatus(txn.hash, 'FAILED')}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>Complete</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {paginatedTransactions.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                          No matching ledger transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Transactions Table pagination */}
              <div className="table-pagination-row">
                <span className="pagination-info">
                  Showing {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
                  {filteredTransactions.length} transactions
                </span>
                <div className="pagination-controls">
                  <button
                    className="pag-btn"
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    className="pag-btn"
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalTxnPages))}
                    disabled={currentPage === totalTxnPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </section>
          </main>
        ) : activeTab === 'security' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Security & Risk Panel</h2>
                <p className="overview-sub">Configure encryption policies, credentials, and review node audits.</p>
              </div>
            </div>

            {/* Security layout columns */}
            <div className="security-grid">
              {/* Left Column: Security Settings Cards */}
              <div className="security-settings-card">
                {/* Section: Administrative credential forms */}
                <div className="security-settings-section">
                  <h3 className="security-section-title">Change Account Password</h3>
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group-wrap">
                      <input
                        type="password"
                        placeholder="Current Admin Password"
                        className="form-input-text"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-row-split">
                      <input
                        type="password"
                        placeholder="New Password"
                        className="form-input-text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        className="form-input-text"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                      Update Password
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Live Audit Logs */}
              <div className="chart-card">
                <div className="card-title-row" style={{ marginBottom: 16 }}>
                  <div>
                    <h3 className="card-heading">Live Security Audit Logs</h3>
                    <p className="card-subheading">Real-time network events logging</p>
                  </div>
                </div>

                <div className="audit-logs-list">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="audit-log-item">
                      <div
                        className={`audit-log-icon-box ${
                          log.type === 'success'
                            ? 'success'
                            : log.type === 'warning'
                            ? 'warning'
                            : 'system'
                        }`}
                      >
                        {log.icon === 'login' ? (
                          <UserCheck size={16} />
                        ) : log.icon === 'cpu' ? (
                          <Cpu size={16} />
                        ) : log.icon === 'shield' ? (
                          <Shield size={16} />
                        ) : (
                          <AlertTriangle size={16} />
                        )}
                      </div>
                      <div className="audit-log-details">
                        <span className="audit-log-text">{log.text}</span>
                        <span className="audit-log-meta">{log.meta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        ) : activeTab === 'notifications' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Notification Center</h2>
                <p className="overview-sub">Operational status logs, threat flags, and network alerts.</p>
              </div>
              <div className="header-action-row">
                <button 
                  className="export-btn"
                  onClick={handleMarkAllRead}
                  disabled={notifications.every(n => n.read)}
                >
                  <span>Mark all as read</span>
                </button>
              </div>
            </div>

            <section className="recent-trades-card">
              <div className="table-filter-row" style={{ borderBottom: '1px solid #1e293b', paddingBottom: 16 }}>
                <div>
                  <h3 className="card-heading">Platform Notifications</h3>
                  <p className="card-subheading">Showing recent system-wide messages</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      backgroundColor: notif.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 210, 133, 0.04)',
                      border: notif.read ? '1px solid #1e293b' : '1px solid rgba(0, 210, 133, 0.2)',
                      padding: 16,
                      borderRadius: 8,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div 
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: notif.category === 'SECURITY' ? '#EF4444' :
                                           notif.category === 'OPERATIONS' ? '#F59E0B' : '#00D285',
                          marginTop: 6
                        }} 
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>
                            {notif.title}
                          </h4>
                          <span 
                            style={{
                              fontSize: 9,
                              fontWeight: 'bold',
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: '#64748b'
                            }}
                          >
                            {notif.category}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                          {notif.desc}
                        </p>
                        <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, color: '#64748b' }}>
                          {notif.time}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: '4px 8px'
                      }}
                      onClick={() => handleDismissNotification(notif.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                    <Bell size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>Your administrative notification center is clear.</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        ) : activeTab === 'settings' ? (
          <main className="dashboard-container">
            <div className="section-header">
              <div>
                <h2 className="overview-title">Portal Settings</h2>
                <p className="overview-sub">Configure platform fee structure, settlement algorithms, and threshold safeguards.</p>
              </div>
            </div>

            <div className="settings-grid">
              {/* Financial Configurations */}
              <div className="settings-card">
                <div className="settings-card-title">Financial Configurations</div>
                <p className="settings-card-sub">Manage commission rates and transaction thresholds.</p>
                <form onSubmit={handleSaveSettings}>
                  <div className="settings-field">
                    <label className="settings-label">Platform Commission Fee (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="vault-input"
                      value={editFee}
                      onChange={(e) => setEditFee(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      This percentage is deducted from every successful escrow settlement.
                    </span>
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">Multi-Sig Verification Threshold (₦)</label>
                    <input
                      type="number"
                      className="vault-input"
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Transactions above this amount require second-tier administrative approval.
                    </span>
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
                    Update Financials
                  </button>
                </form>
              </div>

              {/* Operational Protocols */}
              <div className="settings-card">
                <div className="settings-card-title">Operational Protocols</div>
                <p className="settings-card-sub">Define how the platform handles automated settlements.</p>
                <div className="settings-field">
                  <label className="settings-label">Settlement Release Protocol</label>
                  <select
                    className="vault-select"
                    value={editMode}
                    onChange={(e) => setEditMode(e.target.value)}
                  >
                    <option value="AUTOMATED">Automated Instant Payouts</option>
                    <option value="DELAYED">Delayed Escrow Batching (24h Lock)</option>
                    <option value="MANUAL">Manual Admin Approval Required</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label className="settings-label">Maintenance Mode</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <button 
                      className={`notif-action-btn ${metrics.maintenance ? 'active' : ''}`}
                      onClick={() => showToast('Maintenance mode toggled...', 'warning')}
                      style={{ padding: '8px 16px', backgroundColor: metrics.maintenance ? 'var(--color-red)' : 'transparent' }}
                    >
                      {metrics.maintenance ? 'Disable Maintenance' : 'Enable Maintenance'}
                    </button>
                  </div>
                </div>
                <div className="settings-field">
                   <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                     System protocols are enforced globally across all active market pairs and user wallets.
                   </p>
                </div>
              </div>
            </div>
          </main>
        ) : activeTab === 'profile' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Admin Profile</h2>
                <p className="overview-sub">Manage your primary administrative profile details and node identity.</p>
              </div>
            </div>

            <div className="security-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="security-settings-card" style={{ maxWidth: 650, margin: '0 auto', width: '100%' }}>
                <div className="security-settings-section">
                  <h3 className="security-section-title">Modify Profile Details</h3>
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Avatar picker circle selection list */}
                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 12, display: 'block' }}>
                        Profile Avatar Icon
                      </label>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <img 
                          src={editAvatar} 
                          alt="Current avatar preview"
                          style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid #00D285', padding: 2 }}
                        />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {avatarList.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: editAvatar === url ? '2px solid #00D285' : '1px solid #1e293b',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              onClick={() => setEditAvatar(url)}
                            >
                              <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar option" />
                            </button>
                          ))}
                          <button
                            type="button"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              backgroundColor: '#1e293b',
                              border: editAvatar.includes('ui-avatars') ? '2px solid #00D285' : '1px solid #1e293b',
                              cursor: 'pointer',
                              color: '#00D285',
                              fontSize: 10,
                              fontWeight: 'bold'
                            }}
                            onClick={() => setEditAvatar(`https://ui-avatars.com/api/?name=${editName}&background=00D285&color=000&bold=true`)}
                          >
                            Initials
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 6, display: 'block' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Administrator Name"
                        className="form-input-text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 6, display: 'block' }}>
                        Email Address Username
                      </label>
                      <input
                        type="email"
                        placeholder="Administrative Email"
                        className="form-input-text"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 6, display: 'block' }}>
                        Admin Phone Route
                      </label>
                      <input
                        type="text"
                        placeholder="Phone Number"
                        className="form-input-text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 6, display: 'block' }}>
                        Admin Platform Role
                      </label>
                      <input
                        type="text"
                        className="form-input-text"
                        value="Super Administrator / Lead Escrow Node"
                        disabled
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                      Save Profile Changes
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </main>
        ) : activeTab === 'markets' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Football Club Markets</h2>
                <p className="overview-sub">Configure real-time share indices, pricing status, and trade volumes.</p>
              </div>
              <div className="header-action-row">
                <button 
                  className="btn-primary"
                  onClick={() => setIsMarketModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} />
                  <span>Add Football Club</span>
                </button>
              </div>
            </div>

            {/* Markets table registry card */}
            <section className="recent-trades-card">
              <div className="table-filter-row">
                <div>
                  <h3 className="card-heading">Active Football Club Indices</h3>
                  <p className="card-subheading">Club valuation metrics synchronized with index rates</p>
                </div>
              </div>

              {/* Markets Table */}
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th>Football Club</th>
                      <th>Share Price</th>
                      <th>24h Change</th>
                      <th>24h Volume</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets.map((mkt) => (
                      <tr key={mkt.id}>
                        <td style={{ fontWeight: 'bold', color: '#ffffff' }}>{mkt.pair}</td>
                        <td style={{ color: '#00D285', fontWeight: '600' }}>
                          ₦{mkt.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ 
                          color: mkt.change.startsWith('+') ? '#00D285' : '#EF4444',
                          fontWeight: '600'
                        }}>
                          {mkt.change}
                        </td>
                        <td style={{ color: '#94a3b8' }}>{mkt.volume}</td>
                        <td>
                          <span
                            className="status-badge-td"
                            style={{
                              backgroundColor: mkt.status === 'ACTIVE' ? 'rgba(0, 210, 133, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                              border: mkt.status === 'ACTIVE' ? '1px solid rgba(0, 210, 133, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                              color: mkt.status === 'ACTIVE' ? '#00D285' : '#F59E0B'
                            }}
                          >
                            {mkt.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #1e293b',
                              color: '#64748b',
                              fontSize: 10,
                              fontWeight: 'bold',
                              padding: '4px 10px',
                              borderRadius: 4,
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setMarkets(markets.map(m => m.id === mkt.id ? { ...m, status: m.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' } : m));
                              logSecurityEvent('warning', `Market status modified for ${mkt.pair} to ${mkt.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE'}`, 'Operator: HASHIM . Just now', 'cpu');
                            }}
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        ) : activeTab === 'portfolio' ? (
          <main className="dashboard-container">
            <div className="section-header">
              <div>
                <h2 className="overview-title">Vaults &amp; Reserves</h2>
                <p className="overview-sub">Institutional reserve partitions, multi-sig cold vaults, and escrow pool clearing balances.</p>
              </div>
              <div className="header-action-row">
                <button className="export-btn" onClick={handleExportReport}>
                  <Download size={14} />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Vault Summary Cards */}
            <div className="vault-cards-grid">
              <div className="vault-card">
                <div className="vault-card-top">
                  <div className="vault-icon-box" style={{ background: 'rgba(0,210,133,0.1)', color: '#00D285' }}>
                    <Landmark size={20} />
                  </div>
                  <span className="vault-badge green">Active</span>
                </div>
                <span className="vault-label">Main Custody Pool</span>
                <span className="vault-amount" style={{ color: '#00D285' }}>₦{vaultBalances.custodyPool.toLocaleString()}</span>
                <span className="vault-sublabel">Institutional Reserve Wallet</span>
              </div>

              <div className="vault-card">
                <div className="vault-card-top">
                  <div className="vault-icon-box" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                    <Lock size={20} />
                  </div>
                  <span className="vault-badge blue">{metrics.activeTrades} Trades</span>
                </div>
                <span className="vault-label">Active Escrow Locked</span>
                <span className="vault-amount" style={{ color: '#3B82F6' }}>₦{vaultBalances.escrowLocked.toLocaleString()}</span>
                <span className="vault-sublabel">Currently Locked in Trades</span>
              </div>

              <div className="vault-card">
                <div className="vault-card-top">
                  <div className="vault-icon-box" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <span className="vault-badge orange">Multi-Sig</span>
                </div>
                <span className="vault-label">Cold Vault Reserves</span>
                <span className="vault-amount" style={{ color: '#F59E0B' }}>₦{vaultBalances.coldReserve.toLocaleString()}</span>
                <span className="vault-sublabel">Multi-Sig Hard Locked</span>
              </div>

              <div className="vault-card">
                <div className="vault-card-top">
                  <div className="vault-icon-box" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                    <ArrowLeftRight size={20} />
                  </div>
                  <span className="vault-badge purple">Live</span>
                </div>
                <span className="vault-label">Payout Bank Float</span>
                <span className="vault-amount" style={{ color: 'var(--text-white)' }}>₦{vaultBalances.payoutBank.toLocaleString()}</span>
                <span className="vault-sublabel">Automated Releases Float</span>
              </div>
            </div>

            {/* Internal Transfer Panel */}
            <section className="vault-transfer-card">
              <div className="table-filter-row">
                <div>
                  <h3 className="card-heading">Internal Vault Transfer</h3>
                  <p className="card-subheading">Move reserve funds between vault partitions securely</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,210,133,0.08)', border: '1px solid rgba(0,210,133,0.2)', padding: '6px 14px', borderRadius: 6 }}>
                  <ShieldCheck size={14} color="#00D285" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#00D285' }}>Authorized</span>
                </div>
              </div>
              <div className="vault-transfer-form">
                <div className="vault-field-group">
                  <label className="vault-field-label">Source Vault</label>
                  <select className="vault-select" value={transferSource} onChange={(e) => setTransferSource(e.target.value)}>
                    <option value="custodyPool">Main Custody Pool</option>
                    <option value="escrowLocked">Active Escrow</option>
                    <option value="coldReserve">Cold Vault</option>
                    <option value="payoutBank">Payout Float</option>
                  </select>
                </div>
                <div className="vault-arrow-divider">
                  <ArrowLeftRight size={18} color="var(--color-primary)" />
                </div>
                <div className="vault-field-group">
                  <label className="vault-field-label">Destination Vault</label>
                  <select className="vault-select" value={transferDest} onChange={(e) => setTransferDest(e.target.value)}>
                    <option value="custodyPool">Main Custody Pool</option>
                    <option value="escrowLocked">Active Escrow</option>
                    <option value="coldReserve">Cold Vault</option>
                    <option value="payoutBank">Payout Float</option>
                  </select>
                </div>
                <div className="vault-field-group">
                  <label className="vault-field-label">Amount (₦)</label>
                  <input
                    type="number"
                    className="vault-input"
                    placeholder="Enter amount..."
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>
                <button className="btn-primary" style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleVaultTransfer}>
                  <ArrowLeftRight size={14} />
                  Transfer
                </button>
              </div>
            </section>

            {/* User Balances Ledger */}
            <section className="recent-trades-card">
              <div className="table-filter-row">
                <div>
                  <h3 className="card-heading">User Balances &amp; Escrow Ledger</h3>
                  <p className="card-subheading">Live naira deposits, escrow locks, and risk status per user</p>
                </div>
              </div>
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th>User Account</th>
                      <th>Naira Balance</th>
                      <th>Escrow Stock</th>
                      <th>Risk Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBalances.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-white)' }}>{user.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email} • {user.phone}</span>
                          </div>
                        </td>
                        <td style={{ color: '#00D285', fontWeight: '600' }}>₦{user.balance.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-white)', fontWeight: 'bold' }}>{user.stock} Units</td>
                        <td>
                          <span className="status-badge-td" style={{
                            backgroundColor: user.status === 'Healthy' ? 'rgba(0,210,133,0.08)' : user.status === 'Low Balance' ? 'rgba(245,158,11,0.08)' : user.status === 'Low Stock' ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)',
                            border: user.status === 'Healthy' ? '1px solid rgba(0,210,133,0.2)' : user.status === 'Low Balance' ? '1px solid rgba(245,158,11,0.2)' : user.status === 'Low Stock' ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(239,68,68,0.2)',
                            color: user.status === 'Healthy' ? '#00D285' : user.status === 'Low Balance' ? '#F59E0B' : user.status === 'Low Stock' ? '#3B82F6' : '#EF4444'
                          }}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="notif-action-btn" onClick={async () => {
                            const extraVal = 50000;
                            try {
                              await api.post('/admin/users/credit', { userId: user.id, amount: extraVal });
                              fetchUsers();
                              showToast(`₦${extraVal.toLocaleString()} credited to ${user.name} successfully!`, 'success');
                              logSecurityEvent('success', `Manual balance credit: ₦${extraVal.toLocaleString()} added to ${user.name}`, `Authorized by ${adminName}`, 'wallet');
                            } catch (error) {
                              showToast('System failed to credit user account.', 'error');
                            }
                          }}>
                            Credit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        ) : activeTab === 'users' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">User Registration & Verification</h2>
                <p className="overview-sub">Verify user identity registrations, review uploaded identification documents, and approve or reject access.</p>
              </div>
            </div>

            {/* Filter controls card */}
            <div className="table-filter-card" style={{ marginBottom: 24, padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                
                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '6px 12px', minWidth: 320 }}>
                  <Search size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-white)', outline: 'none', fontSize: 13, width: '100%' }}
                    value={kycSearchQuery}
                    onChange={(e) => setKycSearchQuery(e.target.value)}
                  />
                  {kycSearchQuery && (
                    <button onClick={() => setKycSearchQuery('')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 'bold' }}>Verification Status:</span>
                  <select
                    className="dropdown-select"
                    style={{ height: 36, padding: '0 12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-white)', borderRadius: 6 }}
                    value={kycStatusFilter}
                    onChange={(e) => setKycStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Requests</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Verification Requests Registry Card */}
            <section className="recent-trades-card">
              <div className="table-filter-row">
                <div>
                  <h3 className="card-heading">Verification Ledger</h3>
                  <p className="card-subheading">Review identity status matching real-world verification nodes</p>
                </div>
              </div>

              {/* KYC Users Table */}
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th>User Info</th>
                      <th>Identification Document</th>
                      <th>Document Number</th>
                      <th>Submission Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKycUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>
                          No registration verification records found.
                        </td>
                      </tr>
                    ) : (
                      filteredKycUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 'bold', color: 'var(--text-white)' }}>{user.name}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email} • {user.phone}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{user.documentType}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-white)', fontWeight: '500' }}>
                            {user.documentNumber}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{user.date}</td>
                          <td>
                            <span
                              className="status-badge-td"
                              style={{
                                backgroundColor: user.status === 'APPROVED' ? 'rgba(0, 210, 133, 0.08)' : 
                                                 user.status === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                border: user.status === 'APPROVED' ? '1px solid rgba(0, 210, 133, 0.2)' : 
                                        user.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                color: user.status === 'APPROVED' ? '#00D285' : 
                                       user.status === 'PENDING' ? '#F59E0B' : '#EF4444'
                              }}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                style={{
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  color: '#3B82F6',
                                  fontSize: 10,
                                  fontWeight: 'bold',
                                  padding: '6px 12px',
                                  borderRadius: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => setSelectedKycUser(user)}
                              >
                                View Card
                              </button>
                              {user.status === 'PENDING' && (
                                <>
                                  <button
                                    style={{
                                      backgroundColor: 'rgba(0, 210, 133, 0.1)',
                                      border: '1px solid rgba(0, 210, 133, 0.3)',
                                      color: '#00D285',
                                      fontSize: 10,
                                      fontWeight: 'bold',
                                      padding: '6px 12px',
                                      borderRadius: 4,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleUpdateKycStatus(user.id, 'APPROVED')}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    style={{
                                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      color: '#EF4444',
                                      fontSize: 10,
                                      fontWeight: 'bold',
                                      padding: '6px 12px',
                                      borderRadius: 4,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleUpdateKycStatus(user.id, 'REJECTED')}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {user.status !== 'PENDING' && (
                                <button
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #1e293b',
                                    color: '#64748b',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleUpdateKycStatus(user.id, 'PENDING')}
                                >
                                  Reset Status
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        ) : activeTab === 'notifications' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">System Alert Center</h2>
                <p className="overview-sub">Monitor security triggers, market signals, and network events.</p>
              </div>
              <button className="export-btn" onClick={handleMarkAllRead}>
                <CheckCircle size={14} />
                <span>Mark Protocol Read</span>
              </button>
            </div>

            <div className="notifications-list-card">
              {notifications.length === 0 ? (
                <div className="empty-notifications">
                  <Bell size={48} strokeWidth={1} />
                  <h3>No Active Alerts</h3>
                  <p>System is currently operating within normal parameters.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                    <div className="notification-main">
                      <div className={`notification-icon-box ${notif.type}`}>
                        {notif.type === 'market' ? <Activity size={20} /> :
                         notif.type === 'security' ? <Shield size={20} /> :
                         notif.type === 'system' ? <Cpu size={20} /> :
                         <BarChart3 size={20} />}
                      </div>
                      <div className="notification-content">
                        <span className="notification-text">{notif.text}</span>
                        <div className="notification-meta">
                          <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{notif.type}</span>
                          <span>•</span>
                          <span>{notif.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="notification-actions">
                      {!notif.read && (
                        <button 
                          className="notif-action-btn" 
                          title="Mark as read"
                          onClick={() => setNotifications(notifications.map(n => n.id === notif.id ? {...n, read: true} : n))}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        className="notif-action-btn" 
                        title="Dismiss"
                        onClick={() => handleDismissNotification(notif.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        ) : (
          <main className="dashboard-container">
            {/* Screen Tab Placeholder */}
            <div className="placeholder-view">
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h2>
              <p>
                Administrative access options for Peeritrade escrow systems, clearing registries, risk managers, and network nodes. Live details are simulated automatically in your primary database layout.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: 24 }}
                onClick={() => setActiveTab('dashboard')}
              >
                Return to Dashboard
              </button>
            </div>
          </main>
        )}
      </div>

      {/* New Escrow Trade Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-title-row">
              <h2>Initiate Simulated Trade</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTrade}>
              <div className="modal-form-fields">
                <div className="form-group-wrap">
                  <label htmlFor="party-a">Initiator (Party A)</label>
                  <input
                    type="text"
                    id="party-a"
                    className="form-input-text"
                    placeholder="Ex: Grace A."
                    value={newPartyA}
                    onChange={(e) => setNewPartyA(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-wrap">
                  <label htmlFor="party-b">Responder (Party B)</label>
                  <input
                    type="text"
                    id="party-b"
                    className="form-input-text"
                    placeholder="Ex: Fatima Z."
                    value={newPartyB}
                    onChange={(e) => setNewPartyB(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-split">
                  <div className="form-group-wrap">
                    <label htmlFor="trade-amount">Amount (₦)</label>
                    <input
                      type="number"
                      id="trade-amount"
                      className="form-input-text"
                      placeholder="Ex: 25000"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group-wrap">
                    <label htmlFor="trade-status">Status</label>
                    <select
                      id="trade-status"
                      className="dropdown-select"
                      style={{ height: 42 }}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="SETTLED">Settled</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-action-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Lock Escrow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Football Club Modal */}
      {isMarketModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-title-row">
              <h2>Add Football Club Listing</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsMarketModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMarket}>
              <div className="modal-form-fields">
                <div className="form-group-wrap">
                  <label htmlFor="market-pair">Football Club Name (e.g. Chelsea FC)</label>
                  <input
                    type="text"
                    id="market-pair"
                    className="form-input-text"
                    placeholder="Ex: Chelsea FC"
                    value={newMarketPair}
                    onChange={(e) => setNewMarketPair(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-split">
                  <div className="form-group-wrap">
                    <label htmlFor="market-rate">Index Share Price (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="market-rate"
                      className="form-input-text"
                      placeholder="Ex: 850"
                      value={newMarketRate}
                      onChange={(e) => setNewMarketRate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group-wrap">
                    <label htmlFor="market-vol">24h Trading Volume (₦)</label>
                    <input
                      type="number"
                      id="market-vol"
                      className="form-input-text"
                      placeholder="Ex: 5000000"
                      value={newMarketVol}
                      onChange={(e) => setNewMarketVol(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-wrap">
                  <label htmlFor="market-status">Status</label>
                  <select
                    id="market-status"
                    className="dropdown-select"
                    style={{ height: 42, width: '100%' }}
                    value={newMarketStatus}
                    onChange={(e) => setNewMarketStatus(e.target.value)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="modal-action-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsMarketModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected KYC User Detail Card Modal */}
      {selectedKycUser && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 480 }}>
            <div className="modal-title-row">
              <h2>User Verification Card</h2>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedKycUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0 24px', textAlign: 'center' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 'bold',
                marginBottom: 12,
                border: '3px solid #1e293b'
              }}>
                {selectedKycUser.name.charAt(0)}
              </div>
              <h3 style={{ fontSize: 18, color: '#ffffff', fontWeight: 'bold', margin: '0 0 4px 0' }}>{selectedKycUser.name}</h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px 0' }}>{selectedKycUser.email}</p>
              
              <span
                className="status-badge-td"
                style={{
                  backgroundColor: selectedKycUser.status === 'APPROVED' ? 'rgba(0, 210, 133, 0.08)' : 
                                   selectedKycUser.status === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: selectedKycUser.status === 'APPROVED' ? '1px solid rgba(0, 210, 133, 0.2)' : 
                          selectedKycUser.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                  color: selectedKycUser.status === 'APPROVED' ? '#00D285' : 
                         selectedKycUser.status === 'PENDING' ? '#F59E0B' : '#EF4444',
                  fontSize: 12,
                  padding: '4px 12px'
                }}
              >
                {selectedKycUser.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, backgroundColor: '#0d1527', padding: 16, borderRadius: 6, border: '1px solid #1e293b', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Phone Number:</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>{selectedKycUser.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Document Type:</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>{selectedKycUser.documentType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Document ID Number:</span>
                <span style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: '500' }}>{selectedKycUser.documentNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Submission Date:</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>{selectedKycUser.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Favorite Football Club:</span>
                <span style={{ color: '#00D285', fontWeight: 'bold' }}>
                  {selectedKycUser.id === 1 ? 'Chelsea FC' : selectedKycUser.id === 2 ? 'Arsenal FC' : selectedKycUser.id === 3 ? 'Manchester United' : 'Real Madrid'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedKycUser(null)}
              >
                Close Card
              </button>
              {selectedKycUser.status === 'PENDING' && (
                <>
                  <button
                    className="btn-primary"
                    style={{ backgroundColor: '#EF4444' }}
                    onClick={() => {
                      handleUpdateKycStatus(selectedKycUser.id, 'REJECTED');
                      setSelectedKycUser(null);
                    }}
                  >
                    Reject User
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      handleUpdateKycStatus(selectedKycUser.id, 'APPROVED');
                      setSelectedKycUser(null);
                    }}
                  >
                    Approve User
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notifications */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast-item ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={18} color="#00D285" /> : 
             toast.type === 'error' ? <AlertTriangle size={18} color="#EF4444" /> : 
             <Bell size={18} color="#F59E0B" />}
            <span className="toast-text">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
