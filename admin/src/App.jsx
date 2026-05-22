import React, { useState, useMemo } from 'react';
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
  ToggleLeft
} from 'lucide-react';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailInput, setEmailInput] = useState('uuhashim0918@gmail.com');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter status dropdown state
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Date filter state
  const [dateRange, setDateRange] = useState('Aug 12 - Aug 19');

  // Admin profile state details
  const [adminName, setAdminName] = useState('HASHIM');
  const [adminEmail, setAdminEmail] = useState('uuhashim0918@gmail.com');
  const [adminPhone, setAdminPhone] = useState('09044922410');
  const [adminAvatar, setAdminAvatar] = useState('https://ui-avatars.com/api/?name=Hashim&background=00D285&color=000&bold=true');

  // Admin Profile Edit states
  const [editName, setEditName] = useState('HASHIM');
  const [editEmail, setEditEmail] = useState('uuhashim0918@gmail.com');
  const [editPhone, setEditPhone] = useState('09044922410');
  const [editAvatar, setEditAvatar] = useState('https://ui-avatars.com/api/?name=Hashim&background=00D285&color=000&bold=true');

  // Platform setting parameter configurations
  const [platformFee, setPlatformFee] = useState(1.5);
  const [settlementMode, setSettlementMode] = useState('AUTOMATED');
  const [complianceThreshold, setComplianceThreshold] = useState(50000);

  // Edit settings form fields
  const [editFee, setEditFee] = useState(1.5);
  const [editMode, setEditMode] = useState('AUTOMATED');
  const [editThreshold, setEditThreshold] = useState(50000);

  // Notifications feed state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      category: 'SECURITY',
      title: 'Failed Withdrawal Escrow Flagged',
      desc: 'Escrow clearing flagged a high risk value transfer on wallet route #TRD-7489.',
      time: '12 mins ago',
      read: false
    },
    {
      id: 2,
      category: 'OPERATIONS',
      title: 'Platform Fee Updated',
      desc: 'Master commission rate adjusted to 1.50% by lead operator key.',
      time: '1 hour ago',
      read: true
    },
    {
      id: 3,
      category: 'SYSTEM',
      title: 'Distributed Nodes Synchronized',
      desc: '5 out of 5 validator nodes confirmed transaction block consensus.',
      time: '3 hours ago',
      read: true
    }
  ]);

  // Markets list state
  const [markets, setMarkets] = useState([
    { id: 1, pair: 'Chelsea FC', rate: 850.50, change: '+2.4%', volume: '₦120,400,000', status: 'ACTIVE' },
    { id: 2, pair: 'Arsenal FC', rate: 920.00, change: '+1.5%', volume: '₦145,000,000', status: 'ACTIVE' },
    { id: 3, pair: 'Manchester United', rate: 680.20, change: '-3.1%', volume: '₦98,200,000', status: 'ACTIVE' },
    { id: 4, pair: 'Real Madrid', rate: 1250.00, change: '+4.8%', volume: '₦230,000,000', status: 'MAINTENANCE' }
  ]);
  const [newMarketPair, setNewMarketPair] = useState('');
  const [newMarketRate, setNewMarketRate] = useState('');
  const [newMarketVol, setNewMarketVol] = useState('');
  const [newMarketStatus, setNewMarketStatus] = useState('ACTIVE');
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);

  // User Portfolio balances ledger
  const [userBalances, setUserBalances] = useState([
    { id: 1, name: 'Sarah K.', email: 'sarah.k@gmail.com', phone: '09044922410', balance: 142000, stock: 12, status: 'Healthy' },
    { id: 2, name: 'Musa B.', email: 'musa.b@yahoo.com', phone: '09137148568', balance: 2300, stock: 2, status: 'Low Balance' },
    { id: 3, name: 'Chinedu A.', email: 'chinedu.a@outlook.com', phone: '08034567890', balance: 480000, stock: 45, status: 'Healthy' },
    { id: 4, name: 'Fatima Z.', email: 'fatima.z@gmail.com', phone: '08123456789', balance: 1500, stock: 0, status: 'Low Stock' },
    { id: 5, name: 'Tunde O.', email: 'tunde.o@gmail.com', phone: '07098765432', balance: 85000, stock: 1, status: 'Low Stock' },
    { id: 6, name: 'Grace A.', email: 'grace.a@hotmail.com', phone: '09012345678', balance: 0, stock: 0, status: 'Overdrawn' }
  ]);

  // KYC User Verification requests state
  const [kycUsers, setKycUsers] = useState([
    { id: 1, name: 'Babatunde G.', email: 'babatunde.g@gmail.com', phone: '08022334455', documentType: 'NIN National ID Card', documentNumber: 'NIN-789210984', date: 'Aug 18, 2026', status: 'PENDING' },
    { id: 2, name: 'Ngozi O.', email: 'ngozi.o@yahoo.com', phone: '09088776655', documentType: 'International Passport', documentNumber: 'PP-A0891238', date: 'Aug 17, 2026', status: 'PENDING' },
    { id: 3, name: 'Ibrahim Y.', email: 'ibrahim.y@hotmail.com', phone: '08155443322', documentType: 'Driver License', documentNumber: 'DL-NG823901A', date: 'Aug 16, 2026', status: 'APPROVED' },
    { id: 4, name: 'Amara K.', email: 'amara.k@gmail.com', phone: '07044332211', documentType: 'NIN National ID Card', documentNumber: 'NIN-109283749', date: 'Aug 15, 2026', status: 'REJECTED' }
  ]);
  const [kycSearchQuery, setKycSearchQuery] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState('ALL');
  const [selectedKycUser, setSelectedKycUser] = useState(null);

  // Portfolio vault reserve states
  const [vaultBalances, setVaultBalances] = useState({
    custodyPool: 1420500000,
    escrowLocked: 482100000,
    coldReserve: 850000000,
    payoutBank: 120400000
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
  const [transactions, setTransactions] = useState([
    {
      hash: '0x8f3c912a21b4a8e2',
      type: 'ESCROW_LOCK',
      amount: 12000,
      fromTo: 'Sarah K. -> Escrow Pool',
      userName: 'Sarah K.',
      userEmail: 'sarah.k@gmail.com',
      userPhone: '09044922410',
      time: '2 mins ago',
      status: 'SUCCESS'
    },
    {
      hash: '0x3a9b1c5e4f8d9a1b',
      type: 'SETTLEMENT_PAYOUT',
      amount: 20000,
      fromTo: 'Escrow Pool -> Musa B. & Chinedu A.',
      userName: 'Musa B.',
      userEmail: 'musa.b@yahoo.com',
      userPhone: '09137148568',
      time: '15 mins ago',
      status: 'SUCCESS'
    },
    {
      hash: '0x9d5e7f2c8a1b3c5d',
      type: 'DEPOSIT',
      amount: 50000,
      fromTo: 'Bank Transfer -> Hashim (Admin)',
      userName: 'Hashim',
      userEmail: 'uuhashim0918@gmail.com',
      userPhone: '09071234567',
      time: '30 mins ago',
      status: 'SUCCESS'
    },
    {
      hash: '0xe2a8c3d76f1a5b8c',
      type: 'WITHDRAWAL',
      amount: 10000,
      fromTo: 'Alex M. -> Bank Account',
      userName: 'Alex M.',
      userEmail: 'alex.m@gmail.com',
      userPhone: '08022119933',
      time: '1 hour ago',
      status: 'PENDING'
    },
    {
      hash: '0x4b7c8d9e1f2a3b4c',
      type: 'ESCROW_LOCK',
      amount: 40000,
      fromTo: 'David O. -> Escrow Pool',
      userName: 'David O.',
      userEmail: 'david.o@outlook.com',
      userPhone: '07033557799',
      time: '5 hours ago',
      status: 'FAILED'
    },
    {
      hash: '0x5c8d9e0f2a3b4c5d',
      type: 'WITHDRAWAL',
      amount: 25000,
      fromTo: 'Chinedu A. -> Card Account',
      userName: 'Chinedu A.',
      userEmail: 'chinedu.a@gmail.com',
      userPhone: '09011223344',
      time: '12 hours ago',
      status: 'SUCCESS'
    },
    {
      hash: '0x6d9e0f1a3b4c5d6e',
      type: 'DEPOSIT',
      amount: 15000,
      fromTo: 'Bank Transfer -> Grace A.',
      userName: 'Grace A.',
      userEmail: 'grace.a@yahoo.com',
      userPhone: '08122334455',
      time: '1 day ago',
      status: 'SUCCESS'
    }
  ]);

  // Security audit logs state
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      type: 'success',
      text: 'Administrative login authorized for uuhashim0918@gmail.com',
      meta: 'IP: 197.210.64.12 . 2 mins ago',
      icon: 'login'
    },
    {
      id: 2,
      type: 'system',
      text: 'Hourly escrow smart contracts balance verified: ₦842,920,000',
      meta: 'SYSTEM NODES . 1 hour ago',
      icon: 'cpu'
    },
    {
      id: 3,
      type: 'warning',
      text: 'Escrow block applied automatically on #TRD-8910 due to high volatility risk factors',
      meta: 'COMPLIANCE ENG . 3 hours ago',
      icon: 'warning'
    },
    {
      id: 4,
      type: 'success',
      text: 'Cold Wallet address signatures synchronized with decentralized node keys',
      meta: 'SYSTEM ENGINE . 6 hours ago',
      icon: 'shield'
    }
  ]);

  // Trade list state
  const [trades, setTrades] = useState([
    {
      id: '#TRD-9072',
      partyA: 'Sarah K.',
      partyB: 'Alex M.',
      avatarA: avatarList[0],
      avatarB: avatarList[1],
      asset: 'NGN',
      amount: 12000,
      time: '2 mins ago',
      status: 'SETTLED'
    },
    {
      id: '#TRD-8910',
      partyA: 'David O.',
      partyB: 'John D.',
      avatarA: avatarList[2],
      avatarB: avatarList[3],
      asset: 'NGN',
      amount: 40000,
      time: '5 mins ago',
      status: 'BLOCKED'
    },
    {
      id: '#TRD-8234',
      partyA: 'Musa B.',
      partyB: 'Chinedu A.',
      avatarA: avatarList[4],
      avatarB: avatarList[5],
      asset: 'NGN',
      amount: 20000,
      time: '15 mins ago',
      status: 'SETTLED'
    },
    {
      id: '#TRD-7612',
      partyA: 'Ibrahim H.',
      partyB: 'Emeka O.',
      avatarA: avatarList[1],
      avatarB: avatarList[4],
      asset: 'NGN',
      amount: 15000,
      time: '1 hour ago',
      status: 'SETTLED'
    },
    {
      id: '#TRD-7489',
      partyA: 'Grace A.',
      partyB: 'Fatima Z.',
      avatarA: avatarList[3],
      avatarB: avatarList[0],
      asset: 'NGN',
      amount: 60000,
      time: '3 hours ago',
      status: 'BLOCKED'
    },
    {
      id: '#TRD-7123',
      partyA: 'Kabir U.',
      partyB: 'Stanley N.',
      avatarA: avatarList[2],
      avatarB: avatarList[5],
      asset: 'NGN',
      amount: 30000,
      time: '6 hours ago',
      status: 'SETTLED'
    },
    {
      id: '#TRD-6991',
      partyA: 'Hassan M.',
      partyB: 'Tunde B.',
      avatarA: avatarList[4],
      avatarB: avatarList[2],
      asset: 'NGN',
      amount: 8000,
      time: '12 hours ago',
      status: 'SETTLED'
    }
  ]);

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
    const totalUsers = 142593 + (trades.length - 7) * 2;
    const activeTrades = 8210 + (trades.length - 7);
    const totalVolume = 2.4; // 2.4 Billion
    const platformRevenue = 48.2 + ((trades.filter(t => t.status === 'SETTLED').reduce((acc, t) => acc + t.amount, 0) - 85000) / 1000000) * (platformFee / 100);
    
    return {
      users: totalUsers.toLocaleString(),
      activeTrades: activeTrades.toLocaleString(),
      volume: totalVolume.toFixed(2) + 'B',
      revenue: '₦' + platformRevenue.toFixed(2) + 'M'
    };
  }, [trades, platformFee]);

  // Log in administrative session
  const handleLogin = (e) => {
    e.preventDefault();
    if (emailInput.trim() === 'uuhashim0918@gmail.com' && passwordInput === 'admin123') {
      setIsLoggedIn(true);
      setLoginError('');
      // Log login event
      logSecurityEvent('success', `Administrative login authorized for ${emailInput}`, 'IP: 197.210.64.12 . Just now', 'login');
    } else {
      setLoginError('Invalid administrative email username or security password.');
      logSecurityEvent('warning', `Unauthorized login attempt blocked for user: ${emailInput}`, 'IP: 197.210.64.12 . Just now', 'shield');
    }
  };

  // Helper to log security events
  const logSecurityEvent = (type, text, meta, iconType) => {
    const newLog = {
      id: Date.now(),
      type,
      text,
      meta,
      icon: iconType
    };
    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);
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
  const handleUpdateStatus = (id, nextStatus) => {
    setTrades(
      trades.map((trade) =>
        trade.id === id ? { ...trade, status: nextStatus } : trade
      )
    );
    setActiveMenuId(null);
    
    // Write audit log
    logSecurityEvent(
      nextStatus === 'SETTLED' ? 'success' : 'warning', 
      `Trade ${id} status updated to ${nextStatus}`, 
      `Operator: HASHIM . Just now`, 
      nextStatus === 'SETTLED' ? 'login' : 'warning'
    );

    // Prepend a Transaction payout record if status is SETTLED
    if (nextStatus === 'SETTLED') {
      const matchTrade = trades.find(t => t.id === id);
      const amount = matchTrade ? matchTrade.amount : 0;
      const partyA = matchTrade ? matchTrade.partyA : 'Party A';
      const partyB = matchTrade ? matchTrade.partyB : 'Party B';
      const newTx = {
        hash: '0x' + Math.random().toString(16).substring(2, 18),
        type: 'SETTLEMENT_PAYOUT',
        amount: amount,
        fromTo: `Escrow Pool -> ${partyA} & ${partyB}`,
        userName: partyA,
        userEmail: `${partyA.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        userPhone: '081' + Math.floor(10000000 + Math.random() * 90000000),
        time: 'Just now',
        status: 'SUCCESS'
      };
      setTransactions(prev => [newTx, ...prev]);
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
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    alert('Administrative security password updated successfully.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    logSecurityEvent('success', 'Admin master portal password updated successfully', 'Operator: HASHIM . Just now', 'shield');
  };

  // Handle saving administrator profile updates
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) {
      alert('Please fill out all admin details.');
      return;
    }
    setAdminName(editName);
    setAdminEmail(editEmail);
    setAdminPhone(editPhone);
    setAdminAvatar(editAvatar);
    alert('Administrator Profile details updated successfully!');
    logSecurityEvent('success', `Admin profile details modified: ${editName} (${editEmail})`, 'Operator: HASHIM . Just now', 'shield');
  };

  // Handle saving platform config settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const feeNum = parseFloat(editFee);
    if (isNaN(feeNum) || feeNum < 0 || feeNum > 100) {
      alert('Please configure a valid platform fee percentage (0-100%).');
      return;
    }
    setPlatformFee(feeNum);
    setSettlementMode(editMode);
    setComplianceThreshold(parseFloat(editThreshold) || 0);
    alert('System settings and commission policies stored successfully!');
    logSecurityEvent('success', `Platform parameters modified: Fee: ${feeNum}%, Mode: ${editMode}`, 'Operator: HASHIM . Just now', 'cpu');
  };

  // Handle simulated market creation
  const handleCreateMarket = (e) => {
    e.preventDefault();
    if (!newMarketPair.trim() || !newMarketRate || !newMarketVol) return;
    const rateNum = parseFloat(newMarketRate) || 0;
    const volumeNum = parseFloat(newMarketVol) || 0;
    const newMkt = {
      id: Date.now(),
      pair: newMarketPair.toUpperCase(),
      rate: rateNum,
      change: '0.0%',
      volume: '₦' + volumeNum.toLocaleString(),
      status: newMarketStatus
    };
    setMarkets([newMkt, ...markets]);
    setIsMarketModalOpen(false);
    setNewMarketPair('');
    setNewMarketRate('');
    setNewMarketVol('');
    setNewMarketStatus('ACTIVE');
    logSecurityEvent('success', `New simulated market pair added: ${newMarketPair.toUpperCase()}`, 'Operator: HASHIM . Just now', 'cpu');
  };

  // Handle internal vault reserves transfers
  const handleVaultTransfer = (e) => {
    e.preventDefault();
    const amountVal = parseFloat(transferAmount) || 0;
    if (amountVal <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }
    if (transferSource === transferDest) {
      alert('Source and destination vault partitions must be different.');
      return;
    }
    if (vaultBalances[transferSource] < amountVal) {
      alert('Insufficient reserves inside selected source vault.');
      return;
    }
    setVaultBalances(prev => ({
      ...prev,
      [transferSource]: prev[transferSource] - amountVal,
      [transferDest]: prev[transferDest] + amountVal
    }));
    setTransferAmount('');
    alert(`Transfer of ₦${amountVal.toLocaleString()} completed successfully between vault partitions!`);
    logSecurityEvent('success', `Internal vault reserve clearing: ₦${amountVal.toLocaleString()} moved from ${transferSource} to ${transferDest}`, 'Operator: HASHIM . Just now', 'shield');
  };

  // Handle notification actions
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    alert('All notifications marked as read.');
    logSecurityEvent('success', `All system notifications marked as READ`, 'Operator: HASHIM . Just now', 'login');
  };

  const handleDismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Handle approving or rejecting KYC users registration
  const handleUpdateKycStatus = (id, nextStatus) => {
    setKycUsers(prev => prev.map(user => user.id === id ? { ...user, status: nextStatus } : user));
    const targetUser = kycUsers.find(u => u.id === id);
    const userName = targetUser ? targetUser.name : 'User';
    logSecurityEvent(
      nextStatus === 'APPROVED' ? 'success' : 'warning',
      `User registration request for ${userName} set to ${nextStatus}`,
      'Operator: HASHIM . Just now',
      nextStatus === 'APPROVED' ? 'login' : 'warning'
    );
    alert(`User profile verification updated to ${nextStatus} successfully!`);
  };

  // Handle Approve/Reject Transactions
  const handleUpdateTxnStatus = (hash, nextStatus) => {
    setTransactions(prev =>
      prev.map(t => t.hash === hash ? { ...t, status: nextStatus } : t)
    );
    // Write audit log
    logSecurityEvent(
      nextStatus === 'SUCCESS' ? 'success' : 'warning', 
      `Transaction ${hash.substring(0, 8)}... was manually ${nextStatus === 'SUCCESS' ? 'APPROVED' : 'REJECTED'}`, 
      `Operator: HASHIM . Just now`, 
      nextStatus === 'SUCCESS' ? 'login' : 'shield'
    );
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
    logSecurityEvent('system', `Administrative terminal session terminated for uuhashim0918@gmail.com`, 'IP: 197.210.64.12 . Just now', 'cpu');
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
            <div className="login-logo-wrap">
              <Landmark size={28} />
            </div>
            <h1 className="login-title">Peeritrade</h1>
            <span className="login-subtitle">Institutional Access Portal</span>
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
              <input
                type="password"
                id="login-password"
                className="login-input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            {loginError ? <span className="login-error">{loginError}</span> : null}

            <button type="submit" className="login-btn">
              Access Terminal
            </button>
          </form>

          <div className="login-hint">
            <strong>Demo Access Details:</strong><br />
            Username: <code>uuhashim0918@gmail.com</code><br />
            Password: <code>admin123</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sticky Left Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Landmark size={20} />
          </div>
          <div className="logo-text-container">
            <h1 className="logo-title">Peeritrade</h1>
            <span className="logo-subtitle">Institutional Grade</span>
          </div>
        </div>

        <button 
          className="new-trade-btn" 
          onClick={() => setIsModalOpen(true)}
          id="btn-new-trade"
        >
          <Plus size={16} />
          <span>New Trade</span>
        </button>

        <ul className="sidebar-menu">
          <li>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`menu-item-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard className="menu-icon" size={16} />
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('markets')}
              className={`menu-item-btn ${activeTab === 'markets' ? 'active' : ''}`}
            >
              <TrendingUp className="menu-icon" size={16} />
              <span>Live Markets</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`menu-item-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            >
              <Briefcase className="menu-icon" size={16} />
              <span>Portfolio</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`menu-item-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            >
              <ArrowLeftRight className="menu-icon" size={16} />
              <span>Transactions</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setActiveTab('users');
                setCurrentPage(1);
              }}
              className={`menu-item-btn ${activeTab === 'users' ? 'active' : ''}`}
            >
              <Users className="menu-icon" size={16} />
              <span>Users</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('security')}
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
              <img
                src={adminAvatar}
                alt="Admin Profile"
                className="user-avatar"
              />
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
                  onClick={() => alert('Exporting raw analytical data summary CSV...')}
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
                        <span className="oversight-value">₦842,920,000</span>
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
                        <span className="oversight-value">₦1.56B</span>
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

            <section className="recent-trades-card" style={{ maxWidth: 800, margin: '0 auto' }}>
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
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Portal Settings</h2>
                <p className="overview-sub">Configure platform fee structure, settlement algorithms, and threshold safeguards.</p>
              </div>
            </div>

            <div className="security-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="security-settings-card" style={{ maxWidth: 650, margin: '0 auto', width: '100%' }}>
                <div className="security-settings-section">
                  <h3 className="security-section-title">Platform Config Parameters</h3>
                  <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 6, display: 'block' }}>
                        Platform Commission Fee (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Platform Fee (e.g. 1.5)"
                        className="form-input-text"
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                        required
                      />
                      <span style={{ fontSize: 10, color: '#64748b', marginTop: 4, display: 'block' }}>
                        This commission is automatically assessed against completed simulated escrow trades.
                      </span>
                    </div>

                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 6, display: 'block' }}>
                        Settlement Release Protocol
                      </label>
                      <select
                        className="form-input-text"
                        style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', color: '#ffffff' }}
                        value={editMode}
                        onChange={(e) => setEditMode(e.target.value)}
                      >
                        <option value="AUTOMATED">Automated Instant Payouts</option>
                        <option value="DELAYED">Delayed Escrow Batching (24h Lock)</option>
                        <option value="MANUAL">Manual Admin Approval Required</option>
                      </select>
                    </div>

                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 6, display: 'block' }}>
                        Multi-Sig Verification Threshold (₦)
                      </label>
                      <input
                        type="number"
                        placeholder="Multi-Sig Threshold Amount"
                        className="form-input-text"
                        value={editThreshold}
                        onChange={(e) => setEditThreshold(e.target.value)}
                        required
                      />
                      <span style={{ fontSize: 10, color: '#64748b', marginTop: 4, display: 'block' }}>
                        Settlements above this limit will require compliance signatures.
                      </span>
                    </div>

                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                      Save Settings Configuration
                    </button>
                  </form>
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
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Vaults & Reserves</h2>
                <p className="overview-sub">Institutional reserve partitions, multi-sig cold vaults, and escrow pool clearing balances.</p>
              </div>
            </div>

            {/* Grid of vault cards */}
            <div className="metrics-grid" style={{ marginBottom: 24 }}>
              <div className="metric-card">
                <span className="metric-title">Main Custody Pool</span>
                <span className="metric-value" style={{ color: '#00D285' }}>
                  ₦{vaultBalances.custodyPool.toLocaleString()}
                </span>
                <span className="metric-trend success">Institutional Reserve Wallet</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Active Escrow Locked</span>
                <span className="metric-value" style={{ color: '#3B82F6' }}>
                  ₦{vaultBalances.escrowLocked.toLocaleString()}
                </span>
                <span className="metric-trend success">Currently Locked in Trades</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Cold Vault Reserves</span>
                <span className="metric-value" style={{ color: '#F59E0B' }}>
                  ₦{vaultBalances.coldReserve.toLocaleString()}
                </span>
                <span className="metric-trend warning">Multi-Sig Hard Locked</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Payout Bank Reserves</span>
                <span className="metric-value" style={{ color: '#ffffff' }}>
                  ₦{vaultBalances.payoutBank.toLocaleString()}
                </span>
                <span className="metric-trend success">Automated Releases Float</span>
              </div>
            </div>

            {/* User Portfolio Balances Ledger Table */}
            <section className="recent-trades-card" style={{ marginTop: 24 }}>
              <div className="table-filter-row" style={{ borderBottom: '1px solid #1e293b', paddingBottom: 16 }}>
                <div>
                  <h3 className="card-heading">User Balances & Escrow Stock Ledger</h3>
                  <p className="card-subheading">Track remaining naira deposits, active escrow locks, and risk alert status</p>
                </div>
              </div>

              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th>User Account</th>
                      <th>Naira Balance</th>
                      <th>Escrow Stock (Contracts)</th>
                      <th>Risk Indicator</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBalances.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{user.name}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{user.email} • {user.phone}</span>
                          </div>
                        </td>
                        <td style={{ color: '#00D285', fontWeight: '600' }}>
                          ₦{user.balance.toLocaleString()}
                        </td>
                        <td style={{ color: '#ffffff', fontWeight: 'bold' }}>
                          {user.stock} Units
                        </td>
                        <td>
                          <span
                            className="status-badge-td"
                            style={{
                              backgroundColor: user.status === 'Healthy' ? 'rgba(0, 210, 133, 0.08)' :
                                               user.status === 'Low Balance' ? 'rgba(245, 158, 11, 0.08)' :
                                               user.status === 'Low Stock' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                              border: user.status === 'Healthy' ? '1px solid rgba(0, 210, 133, 0.2)' :
                                      user.status === 'Low Balance' ? '1px solid rgba(245, 158, 11, 0.2)' :
                                      user.status === 'Low Stock' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                              color: user.status === 'Healthy' ? '#00D285' :
                                     user.status === 'Low Balance' ? '#F59E0B' :
                                     user.status === 'Low Stock' ? '#3B82F6' : '#EF4444'
                            }}
                          >
                            {user.status}
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
                              const extraVal = 50000;
                              setUserBalances(userBalances.map(u => u.id === user.id ? { 
                                ...u, 
                                balance: u.balance + extraVal,
                                status: 'Healthy'
                              } : u));
                              logSecurityEvent('success', `Simulated reserve credit: ₦${extraVal.toLocaleString()} added to ${user.name}'s ledger`, 'Operator: HASHIM . Just now', 'shield');
                              alert(`Simulated credit of ₦${extraVal.toLocaleString()} successfully applied to ${user.name}!`);
                            }}
                          >
                            Simulate Deposit
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
            <div className="table-filter-card" style={{ marginBottom: 24, padding: '16px 24px', backgroundColor: '#0b1220', borderRadius: 8, border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                
                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0d1527', border: '1px solid #1e293b', borderRadius: 6, padding: '6px 12px', minWidth: 320 }}>
                  <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    style={{ backgroundColor: 'transparent', border: 'none', color: '#ffffff', outline: 'none', fontSize: 13, width: '100%' }}
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
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold' }}>Verification Status:</span>
                  <select
                    className="dropdown-select"
                    style={{ height: 36, padding: '0 12px', backgroundColor: '#0d1527', border: '1px solid #1e293b', color: '#ffffff', borderRadius: 6 }}
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
                              <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{user.name}</span>
                              <span style={{ fontSize: 11, color: '#64748b' }}>{user.email} • {user.phone}</span>
                            </div>
                          </td>
                          <td style={{ color: '#94a3b8' }}>{user.documentType}</td>
                          <td style={{ fontFamily: 'monospace', color: '#ffffff', fontWeight: '500' }}>
                            {user.documentNumber}
                          </td>
                          <td style={{ color: '#94a3b8' }}>{user.date}</td>
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
    </div>
  );
}
