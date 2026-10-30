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
  Unlock,
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
  PlusCircle,
  CreditCard,
  Save,
  Shield,
  Cpu,
  UserCheck,
  ToggleLeft,
  Menu,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Gift,
  Share2,
  UserPlus,
  Award,
  Sparkles,
  Send,
  History,
  User,
  Copy,
  Layers,
  Film,
  Globe,
  Flame,
  Trophy,
  Swords,
  CircleDot,
  Percent,
  Sliders,
  ShieldAlert
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

// Canonical Category & Subcategory Master Registry (100% synchronized with App tabs)
export const APP_CATEGORIES = [
  {
    id: 'Politics',
    label: 'Politics & Policy',
    icon: Landmark,
    emoji: '🏛️',
    description: 'Central bank rates, elections, global affairs, and governance',
    subcategories: [
      'Policy & Economy',
      'Elections',
      'Global Affairs',
      'World Leaders',
    ],
  },
  {
    id: 'Entertainment',
    label: 'Entertainment & Media',
    icon: Film,
    emoji: '🎬',
    description: 'Spotify streams, music charts, box office sales, and awards',
    subcategories: [
      'Spotify & Music',
      'Movies & Box Office',
      'Awards & Grammys',
    ],
  },
  {
    id: 'Live Event Prediction',
    label: 'Live Event Prediction',
    icon: Globe,
    emoji: '🌍',
    description: 'Space missions, AI milestones, scientific breakthroughs, and viral culture',
    subcategories: [
      'Space & Tech',
      'AI & Computing',
      'Climate & Science',
      'Pop Culture',
    ],
  },
  {
    id: 'Football',
    label: 'Football (Soccer)',
    icon: Trophy,
    emoji: '⚽',
    description: 'Premier League, Champions League, La Liga, and international fixtures',
    subcategories: [
      'Premier League',
      'Champions League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'International',
    ],
  },
  {
    id: 'Boxing',
    label: 'Boxing',
    icon: Swords,
    emoji: '🥊',
    description: 'Heavyweight world titles, championship fights, and boxing bouts',
    subcategories: [
      'World Championship',
      'Heavyweight Title',
      'Undisputed',
    ],
  },
  {
    id: 'UFC',
    label: 'UFC / MMA',
    icon: Swords,
    emoji: '🥋',
    description: 'UFC pay-per-view cards, championship title defenses, and fight nights',
    subcategories: [
      'Championship Title',
      'Main Card',
      'Fight Night',
    ],
  },
  {
    id: 'Basketball',
    label: 'Basketball (NBA)',
    icon: CircleDot,
    emoji: '🏀',
    description: 'NBA regular season, playoffs, and international EuroLeague matches',
    subcategories: [
      'NBA Regular Season',
      'NBA Playoffs',
      'EuroLeague',
    ],
  },
];

export default function App() {
  // Session authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!(localStorage.getItem('token') || sessionStorage.getItem('token'))
  );
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

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem('admin_sidebar_collapsed') === 'true'
  );

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for session expiration events
  useEffect(() => {
    const handleAuthExpired = () => {
      setIsLoggedIn(false);
      showToast('Your session has expired. Please log in again.', 'warning');
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

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

  // Date filter state (Default: 'ALL' to show all data)
  const [dateRange, setDateRange] = useState('ALL');

  // Global search shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleSearchShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('top-bar-search');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  // Admin profile state details
  const [adminName, setAdminName] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser') || '{}');
      return (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : '') || 'Admin';
    } catch {
      return 'Admin';
    }
  });
  const [adminEmail, setAdminEmail] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser') || '{}');
      return u.email || '';
    } catch {
      return '';
    }
  });
  const [adminPhone, setAdminPhone] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser') || '{}');
      return u.phone || '';
    } catch {
      return '';
    }
  });
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
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Markets & Backdoor Trades State
  const [markets, setMarkets] = useState([]);
  const [matches, setMatches] = useState([]);
  const [marketSubTab, setMarketSubTab] = useState('markets'); // 'markets' | 'sports'
  const [marketCategoryFilter, setMarketCategoryFilter] = useState('ALL');
  const [marketStatusFilter, setMarketStatusFilter] = useState('ALL');
  const [marketSearchText, setMarketSearchText] = useState('');
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingMarket, setResolvingMarket] = useState(null);
  const [selectedWinningOption, setSelectedWinningOption] = useState('yes');

  // Manual Backdoor Trade Form States
  const [tradeTitle, setTradeTitle] = useState('');
  const [tradeCategory, setTradeCategory] = useState('Entertainment');
  const [tradeSubcategory, setTradeSubcategory] = useState('Spotify & Music');
  const [tradeMarketType, setTradeMarketType] = useState('YES_NO');
  const [tradeYesOdds, setTradeYesOdds] = useState('1.85');
  const [tradeNoOdds, setTradeNoOdds] = useState('1.95');
  const [tradeOptions, setTradeOptions] = useState([
    { id: 'opt_1', label: 'Drake', odds: '2.40' },
    { id: 'opt_2', label: 'Taylor Swift', odds: '1.95' },
    { id: 'opt_3', label: 'The Weeknd', odds: '3.10' },
  ]);
  const [tradeRules, setTradeRules] = useState('');
  const [tradeResolutionSource, setTradeResolutionSource] = useState('');
  const [tradePoolAmount, setTradePoolAmount] = useState('500000');
  const [tradeClosingHours, setTradeClosingHours] = useState('24');
  const [tradePublishNow, setTradePublishNow] = useState(true); // Default: Live Market

  // User Portfolio balances ledger
  const [userBalances, setUserBalances] = useState([]);
  const [vaultTableTab, setVaultTableTab] = useState('balances'); // 'balances' | 'airdrop'
  const [vaultBalancesPage, setVaultBalancesPage] = useState(1);
  const [vaultAirdropPage, setVaultAirdropPage] = useState(1);
  const vaultPerPage = 50;

  // KYC User Verification requests state
  const [kycUsers, setKycUsers] = useState([]);
  const [kycSearchQuery, setKycSearchQuery] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState('ALL');
  const [selectedKycUser, setSelectedKycUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [userPerPage, setUserPerPage] = useState(25);

  // Credit User Popup Modal State
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditTargetUser, setCreditTargetUser] = useState(null);
  const [creditAmountInput, setCreditAmountInput] = useState('');
  const [creditNoteInput, setCreditNoteInput] = useState('');
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);

  // Modern Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: null,
    isProcessing: false,
  });

  const openConfirmModal = ({ title, message, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger', onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm,
      isProcessing: false,
    });
  };

  // Derived counts for sidebar status indicators
  const pendingKycCount = useMemo(() => {
    return kycUsers.filter((u) => u.status === 'PENDING').length;
  }, [kycUsers]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const activeMarketsCount = useMemo(() => {
    return markets.filter((m) => m.status === 'ACTIVE' || m.status === 'PUBLISHED' || m.published).length;
  }, [markets]);

  const adminInitials = useMemo(() => {
    if (!adminName) return 'AD';
    const parts = adminName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return adminName.slice(0, 2).toUpperCase();
  }, [adminName]);

  // Contextual placeholder for header search bar based on active page
  const searchPlaceholder = useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return 'Search trades (ID, party, status, amount)...';
      case 'users':
        return 'Search users (name, email, phone, status)...';
      case 'markets':
        return 'Search markets, contracts, sports & teams...';
      case 'transactions':
        return 'Search transactions (hash, user, amount, type)...';
      case 'portfolio':
        return 'Search portfolio accounts, balances, stock...';
      case 'security':
        return 'Search security audit logs & events...';
      case 'referrals':
        return 'Search referrals & affiliate activity...';
      case 'notifications':
        return 'Search system notices & alerts...';
      default:
        return 'Search across platform...';
    }
  }, [activeTab]);

  // Referral System State
  const [referralStats, setReferralStats] = useState({ totalReferrals: 0, totalBonusPaid: 0, activeReferrers: 0, pendingReferrals: 0, recentReferrals: [], topReferrers: [], recentWinShares: [] });
  const [referralSettings, setReferralSettings] = useState({ referralEnabled: true, referrerBonus: 1000, refereeBonus: 1000, winReceiptShareBonus: 1000, winReceiptWeeklyLimit: 3, referralDescription: '' });
  const [editReferralEnabled, setEditReferralEnabled] = useState(true);
  const [editReferrerBonus, setEditReferrerBonus] = useState('1000');
  const [editRefereeBonus, setEditRefereeBonus] = useState('1000');
  const [editWinShareBonus, setEditWinShareBonus] = useState('1000');
  const [editWinWeeklyLimit, setEditWinWeeklyLimit] = useState('3');
  const [editReferralDescription, setEditReferralDescription] = useState('');
  const [isSavingReferral, setIsSavingReferral] = useState(false);
  const [referralCategory, setReferralCategory] = useState('all'); // 'all' | 'top' | 'recent' | 'win_shares'
  const [referralPage, setReferralPage] = useState(1);
  const referralPerPage = 25;

  // Payment Gateway Configuration State (Only VTStack & Flutterwave)
  const [activeGateway, setActiveGateway] = useState('vtstack');
  const [flutterwavePublicKey, setFlutterwavePublicKey] = useState('');
  const [flutterwaveSecretKey, setFlutterwaveSecretKey] = useState('');
  const [flutterwaveSecretHash, setFlutterwaveSecretHash] = useState('');
  const [vtstackApiKey, setVtstackApiKey] = useState('');
  const [vtstackPayoutKey, setVtstackPayoutKey] = useState('');
  const [vtstackWebhookSecret, setVtstackWebhookSecret] = useState('');
  const [gatewayMode, setGatewayMode] = useState('TEST');
  const [autoWithdrawalApproval, setAutoWithdrawalApproval] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showSecretKeys, setShowSecretKeys] = useState(false);

  // External Sports & Data API Configuration State
  const [footballApiKey, setFootballApiKey] = useState('');
  const [theSportsDbApiKey, setTheSportsDbApiKey] = useState('');
  const [oddsApiKey, setOddsApiKey] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isSavingApis, setIsSavingApis] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [hasEnvFootballApiKey, setHasEnvFootballApiKey] = useState(false);
  const [envFootballApiKeyMasked, setEnvFootballApiKeyMasked] = useState('');
  const [isTestingFootballApi, setIsTestingFootballApi] = useState(false);
  const [footballApiStatus, setFootballApiStatus] = useState(null);
  const [isSyncingMatches, setIsSyncingMatches] = useState(false);

  // Portfolio vault reserve states
  const [vaultBalances, setVaultBalances] = useState({
    custodyPool: 0,
    escrowLocked: 0,
    coldReserve: 0,
    payoutBank: 0,
    promoReserve: 0,
    totalPromoDeposited: 0,
    totalPromoDisbursed: 0
  });
  const [transferSource, setTransferSource] = useState('payoutBank');
  const [transferDest, setTransferDest] = useState('promoReserve');
  const [transferAmount, setTransferAmount] = useState('');

  // Promo Vault Deposit & Airdrop states
  const [promoDepositAmount, setPromoDepositAmount] = useState('');
  const [promoDepositNote, setPromoDepositNote] = useState('');
  const [isDepositingPromo, setIsDepositingPromo] = useState(false);
  const [showPromoDepositModal, setShowPromoDepositModal] = useState(false);

  // Airdrop Bonus Launcher state
  const [airdropCampaign, setAirdropCampaign] = useState('');
  const [airdropAudience, setAirdropAudience] = useState('random');
  const [airdropCount, setAirdropCount] = useState('25');
  const [airdropAmount, setAirdropAmount] = useState('1000');
  const [airdropNote, setAirdropNote] = useState('');
  const [isLaunchingAirdrop, setIsLaunchingAirdrop] = useState(false);
  const [airdropHistory, setAirdropHistory] = useState([]);

  // Security credentials form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
  const [securityCategory, setSecurityCategory] = useState('all'); // 'all' | 'warnings' | 'success' | 'system'
  const [securityPage, setSecurityPage] = useState(1);
  const securityPerPage = 25;

  // Notification category & pagination state
  const [notifCategory, setNotifCategory] = useState('all'); // 'all' | 'unread' | 'security' | 'operations'
  const [notifPage, setNotifPage] = useState(1);
  const notifPerPage = 15;

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

  // Real 24h hourly trade frequency chart data computed directly from database
  const tradeFrequencyData = useMemo(() => {
    return Array.isArray(dbStats.tradeFrequencyData) && dbStats.tradeFrequencyData.length > 0
      ? dbStats.tradeFrequencyData
      : [];
  }, [dbStats.tradeFrequencyData]);

  // Dynamically calculate dashboard overview metrics based on real database state
  const metrics = useMemo(() => {
    const formatCur = (val) => {
      const num = Number(val) || 0;
      if (num >= 1000000000) return '₦' + (num / 1000000000).toFixed(2) + 'B';
      if (num >= 1000000) return '₦' + (num / 1000000).toFixed(2) + 'M';
      return '₦' + num.toLocaleString();
    };

    return {
      users: (dbStats.users || 0).toLocaleString(),
      activeTrades: (dbStats.activeTrades || 0).toLocaleString(),
      volume: '₦' + (dbStats.volume || 0).toLocaleString(),
      revenue: '₦' + (dbStats.revenue || 0).toLocaleString(),
      inEscrow: '₦' + (dbStats.inEscrow || 0).toLocaleString(),
      coldWalletBalance: formatCur(dbStats.coldWalletBalance),
      liquidity: formatCur(dbStats.liquidity)
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
      fetchDashboardStats(dateRange);
      fetchUsers();
      fetchTransactions();
      fetchTrades();
      fetchMarkets();
      fetchMatches();
      fetchSettings();
      fetchSecurityLogs();
      fetchVaults();
      fetchReferralStats();
      fetchAirdropHistory();
      fetchNotifications();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardStats(dateRange);
    }
  }, [dateRange]);

  useEffect(() => {
    if (isLoggedIn && (activeTab === 'users' || activeTab === 'dashboard')) {
      fetchUsers();
      fetchDashboardStats(dateRange);
    }
  }, [activeTab, isLoggedIn]);

  const fetchDashboardStats = async (range = dateRange) => {
    try {
      const { data } = await api.get('/admin/stats', { params: { range } });
      setDbStats(data);
      if (data && data.platformFee !== undefined) {
        setPlatformFee(data.platformFee);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users?limit=10000');
      // Map server users to userBalances structure
      const list = Array.isArray(data) ? data : (data?.users || []);
      const mappedUsers = list.map(u => ({
        id: u._id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'User',
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        balance: u.balance || 0,
        stock: u.stock || u.activeShares || 0,
        status: (u.balance || 0) > 5000 ? 'Healthy' : (u.balance || 0) > 0 ? 'Low Balance' : 'Zero Balance'
      }));
      setUserBalances(mappedUsers);

      const mappedKycUsers = list.map(u => ({
        id: u._id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'User',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        username: u.username || '',
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        balance: u.balance || 0,
        stock: u.stock || u.activeShares || 0,
        documentType: u.kycDocument ? 'ID Document Uploaded' : 'NIN / National ID',
        documentNumber: u._id ? u._id.substring(0, 10).toUpperCase() : 'N/A',
        date: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
        createdAt: u.createdAt,
        status: (u.kycStatus || (u.isVerified ? 'APPROVED' : 'PENDING')).toUpperCase(),
        isVerified: u.isVerified,
        idCardFront: u.kycDocument || '',
        idCardBack: '',
        virtualAccount: u.virtualAccount,
        referralCode: u.referralCode || 'N/A',
        referralCount: u.referralCount || 0,
        referralEarnings: u.referralEarnings || 0,
        role: u.role || 'user'
      }));
      setKycUsers(mappedKycUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/admin/transactions');
      const list = Array.isArray(data) ? data : (data?.transactions || []);
      const mappedTxns = list.map(t => {
        let name = '';
        if (t.user && typeof t.user === 'object') {
          const fullName = `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim();
          name = fullName || t.user.username || (t.user.email ? t.user.email.split('@')[0] : '');
        }
        if (!name && t.userName && t.userName !== 'Unknown' && t.userName !== 'N/A') {
          name = t.userName;
        }
        if (!name && t.description) {
          const desc = String(t.description);
          if (desc.includes('friend ')) {
            name = desc.split('friend ')[1]?.trim();
          } else if (desc.includes('from ')) {
            name = desc.split('from ')[1]?.trim();
          } else if (desc.includes('for ')) {
            name = desc.split('for ')[1]?.trim();
          }
        }
        if (!name) {
          name = 'Platform Client';
        }

        return {
          hash: t.reference || t.hash || t._id,
          type: (t.type || 'TRANSACTION').toUpperCase(),
          amount: t.amount || 0,
          userName: name,
          userEmail: (t.user && typeof t.user === 'object' && t.user.email) ? t.user.email : (t.userEmail || '—'),
          userPhone: (t.user && typeof t.user === 'object' && t.user.phone) ? t.user.phone : (t.userPhone || '—'),
          time: new Date(t.createdAt || Date.now()).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: t.status === 'completed' ? 'SUCCESS' : t.status === 'pending' ? 'PENDING' : 'FAILED'
        };
      });
      setTransactions(mappedTxns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchTrades = async () => {
    try {
      const { data } = await api.get('/admin/trades');
      const list = Array.isArray(data) ? data : (data?.trades || []);
      const mappedTrades = list.map(t => {
        const nameA = t.initiator ? `${t.initiator.firstName || ''} ${t.initiator.lastName || ''}`.trim() : 'System';
        const nameB = t.responder ? `${t.responder.firstName || ''} ${t.responder.lastName || ''}`.trim() : (t.tradeType === 'POOL_CONTRACT' ? 'Peer Pool Reserve' : 'Orderbook Escrow');
        return {
          id: t._id || t.id,
          partyA: nameA || 'Trader A',
          partyB: nameB || 'Trader B',
          avatarA: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameA || 'User')}&background=0f172a&color=00D285`,
          avatarB: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameB || 'Escrow')}&background=1e293b&color=3B82F6`,
          asset: t.asset || 'NGN',
          amount: t.amount || 0,
          contractInfo: t.contractInfo || '',
          tradeType: t.tradeType || 'DIRECT_ESCROW',
          time: new Date(t.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawCreatedAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          status: t.status || 'PENDING'
        };
      });
      setTrades(mappedTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/admin/notifications');
      const list = Array.isArray(data) ? data : (data?.notifications || []);
      setNotifications(list.map(n => ({
        id: n._id || n.id,
        _id: n._id || n.id,
        title: n.title || 'System Alert',
        desc: n.message || n.text || n.title,
        text: n.message || n.text || n.title,
        type: n.type || 'system',
        category: (n.type || 'system').toUpperCase(),
        time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        fullDate: n.createdAt ? new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent',
        user: n.user,
        createdAt: n.createdAt,
        read: !!n.isRead || !!n.read
      })));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMarkets = async () => {
    try {
      const { data } = await api.get('/admin/markets');
      const list = Array.isArray(data) ? data : (data?.markets || []);
      setMarkets(list.map(m => ({
        id: m._id || m.id,
        _id: m._id || m.id,
        title: m.title || m.pair || 'Market',
        pair: m.pair || m.title || 'Market',
        category: m.category || 'Entertainment',
        subcategory: m.subcategory || 'General',
        marketType: m.marketType || 'YES_NO',
        options: m.options || [],
        rules: m.rules || '',
        resolutionSource: m.resolutionSource || '',
        poolAmount: m.poolAmount || 0,
        volume: m.volume || `₦${(m.poolAmount || 0).toLocaleString()}`,
        status: m.status || 'ACTIVE',
        isLocked: Boolean(m.isLocked),
        isOverpowered: Boolean(m.isOverpowered || m.isLocked),
        lockedReason: m.lockedReason || '',
        winningOption: m.winningOption,
        closingDate: m.closingDate,
        resolutionDate: m.resolutionDate,
        resolvedAt: m.resolvedAt,
        isBackdoorManual: m.isBackdoorManual ?? true,
        betCount: m.betCount || 0,
        pendingStake: m.pendingStake || 0,
        rate: m.rate || 1.0,
        change: m.change || '0.0%',
      })));
    } catch (error) {
      console.error('Error fetching markets:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/admin/matches');
      const list = Array.isArray(data) ? data : (data?.matches || []);
      setMatches(list);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      if (data) {
        setPlatformFee(data.platformFee ?? 0);
        setSettlementMode(data.settlementMode || 'AUTOMATED');
        setComplianceThreshold(data.complianceThreshold ?? 0);

        setEditFee(data.platformFee ?? 0);
        setEditMode(data.settlementMode || 'AUTOMATED');
        setEditThreshold(data.complianceThreshold ?? 0);

        setActiveGateway(data.activePaymentGateway === 'flutterwave' ? 'flutterwave' : 'vtstack');
        setFlutterwavePublicKey(data.flutterwavePublicKey || '');
        setFlutterwaveSecretKey(data.flutterwaveSecretKey || '');
        setFlutterwaveSecretHash(data.flutterwaveSecretHash || '');
        setVtstackApiKey(data.vtstackApiKey || '');
        setVtstackPayoutKey(data.vtstackPayoutKey || '');
        setVtstackWebhookSecret(data.vtstackWebhookSecret || '');
        setGatewayMode(data.gatewayMode || 'TEST');
        setAutoWithdrawalApproval(data.autoWithdrawalApproval !== false);
        setMaintenanceMode(data.maintenanceMode === true);

        // External Sports and Data APIs
        setFootballApiKey(data.footballApiKey || '');
        setTheSportsDbApiKey(data.theSportsDbApiKey || '');
        setOddsApiKey(data.oddsApiKey || '');
        setRapidApiKey(data.rapidApiKey || '');
        setGeminiApiKey(data.geminiApiKey || '');
        setHasEnvFootballApiKey(Boolean(data.hasEnvFootballApiKey));
        setEnvFootballApiKeyMasked(data.envFootballApiKeyMasked || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const [statsRes, settingsRes] = await Promise.all([
        api.get('/admin/referrals/stats'),
        api.get('/admin/referrals/settings')
      ]);
      setReferralStats(statsRes.data);
      setReferralSettings(settingsRes.data);
      setEditReferralEnabled(settingsRes.data.referralEnabled ?? true);
      setEditReferrerBonus(String(settingsRes.data.referrerBonus ?? 1000));
      setEditRefereeBonus(String(settingsRes.data.refereeBonus ?? 1000));
      setEditWinShareBonus(String(settingsRes.data.winReceiptShareBonus ?? 1000));
      setEditWinWeeklyLimit(String(settingsRes.data.winReceiptWeeklyLimit ?? 3));
      setEditReferralDescription(settingsRes.data.referralDescription || '');
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const saveReferralSettings = async () => {
    setIsSavingReferral(true);
    try {
      await api.post('/admin/referrals/settings', {
        referralEnabled: editReferralEnabled,
        referrerBonus: Number(editReferrerBonus),
        refereeBonus: Number(editRefereeBonus),
        winReceiptShareBonus: Number(editWinShareBonus),
        winReceiptWeeklyLimit: Number(editWinWeeklyLimit),
        referralDescription: editReferralDescription
      });
      await fetchReferralStats();
      showToast('Referral settings saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save referral settings', 'error');
    } finally {
      setIsSavingReferral(false);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const { data } = await api.get('/admin/security-logs');
      const list = Array.isArray(data) ? data : (data?.logs || []);
      setAuditLogs(list.map(l => ({
        id: l._id || l.id,
        type: l.type || 'info',
        text: l.text || '',
        meta: l.meta || '',
        icon: l.icon || 'shield',
        time: new Date(l.createdAt || Date.now()).toLocaleString()
      })));
    } catch (error) {
      console.error('Error fetching security logs:', error);
    }
  };

  const fetchVaults = async () => {
    try {
      const { data } = await api.get('/admin/vaults');
      setVaultBalances({
        custodyPool: data.custodyPool || 0,
        escrowLocked: data.escrowLocked || 0,
        coldReserve: data.coldReserve || 0,
        payoutBank: data.payoutBank || 0,
        promoReserve: data.promoReserve || 0,
        totalPromoDeposited: data.totalPromoDeposited || 0,
        totalPromoDisbursed: data.totalPromoDisbursed || 0
      });
    } catch (error) {
      console.error('Error fetching vaults:', error);
    }
  };

  const fetchAirdropHistory = async () => {
    try {
      const { data } = await api.get('/admin/bonuses/airdrop/history');
      setAirdropHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching airdrop history:', error);
    }
  };



  const formatTxnTypeInfo = (rawType) => {
    const t = String(rawType || '').toUpperCase();
    if (t.includes('P2P') || t.includes('ESCROW') || t.includes('TRADE')) {
      return { label: 'P2P', className: 'p2p' };
    }
    if (t.includes('DEPOSIT')) {
      return { label: 'Deposit', className: 'deposit' };
    }
    if (t.includes('WITHDRAW')) {
      return { label: 'Withdraw', className: 'withdraw' };
    }
    if (t.includes('PAYOUT') || t.includes('SETTLEMENT') || t.includes('WON')) {
      return { label: 'Payout', className: 'payout' };
    }
    if (t.includes('POOL') || t.includes('JACKPOT')) {
      return { label: 'Pool', className: 'pool' };
    }
    if (t.includes('BONUS') || t.includes('PROMO') || t.includes('AIRDROP') || t.includes('REFERRAL')) {
      return { label: 'Reward', className: 'reward' };
    }
    if (t.includes('REFUND')) {
      return { label: 'Refund', className: 'default' };
    }
    return { label: t ? t.replace(/_/g, ' ') : 'P2P', className: 'default' };
  };

  const handleExportReport = () => {
    try {
      showToast('Preparing analytical report for download...', 'success');
      const headers = ['Transaction Hash', 'Type', 'User Name', 'Email', 'Phone', 'Amount', 'Time', 'Status'];
      const rows = transactions.map(t => [
        `"${t.hash || ''}"`,
        `"${formatTxnTypeInfo(t.type).label}"`,
        `"${t.userName || ''}"`,
        `"${t.userEmail || ''}"`,
        `"${t.userPhone || ''}"`,
        t.amount || 0,
        `"${t.time || ''}"`,
        `"${t.status || ''}"`
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

      const sessionUser = {
        _id: data._id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role
      };

      // Handle "Remember Me" session persistence
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('adminUser', JSON.stringify(sessionUser));
        localStorage.setItem('rememberedEmail', emailInput);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('adminUser');
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('adminUser', JSON.stringify(sessionUser));
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('rememberedEmail');
      }

      setAdminName((`${data.firstName || ''} ${data.lastName || ''}`).trim() || 'Admin');
      setAdminEmail(data.email || '');
      setAdminPhone(data.phone || '');

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
  const handleCreateTrade = async (e) => {
    e.preventDefault();
    if (!newPartyA || !newAmount) return;

    try {
      const amountNum = parseFloat(newAmount) || 0;
      await api.post('/admin/trades', {
        partyA: newPartyA,
        partyB: newPartyB,
        amount: amountNum,
        status: newStatus
      });

      showToast('Escrow trade created and persisted successfully.', 'success');
      setIsModalOpen(false);
      setNewPartyA('');
      setNewPartyB('');
      setNewAmount('');
      setNewStatus('SETTLED');
      setCurrentPage(1);

      await Promise.all([
        fetchTrades(),
        fetchDashboardStats(),
        fetchTransactions()
      ]);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create trade.', 'error');
    }
  };

  // Handle Changing Trade Status
  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      await api.post('/admin/trades/status', { tradeId: id, status: nextStatus });
      showToast(`Trade status updated to ${nextStatus}`, 'success');
      fetchTrades();
      fetchDashboardStats();
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

  // Handle Deleting Trade with modern confirmation
  const handleDeleteTrade = (id) => {
    const shortId = typeof id === 'string' && id.length > 8 ? id.slice(-8) : id;
    openConfirmModal({
      title: 'Delete Trade Record',
      message: `Are you sure you want to permanently delete trade record #${shortId} from the compliance ledger? This action cannot be reversed.`,
      confirmText: 'Delete Record',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/trades/${id}`);
          showToast('Trade record removed from registry.', 'success');
          setActiveMenuId(null);
          await Promise.all([fetchTrades(), fetchDashboardStats()]);
          logSecurityEvent('warning', `Trade record ${id} was purged from compliance tables`, `Operator: ${adminName}`, 'shield');
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to delete trade.', 'error');
        }
      }
    });
  };

  // Handle Change Password Form
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast('Please complete all password fields.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }
    if (oldPassword === newPassword) {
      showToast('New password cannot be the same as current password.', 'error');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api.post('/admin/change-password', {
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim()
      });
      showToast(res.data?.message || 'Administrative credentials updated successfully.', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      logSecurityEvent('success', 'Admin account password updated', `Operator: ${adminName}`, 'key');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update credentials. Please check current password.', 'error');
    } finally {
      setIsChangingPassword(false);
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
      const { data } = await api.post('/admin/profile', {
        name: editName,
        firstName: names[0],
        lastName: names.slice(1).join(' '),
        email: editEmail,
        phone: editPhone,
        avatar: editAvatar,
        profileImage: editAvatar
      });
      setAdminName(editName);
      setAdminEmail(editEmail);
      setAdminPhone(editPhone);
      setAdminAvatar(editAvatar);
      try {
        const stored = JSON.parse(localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser') || '{}');
        const updated = { ...stored, firstName: names[0], lastName: names.slice(1).join(' '), email: editEmail, phone: editPhone, profileImage: editAvatar };
        if (localStorage.getItem('adminUser')) localStorage.setItem('adminUser', JSON.stringify(updated));
        if (sessionStorage.getItem('adminUser')) sessionStorage.setItem('adminUser', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
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

  // Handle saving payment gateway settings (Only VTStack & Flutterwave)
  const handleSaveGatewaySettings = async (e) => {
    if (e) e.preventDefault();
    try {
      const chosenGateway = activeGateway === 'flutterwave' ? 'flutterwave' : 'vtstack';
      await api.post('/admin/settings', {
        activePaymentGateway: chosenGateway,
        flutterwavePublicKey,
        flutterwaveSecretKey,
        flutterwaveSecretHash,
        vtstackApiKey,
        vtstackPayoutKey,
        vtstackWebhookSecret,
        gatewayMode,
        autoWithdrawalApproval,
      });
      showToast(`Payment Gateway set to ${chosenGateway.toUpperCase()} (${gatewayMode} mode)`, 'success');
      logSecurityEvent('warning', `Payment gateway provider updated to ${chosenGateway} (${gatewayMode})`, `Authorized by ${adminName}`, 'key');
    } catch (error) {
      showToast('Failed to save payment gateway settings.', 'error');
    }
  };

  // Handle saving external API keys (Football API, TheSportsDB, Odds, RapidAPI, Gemini)
  const handleSaveApiSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSavingApis(true);
    try {
      const res = await api.post('/admin/settings', {
        footballApiKey: footballApiKey.trim(),
        theSportsDbApiKey: theSportsDbApiKey.trim(),
        oddsApiKey: oddsApiKey.trim(),
        rapidApiKey: rapidApiKey.trim(),
        geminiApiKey: geminiApiKey.trim(),
      });
      if (res.data) {
        setHasEnvFootballApiKey(Boolean(res.data.hasEnvFootballApiKey));
        setEnvFootballApiKeyMasked(res.data.envFootballApiKeyMasked || '');
      }
      showToast('External sports & data API credentials updated successfully!', 'success');
      logSecurityEvent('info', 'Sports and External API keys updated', `Authorized by ${adminName}`, 'key');
    } catch (error) {
      showToast('Failed to save API credentials.', 'error');
    } finally {
      setIsSavingApis(false);
    }
  };

  // Test API-Football connection & key validity
  const handleTestFootballApi = async () => {
    setIsTestingFootballApi(true);
    setFootballApiStatus(null);
    try {
      const res = await api.post('/admin/settings/test-football-api', {
        apiKey: footballApiKey.trim(),
      });
      setFootballApiStatus(res.data);
      showToast(res.data.message || 'API-Football verified successfully!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to verify API-Football key.';
      setFootballApiStatus({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setIsTestingFootballApi(false);
    }
  };

  // Trigger immediate match & fixture synchronization
  const handleSyncMatchesNow = async () => {
    setIsSyncingMatches(true);
    try {
      const res = await api.post('/matches/sync');
      showToast(res.data?.message || 'Football fixtures synchronized successfully!', 'success');
      logSecurityEvent('info', 'Live football fixtures synced from provider', `Authorized by ${adminName}`, 'refresh-cw');
      fetchMatches();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to sync fixtures from provider.', 'error');
    } finally {
      setIsSyncingMatches(false);
    }
  };

  // Handle toggling platform maintenance mode
  const handleToggleMaintenance = async () => {
    const nextVal = !maintenanceMode;
    try {
      await api.post('/admin/settings', {
        maintenanceMode: nextVal
      });
      setMaintenanceMode(nextVal);
      showToast(
        nextVal ? 'Platform placed into Maintenance Mode (Trading halted)' : 'Platform restored to Live Operational Mode',
        nextVal ? 'warning' : 'success'
      );
      logSecurityEvent(
        nextVal ? 'alert' : 'info',
        `Maintenance mode ${nextVal ? 'activated' : 'deactivated'}`,
        `Authorized by ${adminName}`,
        'sliders'
      );
    } catch (err) {
      showToast('Failed to update maintenance mode status.', 'error');
    }
  };

  // Credit User Modal Handlers
  const handleOpenCreditModal = (user) => {
    setCreditTargetUser(user);
    setCreditAmountInput('');
    setCreditNoteInput('');
    setIsCreditModalOpen(true);
  };

  const handleExecuteCredit = async (e) => {
    if (e) e.preventDefault();
    const amount = Number(creditAmountInput);
    if (!creditTargetUser || isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid credit amount.', 'error');
      return;
    }

    setIsSubmittingCredit(true);
    try {
      await api.post('/admin/users/credit', {
        userId: creditTargetUser.id,
        amount: amount,
        description: creditNoteInput.trim() || `Manual wallet credit by ${adminName}`
      });
      showToast(`Successfully credited ₦${amount.toLocaleString()} to ${creditTargetUser.name}!`, 'success');
      logSecurityEvent('success', `Manual balance credit: ₦${amount.toLocaleString()} added to ${creditTargetUser.name}`, `Authorized by ${adminName}`, 'wallet');
      setIsCreditModalOpen(false);
      setCreditTargetUser(null);
      fetchUsers();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to credit user account.', 'error');
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  // Reset New Trade form
  const resetTradeForm = () => {
    setTradeTitle('');
    setTradeCategory('Entertainment');
    setTradeSubcategory('Spotify & Music');
    setTradeMarketType('YES_NO');
    setTradeYesOdds('1.85');
    setTradeNoOdds('1.95');
    setTradeOptions([
      { id: 'opt_1', label: 'Drake', odds: '2.40' },
      { id: 'opt_2', label: 'Taylor Swift', odds: '1.95' },
      { id: 'opt_3', label: 'The Weeknd', odds: '3.10' },
    ]);
    setTradeRules('');
    setTradeResolutionSource('');
    setTradePoolAmount('500000');
    setTradeClosingHours('24');
    setTradePublishNow(true);
  };

  // Pre-load preset trade templates (including exact user requested examples!)
  const applyTradePreset = (presetKey) => {
    if (presetKey === 'justin_streams') {
      setTradeTitle('Will Justin Bieber get 50M streams today yes or no');
      setTradeCategory('Entertainment');
      setTradeSubcategory('Spotify & Music');
      setTradeMarketType('YES_NO');
      setTradeYesOdds('1.85');
      setTradeNoOdds('1.95');
      setTradeRules('Resolves to YES if Justin Bieber surpasses 50,000,000 official daily streams on Spotify for Artists / Spotify Charts on the settlement date. Otherwise resolves to NO.');
      setTradeResolutionSource('Official Spotify Charts & Artist Portal');
      setTradePoolAmount('800000');
      setTradeClosingHours('18');
    } else if (presetKey === 'justin_grammy') {
      setTradeTitle('Will Justin win a Grammy this year yes or no');
      setTradeCategory('Entertainment');
      setTradeSubcategory('Awards & Grammys');
      setTradeMarketType('YES_NO');
      setTradeYesOdds('2.35');
      setTradeNoOdds('1.58');
      setTradeRules('Resolves to YES if Justin Bieber is announced as a Grammy winner in any category at the annual Grammy Awards ceremony. Otherwise resolves to NO.');
      setTradeResolutionSource('Recording Academy (grammy.com)');
      setTradePoolAmount('1500000');
      setTradeClosingHours('72');
    } else if (presetKey === 'movie_budget') {
      setTradeTitle('Will a certain movie pass its initial budget yes or no');
      setTradeCategory('Entertainment');
      setTradeSubcategory('Movies & Box Office');
      setTradeMarketType('YES_NO');
      setTradeYesOdds('1.68');
      setTradeNoOdds('2.15');
      setTradeRules('Resolves to YES if the movie passes its officially reported initial production budget in worldwide box office ticket sales within 30 days of theatrical premiere.');
      setTradeResolutionSource('Box Office Mojo / Variety Box Office Tracking');
      setTradePoolAmount('1200000');
      setTradeClosingHours('48');
    } else if (presetKey === 'spotify_most') {
      setTradeTitle('Who will get the most streams on Spotify');
      setTradeCategory('Entertainment');
      setTradeSubcategory('Spotify & Music');
      setTradeMarketType('MULTIPLE_CHOICE');
      setTradeOptions([
        { id: 'drake', label: 'Drake', odds: '2.30' },
        { id: 'taylor_swift', label: 'Taylor Swift', odds: '1.95' },
        { id: 'the_weeknd', label: 'The Weeknd', odds: '3.10' },
        { id: 'justin_bieber', label: 'Justin Bieber', odds: '4.20' },
        { id: 'bad_bunny', label: 'Bad Bunny', odds: '3.60' },
      ]);
      setTradeRules('Resolves to whichever artist has the highest total official stream count on the Spotify Global Weekly Charts at the end of the current tracking week.');
      setTradeResolutionSource('Spotify Global Weekly Charts (charts.spotify.com)');
      setTradePoolAmount('4200000');
      setTradeClosingHours('72');
    } else if (presetKey === 'politics_fed') {
      setTradeTitle('Will the US Federal Reserve cut interest rates at the next FOMC meeting?');
      setTradeCategory('Politics');
      setTradeSubcategory('Policy & Economy');
      setTradeMarketType('YES_NO');
      setTradeYesOdds('1.72');
      setTradeNoOdds('2.10');
      setTradeRules('Resolves to YES if the Federal Reserve announces a cut of at least 25 bps to the federal funds target rate following the upcoming FOMC meeting.');
      setTradeResolutionSource('Federal Reserve Board Official Statement');
      setTradePoolAmount('3100000');
      setTradeClosingHours('60');
    } else if (presetKey === 'politics_election') {
      setTradeTitle('Will the presidential election result be officially certified without objection?');
      setTradeCategory('Politics');
      setTradeSubcategory('Elections');
      setTradeMarketType('YES_NO');
      setTradeYesOdds('1.45');
      setTradeNoOdds('2.70');
      setTradeRules('Resolves to YES if Congress certifies the electoral vote tally without any sustained written objections from members of both houses.');
      setTradeResolutionSource('US Congressional Record / Associated Press');
      setTradePoolAmount('2100000');
      setTradeClosingHours('140');
    } else if (presetKey === 'spacex_orbital') {
      setTradeTitle('Will SpaceX Starship successfully complete full orbital catch & recovery test in Q4?');
      setTradeCategory('Live Event Prediction');
      setTradeSubcategory('Space & Tech');
      setTradeMarketType('YES_NO');
      setTradeYesOdds('1.88');
      setTradeNoOdds('1.92');
      setTradeRules('Resolves to YES if SpaceX successfully soft-lands or catches the Starship upper stage or Super Heavy booster during an orbital flight test mission.');
      setTradeResolutionSource('SpaceX Official Mission Broadcast');
      setTradePoolAmount('1670000');
      setTradeClosingHours('96');
    } else if (presetKey === 'gta_revenue') {
      setTradeTitle('Will GTA VI break the worldwide gaming revenue record ($1B in 24 hours) upon release?');
      setTradeCategory('Live Event Prediction');
      setTradeSubcategory('Pop Culture');
      setTradeMarketType('YES_NO');
      setTradeYesOdds('1.35');
      setTradeNoOdds('3.20');
      setTradeRules('Resolves to YES if Take-Two Interactive or Guinness World Records verifies that Grand Theft Auto VI generates $1 Billion or more in revenue in its first 24 hours of retail release.');
      setTradeResolutionSource('Take-Two Interactive SEC Filing / Official Press Release');
      setTradePoolAmount('4150000');
      setTradeClosingHours('120');
    }
  };

  // Handle Backdoor Manual Trade Creation
  const handleCreateMarket = async (e) => {
    e.preventDefault();
    if (!tradeTitle.trim()) {
      showToast('Please enter a trade question / title.', 'error');
      return;
    }

    let finalOptions = [];
    if (tradeMarketType === 'YES_NO') {
      const yesNum = parseFloat(tradeYesOdds) || 1.85;
      const noNum = parseFloat(tradeNoOdds) || 1.95;
      finalOptions = [
        { id: 'yes', label: 'Yes', odds: yesNum, totalStaked: 0 },
        { id: 'no', label: 'No', odds: noNum, totalStaked: 0 },
      ];
    } else {
      finalOptions = tradeOptions.map((opt, i) => ({
        id: opt.id ? `${opt.id}_${i}` : `opt_${i + 1}_${Date.now()}`,
        label: opt.label,
        odds: parseFloat(opt.odds) || 2.0,
        totalStaked: 0,
      }));
    }

    const hours = parseFloat(tradeClosingHours) || 24;
    const closingDate = new Date(Date.now() + hours * 60 * 60 * 1000);
    const poolVal = parseFloat(tradePoolAmount) || 0;

    try {
      await api.post('/admin/markets', {
        title: tradeTitle.trim(),
        pair: tradeTitle.trim(),
        category: tradeCategory,
        subcategory: tradeSubcategory.trim() || 'General',
        marketType: tradeMarketType,
        options: finalOptions,
        rules: tradeRules.trim(),
        resolutionSource: tradeResolutionSource.trim(),
        poolAmount: poolVal,
        closingDate,
        status: tradePublishNow ? 'ACTIVE' : 'DRAFT',
        isBackdoorManual: true,
      });

      showToast(
        tradePublishNow
          ? `Market "${tradeTitle.trim()}" published live to user market!`
          : `Backdoor trade "${tradeTitle.trim()}" created as private DRAFT.`,
        'success'
      );
      setIsMarketModalOpen(false);
      resetTradeForm();
      fetchMarkets();

      logSecurityEvent(
        'success',
        `Backdoor market initialized: ${tradeTitle.trim()} [${tradeCategory} • ${tradeSubcategory}]`,
        `Operator: ${adminName} • Status: ${tradePublishNow ? 'LIVE' : 'DRAFT'}`,
        'trending-up'
      );
    } catch (error) {
      console.error('Error creating market:', error);
      showToast(error.response?.data?.message || 'Failed to create manual trade.', 'error');
    }
  };

  // Handle Toggle Publish Market (from Backdoor DRAFT to Live Market & vice versa)
  const handleTogglePublish = async (marketId) => {
    try {
      const res = await api.post(`/admin/markets/${marketId}/publish`);
      showToast(res.data?.message || 'Market publication status updated.', 'success');
      fetchMarkets();
      logSecurityEvent(
        'info',
        `Market ID ${marketId} publication status toggled`,
        `Authorized: ${adminName}`,
        'shield'
      );
    } catch (error) {
      showToast('Failed to update publication status.', 'error');
    }
  };

  // Handle Toggle Admin Market Overpower Lock (Specific Contract or All)
  const handleToggleMarketLock = async (marketId, currentLocked, contract = null) => {
    try {
      const res = await api.post(`/admin/markets/${marketId}/lock`, {
        contract: contract || undefined,
        isLocked: !currentLocked,
        reason: !currentLocked ? `Locked by admin: contract ${contract || 'all'} overpowered` : '',
      });
      showToast(res.data?.message || (!currentLocked ? `Contract ${contract || 'market'} locked.` : `Contract ${contract || 'market'} unlocked.`), 'success');
      fetchMarkets();
      logSecurityEvent(
        'warning',
        `Market ID ${marketId} Contract ${contract || 'ALL'} ${!currentLocked ? 'LOCKED' : 'UNLOCKED'}`,
        `Authorized: ${adminName}`,
        'shield'
      );
    } catch (error) {
      console.error('Error toggling market lock:', error);
      showToast(error.response?.data?.message || 'Failed to update market lock.', 'error');
    }
  };

  // Handle Toggle Admin Match Overpower Lock (Specific Contract or All)
  const handleToggleMatchLock = async (matchId, currentLocked, contract = null) => {
    try {
      const res = await api.post(`/admin/matches/${matchId}/lock`, {
        contract: contract || undefined,
        isLocked: !currentLocked,
        reason: !currentLocked ? `Locked by admin: contract ${contract || 'all'} overpowered` : '',
      });
      showToast(res.data?.message || (!currentLocked ? `Contract ${contract || 'match'} locked.` : `Contract ${contract || 'match'} unlocked.`), 'success');
      fetchMatches();
      logSecurityEvent(
        'warning',
        `Match ID ${matchId} Contract ${contract || 'ALL'} ${!currentLocked ? 'LOCKED' : 'UNLOCKED'}`,
        `Authorized: ${adminName}`,
        'shield'
      );
    } catch (error) {
      console.error('Error toggling match lock:', error);
      showToast(error.response?.data?.message || 'Failed to update match lock.', 'error');
    }
  };

  // Open Resolution Modal
  const handleOpenResolveModal = (market) => {
    setResolvingMarket(market);
    if (market.marketType === 'YES_NO') {
      setSelectedWinningOption('yes');
    } else if (market.options && market.options.length > 0) {
      setSelectedWinningOption(market.options[0].label || market.options[0].id);
    }
    setIsResolveModalOpen(true);
  };

  // Confirm Settlement and payout users
  const handleConfirmResolve = async () => {
    if (!resolvingMarket) return;
    try {
      const res = await api.post(`/admin/markets/${resolvingMarket._id}/resolve`, {
        winningOption: selectedWinningOption,
      });
      showToast(res.data?.message || 'Market resolved and winners paid out!', 'success');
      setIsResolveModalOpen(false);
      setResolvingMarket(null);
      fetchMarkets();
      fetchDashboardStats();
      fetchTransactions();
      logSecurityEvent(
        'success',
        `Market "${resolvingMarket.title}" resolved with winner: "${selectedWinningOption}"`,
        `Payouts distributed by ${adminName}`,
        'check-circle'
      );
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to resolve market.', 'error');
    }
  };

  // Void market and refund stakes with modern confirmation
  const handleVoidMarket = (marketId, marketTitle) => {
    openConfirmModal({
      title: 'Void Market & Refund Stakes',
      message: `Are you sure you want to void "${marketTitle || 'this market'}"? All user escrow stakes will be refunded in full immediately.`,
      confirmText: 'Void & Refund',
      type: 'warning',
      onConfirm: async () => {
        try {
          const res = await api.post(`/admin/markets/${marketId}/void`);
          showToast(res.data?.message || 'Market voided and stakes refunded.', 'success');
          fetchMarkets();
          fetchDashboardStats();
          logSecurityEvent(
            'warning',
            `Market "${marketTitle}" was VOIDED and user stakes refunded`,
            `Authorized: ${adminName}`,
            'alert-triangle'
          );
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to void market.', 'error');
        }
      }
    });
  };

  // Delete market with modern confirmation
  const handleDeleteMarket = (marketId, marketTitle) => {
    openConfirmModal({
      title: 'Delete Market Trade',
      message: `Are you sure you want to permanently delete "${marketTitle || 'this trade'}" from the system registry? This action cannot be undone.`,
      confirmText: 'Delete Market',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/markets/${marketId}`);
          showToast('Market deleted successfully.', 'success');
          fetchMarkets();
          logSecurityEvent(
            'warning',
            `Market "${marketTitle}" deleted from system registry`,
            `Operator: ${adminName}`,
            'trash'
          );
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to delete market.', 'error');
        }
      }
    });
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

  // Deposit real marketing funds into Promo Vault
  const handleDepositPromo = async (e) => {
    if (e) e.preventDefault();
    const amountVal = parseFloat(promoDepositAmount) || 0;
    if (amountVal <= 0) {
      showToast('Please enter a valid deposit amount.', 'error');
      return;
    }
    setIsDepositingPromo(true);
    try {
      const res = await api.post('/admin/vaults/deposit-promo', {
        amount: amountVal,
        note: promoDepositNote || 'Promotional marketing liquidity top-up'
      });
      setPromoDepositAmount('');
      setPromoDepositNote('');
      setShowPromoDepositModal(false);
      await fetchVaults();
      showToast(`Successfully deposited ₦${amountVal.toLocaleString()} to Promo Vault!`, 'success');
      logSecurityEvent('success', `Promo Vault Liquidity Inflow: +₦${amountVal.toLocaleString()} deposited`, `Authorized by ${adminName}`, 'shield');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to deposit to Promo Vault.', 'error');
    } finally {
      setIsDepositingPromo(false);
    }
  };

  // Dispatch community airdrop bonuses
  const handleLaunchAirdrop = async (e) => {
    if (e) e.preventDefault();
    const amountVal = parseFloat(airdropAmount) || 0;
    if (amountVal <= 0) {
      showToast('Please enter a valid bonus amount per user.', 'error');
      return;
    }
    const countVal = parseInt(airdropCount) || 25;

    setIsLaunchingAirdrop(true);
    try {
      const res = await api.post('/admin/bonuses/airdrop', {
        campaignName: airdropCampaign || 'Surprise Community Airdrop',
        targetAudience: airdropAudience,
        amountPerUser: amountVal,
        count: countVal,
        note: airdropNote
      });
      showToast(res.data?.message || 'Airdrop bonus executed successfully!', 'success');
      setAirdropCampaign('');
      setAirdropNote('');
      await Promise.all([fetchVaults(), fetchAirdropHistory()]);
      logSecurityEvent('success', `Airdrop Executed: ${res.data?.airdropLog?.campaignName} disbursed ₦${(res.data?.airdropLog?.totalDistributed || 0).toLocaleString()} to ${res.data?.airdropLog?.recipientCount} users`, `Authorized by ${adminName}`, 'shield');
    } catch (error) {
      showToast(error.response?.data?.message || 'Airdrop failed.', 'error');
    } finally {
      setIsLaunchingAirdrop(false);
    }
  };

  // Handle notification actions
  const handleMarkAllRead = async () => {
    try {
      await api.post('/admin/notifications/mark-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read.');
      logSecurityEvent('success', `All system notifications marked as READ`, 'Operator Authorization', 'login');
    } catch (error) {
      showToast('Failed to mark notifications read.', 'error');
    }
  };

  const handleDismissNotification = async (id) => {
    try {
      await api.delete(`/admin/notifications/${id}`);
      setNotifications(notifications.filter(n => (n._id || n.id) !== id));
      showToast('Notification dismissed.');
    } catch (error) {
      setNotifications(notifications.filter(n => (n._id || n.id) !== id));
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await api.post(`/admin/notifications/${id}/read`);
      setNotifications(notifications.map(n => (n._id || n.id) === id ? { ...n, read: true } : n));
    } catch (error) {
      setNotifications(notifications.map(n => (n._id || n.id) === id ? { ...n, read: true } : n));
    }
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

  // Handle permanently deleting user account with modern confirmation
  const handleDeleteUser = (userId, userName) => {
    openConfirmModal({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user "${userName || 'User'}"? All associated wallet balances, trades, and identification records will be permanently purged from the database. This action cannot be undone.`,
      confirmText: 'Delete User',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          showToast(`User "${userName || 'account'}" deleted successfully.`, 'success');
          setKycUsers(prev => prev.filter(u => u.id !== userId));
          setUserBalances(prev => prev.filter(u => u.id !== userId));
          if (selectedKycUser?.id === userId) {
            setSelectedKycUser(null);
          }
          logSecurityEvent(
            'warning',
            `User account ${userName} (${userId}) was permanently deleted by admin`,
            'Operator Authorization',
            'warning'
          );
        } catch (error) {
          console.error('Error deleting user:', error);
          showToast(error.response?.data?.message || 'Failed to delete user account.', 'error');
        }
      }
    });
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
      const q = (searchQuery || txnSearchQuery).toLowerCase().trim();
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
  }, [transactions, txnSearchQuery, searchQuery, txnStatusFilter]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalTxnPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;

  // Filtered Prediction Markets & Backdoor Trades calculation
  const filteredAdminMarkets = useMemo(() => {
    return markets.filter((m) => {
      // 1. Category Filter
      const catLower = marketCategoryFilter.toLowerCase();
      const mCatLower = (m.category || '').toLowerCase();
      const matchesCategory =
        marketCategoryFilter === 'ALL' ||
        mCatLower === catLower ||
        (marketCategoryFilter === 'Live Event Prediction' && (mCatLower.includes('real life') || mCatLower.includes('live event') || mCatLower.includes('pop culture'))) ||
        (marketCategoryFilter === 'Football' && (mCatLower.includes('football') || mCatLower.includes('soccer'))) ||
        (marketCategoryFilter === 'Boxing' && (mCatLower.includes('boxing') || mCatLower.includes('ufc & boxing'))) ||
        (marketCategoryFilter === 'UFC' && (mCatLower.includes('ufc') || mCatLower.includes('ufc & boxing'))) ||
        (marketCategoryFilter === 'Basketball' && (mCatLower.includes('basket') || mCatLower.includes('nba')));

      // 2. Status Filter
      let matchesStatus = true;
      if (marketStatusFilter === 'LOCKED') {
        matchesStatus = Boolean(m.isLocked || m.isOverpowered || m.status === 'SUSPENDED');
      } else if (marketStatusFilter !== 'ALL') {
        matchesStatus = m.status && m.status.toUpperCase() === marketStatusFilter.toUpperCase();
      }

      // 3. Search query (header search or local market search)
      const q = (searchQuery || marketSearchText).toLowerCase().trim();
      const matchesSearch =
        !q ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.subcategory && m.subcategory.toLowerCase().includes(q)) ||
        (m.rules && m.rules.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [markets, marketCategoryFilter, marketStatusFilter, marketSearchText, searchQuery]);

  // Filtered Sports Matches calculation
  const filteredAdminMatches = useMemo(() => {
    return matches.filter((match) => {
      const q = (searchQuery || marketSearchText).toLowerCase().trim();
      const matchesSearch =
        !q ||
        (match.homeTeam && match.homeTeam.toLowerCase().includes(q)) ||
        (match.awayTeam && match.awayTeam.toLowerCase().includes(q)) ||
        (match.sport && match.sport.toLowerCase().includes(q)) ||
        (match.league && match.league.toLowerCase().includes(q)) ||
        (match.leagueName && match.leagueName.toLowerCase().includes(q));

      let matchesStatus = true;
      if (marketStatusFilter === 'LOCKED') {
        matchesStatus = Boolean(match.isLocked || match.isOverpowered || match.status === 'SUSPENDED');
      } else if (marketStatusFilter !== 'ALL') {
        matchesStatus = match.status && match.status.toUpperCase() === marketStatusFilter.toUpperCase();
      }

      return matchesSearch && matchesStatus;
    });
  }, [matches, marketSearchText, searchQuery, marketStatusFilter]);

  // Log out administrative session
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('adminUser');
    setIsLoggedIn(false);
    setIsSidebarOpen(false);
    showToast('Logged out of admin terminal successfully.', 'info');
  };

  // Filtered and searched records with date-range support
  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return trades.filter((trade) => {
      // 1. Status Filter
      const matchesStatus =
        statusFilter === 'ALL' || trade.status === statusFilter;

      // 2. Date Range Filter
      let matchesDate = true;
      if (dateRange !== 'ALL' && trade.rawCreatedAt) {
        const tradeTime = new Date(trade.rawCreatedAt).getTime();
        if (dateRange === 'Today') {
          matchesDate = tradeTime >= startOfToday.getTime();
        } else if (dateRange === '7D') {
          matchesDate = tradeTime >= now - 7 * 24 * 60 * 60 * 1000;
        } else if (dateRange === '30D') {
          matchesDate = tradeTime >= now - 30 * 24 * 60 * 60 * 1000;
        }
      }

      // 3. Search query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        trade.id.toLowerCase().includes(q) ||
        trade.partyA.toLowerCase().includes(q) ||
        trade.partyB.toLowerCase().includes(q) ||
        (trade.asset && trade.asset.toLowerCase().includes(q)) ||
        trade.status.toLowerCase().includes(q) ||
        String(trade.amount).includes(q);

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [trades, searchQuery, statusFilter, dateRange]);

  // Filtered and searched KYC users
  const filteredKycUsers = useMemo(() => {
    return kycUsers.filter(user => {
      const q = (searchQuery || kycSearchQuery).toLowerCase().trim();
      const matchesSearch =
        !q ||
        (user.name || '').toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q) ||
        (user.phone || '').includes(q) ||
        (user.documentNumber || '').toLowerCase().includes(q) ||
        (user.status || '').toLowerCase().includes(q);
      const matchesFilter = kycStatusFilter === 'ALL' || user.status === kycStatusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [kycUsers, kycSearchQuery, searchQuery, kycStatusFilter]);

  // Security audit stats computation
  const securityStats = useMemo(() => {
    const total = auditLogs.length;
    const warnings = auditLogs.filter(l => l.type === 'warning' || l.type === 'danger').length;
    const successful = auditLogs.filter(l => l.type === 'success').length;
    const system = Math.max(0, total - warnings - successful);
    return { total, warnings, successful, system };
  }, [auditLogs]);

  // Filtered security logs
  const filteredAuditLogs = useMemo(() => {
    if (!searchQuery.trim()) return auditLogs;
    const q = searchQuery.toLowerCase().trim();
    return auditLogs.filter(log =>
      (log.text || '').toLowerCase().includes(q) ||
      (log.meta || '').toLowerCase().includes(q) ||
      (log.type || '').toLowerCase().includes(q)
    );
  }, [auditLogs, searchQuery]);

  const filteredSecurityLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (securityCategory === 'warnings' && log.type !== 'warning' && log.type !== 'danger') return false;
      if (securityCategory === 'success' && log.type !== 'success') return false;
      if (securityCategory === 'system' && (log.type === 'warning' || log.type === 'danger' || log.type === 'success')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (log.text || '').toLowerCase().includes(q) ||
          (log.meta || '').toLowerCase().includes(q) ||
          (log.type || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [auditLogs, securityCategory, searchQuery]);

  const totalSecurityPages = Math.max(1, Math.ceil(filteredSecurityLogs.length / securityPerPage));

  const paginatedSecurityLogs = useMemo(() => {
    const startIndex = (securityPage - 1) * securityPerPage;
    return filteredSecurityLogs.slice(startIndex, startIndex + securityPerPage);
  }, [filteredSecurityLogs, securityPage, securityPerPage]);

  useEffect(() => {
    setSecurityPage(1);
  }, [securityCategory, searchQuery]);

  // Notification stats
  const notifStats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const security = notifications.filter(n => n.category === 'SECURITY' || n.type === 'security').length;
    const operations = notifications.filter(n => n.category === 'OPERATIONS' || n.type === 'operations' || n.category === 'KYC' || n.type === 'kyc').length;
    return { total, unread, security, operations };
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (notifCategory === 'unread' && n.read) return false;
      if (notifCategory === 'security' && n.category !== 'SECURITY' && n.type !== 'security') return false;
      if (notifCategory === 'operations' && n.category !== 'OPERATIONS' && n.type !== 'operations' && n.category !== 'KYC' && n.type !== 'kyc') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (n.title || '').toLowerCase().includes(q) ||
          (n.desc || '').toLowerCase().includes(q) ||
          (n.type || '').toLowerCase().includes(q) ||
          (n.category || '').toLowerCase().includes(q) ||
          (n.user?.email || '').toLowerCase().includes(q) ||
          (n.user?.firstName || '').toLowerCase().includes(q) ||
          (n.user?.lastName || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [notifications, notifCategory, searchQuery]);

  const totalNotifPages = Math.max(1, Math.ceil(filteredNotifications.length / notifPerPage));

  const paginatedNotifications = useMemo(() => {
    const startIndex = (notifPage - 1) * notifPerPage;
    return filteredNotifications.slice(startIndex, startIndex + notifPerPage);
  }, [filteredNotifications, notifPage, notifPerPage]);

  useEffect(() => {
    setNotifPage(1);
  }, [notifCategory, searchQuery]);

  // Filtered user portfolio balances
  const filteredUserBalances = useMemo(() => {
    if (!searchQuery.trim()) return userBalances;
    const q = searchQuery.toLowerCase().trim();
    return userBalances.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.status || '').toLowerCase().includes(q)
    );
  }, [userBalances, searchQuery]);

  const filteredAirdropHistory = useMemo(() => {
    if (!searchQuery.trim()) return airdropHistory;
    const q = searchQuery.toLowerCase().trim();
    return airdropHistory.filter(h =>
      (h.campaignName || '').toLowerCase().includes(q) ||
      (h.targetAudience || '').toLowerCase().includes(q) ||
      (h.executedBy || '').toLowerCase().includes(q)
    );
  }, [airdropHistory, searchQuery]);

  const paginatedUserBalances = useMemo(() => {
    const startIndex = (vaultBalancesPage - 1) * vaultPerPage;
    return filteredUserBalances.slice(startIndex, startIndex + vaultPerPage);
  }, [filteredUserBalances, vaultBalancesPage]);

  const totalVaultBalancePages = Math.max(1, Math.ceil(filteredUserBalances.length / vaultPerPage));

  const paginatedAirdropHistory = useMemo(() => {
    const startIndex = (vaultAirdropPage - 1) * vaultPerPage;
    return filteredAirdropHistory.slice(startIndex, startIndex + vaultPerPage);
  }, [filteredAirdropHistory, vaultAirdropPage]);

  const totalVaultAirdropPages = Math.max(1, Math.ceil(filteredAirdropHistory.length / vaultPerPage));

  useEffect(() => {
    setVaultBalancesPage(1);
    setVaultAirdropPage(1);
  }, [searchQuery]);

  // Referral Helpers for extracting populated or raw user details safely
  const getReferrerInfo = (ref) => {
    if (ref.referrer && typeof ref.referrer === 'object') {
      const name = `${ref.referrer.firstName || ''} ${ref.referrer.lastName || ''}`.trim() || ref.referrer.email || 'Trader';
      return {
        name,
        email: ref.referrer.email || '',
        code: ref.referrer.referralCode || ref.referralCode || '—'
      };
    }
    return {
      name: ref.referrerName || ref.referrerEmail || 'Trader',
      email: ref.referrerEmail || '',
      code: ref.referralCode || '—'
    };
  };

  const getRefereeInfo = (ref) => {
    if (ref.referee && typeof ref.referee === 'object') {
      const name = `${ref.referee.firstName || ''} ${ref.referee.lastName || ''}`.trim() || ref.referee.email || 'New User';
      return {
        name,
        email: ref.referee.email || ''
      };
    }
    return {
      name: ref.refereeName || ref.refereeEmail || 'New User',
      email: ref.refereeEmail || ''
    };
  };

  const getTopReferrerInfo = (r) => {
    const name = `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.name || r.email || 'Trader';
    return {
      name,
      email: r.email || '',
      code: r.referralCode || '—',
      count: r.referralCount || 0,
      earnings: r.referralEarnings || 0
    };
  };

  const getWinShareInfo = (ws) => {
    if (ws.user && typeof ws.user === 'object') {
      const name = `${ws.user.firstName || ''} ${ws.user.lastName || ''}`.trim() || ws.user.email || 'Trader';
      return {
        name,
        email: ws.user.email || '',
        code: ws.user.referralCode || '—'
      };
    }
    return {
      name: ws.userName || ws.userEmail || 'Trader',
      email: ws.userEmail || '',
      code: '—'
    };
  };

  // Filtered referrals by search query
  const filteredAllReferrals = useMemo(() => {
    const list = referralStats.recentReferrals || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(r => {
      const refInfo = getReferrerInfo(r);
      const feeInfo = getRefereeInfo(r);
      return (
        refInfo.name.toLowerCase().includes(q) ||
        refInfo.email.toLowerCase().includes(q) ||
        refInfo.code.toLowerCase().includes(q) ||
        feeInfo.name.toLowerCase().includes(q) ||
        feeInfo.email.toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q)
      );
    });
  }, [referralStats.recentReferrals, searchQuery]);

  const filteredTopReferrers = useMemo(() => {
    const list = referralStats.topReferrers || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(r => {
      const info = getTopReferrerInfo(r);
      return (
        info.name.toLowerCase().includes(q) ||
        info.email.toLowerCase().includes(q) ||
        info.code.toLowerCase().includes(q)
      );
    });
  }, [referralStats.topReferrers, searchQuery]);

  const filteredRecentReferrals = useMemo(() => {
    return [...filteredAllReferrals].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [filteredAllReferrals]);

  const filteredWinShares = useMemo(() => {
    const list = referralStats.recentWinShares || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(ws => {
      const info = getWinShareInfo(ws);
      return (
        info.name.toLowerCase().includes(q) ||
        info.email.toLowerCase().includes(q) ||
        (ws.platform || '').toLowerCase().includes(q) ||
        (ws.tradeType || '').toLowerCase().includes(q)
      );
    });
  }, [referralStats.recentWinShares, searchQuery]);

  const activeReferralList = useMemo(() => {
    if (referralCategory === 'top') return filteredTopReferrers;
    if (referralCategory === 'recent') return filteredRecentReferrals;
    if (referralCategory === 'win_shares') return filteredWinShares;
    return filteredAllReferrals;
  }, [referralCategory, filteredTopReferrers, filteredRecentReferrals, filteredWinShares, filteredAllReferrals]);

  const totalReferralPages = Math.max(1, Math.ceil(activeReferralList.length / referralPerPage));

  const paginatedReferrals = useMemo(() => {
    const startIndex = (referralPage - 1) * referralPerPage;
    return activeReferralList.slice(startIndex, startIndex + referralPerPage);
  }, [activeReferralList, referralPage, referralPerPage]);

  useEffect(() => {
    setReferralPage(1);
  }, [referralCategory, searchQuery]);

  const userTotalPages = Math.max(1, Math.ceil(filteredKycUsers.length / userPerPage));

  const paginatedKycUsers = useMemo(() => {
    const startIndex = (userPage - 1) * userPerPage;
    return filteredKycUsers.slice(startIndex, startIndex + userPerPage);
  }, [filteredKycUsers, userPage, userPerPage]);

  useEffect(() => {
    setUserPage(1);
  }, [kycSearchQuery, kycStatusFilter]);

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
              <img src={logo} alt="Peeritrade Logo" className="login-logo-img" />
            </div>
            <h1 className="login-title">Peeritrade</h1>
            <span className="login-subtitle">Admin Access Portal</span>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-input-group">
              <label htmlFor="login-email">Username / Email</label>
              <input
                type="text"
                id="login-email"
                className="login-input"
                placeholder="peeritrade.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                autoComplete="username"
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
                  placeholder="Enter your access password"
                  style={{ width: '100%', paddingRight: '40px' }}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoComplete="current-password"
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

            <div className="login-options" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', marginBottom: '4px' }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#00D285', width: '16px', height: '16px' }}
              />
              <label htmlFor="remember-me" style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontWeight: '500', userSelect: 'none' }}>
                Remember me
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

  const sidebarNavSections = useMemo(() => [
    {
      group: 'Core Platform',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          description: 'Overview and vital metrics',
          badge: null,
          onClick: () => {
            setActiveTab('dashboard');
            setIsSidebarOpen(false);
          }
        },
        {
          id: 'markets',
          label: 'Live Markets',
          icon: TrendingUp,
          description: 'Markets and sports trading pairs',
          badge: activeMarketsCount > 0 ? { count: activeMarketsCount, variant: 'neutral' } : null,
          onClick: () => {
            setActiveTab('markets');
            setIsSidebarOpen(false);
          }
        },
        {
          id: 'transactions',
          label: 'Transactions',
          icon: ArrowLeftRight,
          description: 'Deposits, withdrawals, and ledger',
          badge: null,
          onClick: () => {
            setActiveTab('transactions');
            setIsSidebarOpen(false);
          }
        }
      ]
    },
    {
      group: 'Operations',
      items: [
        {
          id: 'users',
          label: 'Users & KYC',
          icon: Users,
          description: 'User accounts, credit, and verification',
          badge: pendingKycCount > 0 ? { count: pendingKycCount, variant: 'warning', label: `${pendingKycCount} pending` } : null,
          onClick: () => {
            setActiveTab('users');
            setCurrentPage(1);
            setIsSidebarOpen(false);
          }
        },
        {
          id: 'portfolio',
          label: 'Vaults & Reserves',
          icon: Briefcase,
          description: 'Treasury reserves, liquidity, and promos',
          badge: null,
          onClick: () => {
            setActiveTab('portfolio');
            setIsSidebarOpen(false);
          }
        },
        {
          id: 'referrals',
          label: 'Referrals',
          icon: Gift,
          description: 'Affiliate rewards and referral tree',
          badge: null,
          onClick: () => {
            setActiveTab('referrals');
            setIsSidebarOpen(false);
            fetchReferralStats();
          }
        }
      ]
    },
    {
      group: 'System & Security',
      items: [
        {
          id: 'security',
          label: 'Security Logs',
          icon: ShieldCheck,
          description: 'Audit logs and administrative access',
          badge: null,
          onClick: () => {
            setActiveTab('security');
            setIsSidebarOpen(false);
          }
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          description: 'Broadcast alerts and system notices',
          badge: unreadNotifCount > 0 ? { count: unreadNotifCount, variant: 'primary', label: `${unreadNotifCount} unread` } : null,
          onClick: () => {
            setActiveTab('notifications');
            setCurrentPage(1);
            setIsSidebarOpen(false);
          }
        },
        {
          id: 'settings',
          label: 'Platform Settings',
          icon: Settings,
          description: 'Gateways, fees, and system mode',
          badge: null,
          onClick: () => {
            setActiveTab('settings');
            setCurrentPage(1);
            setIsSidebarOpen(false);
          }
        }
      ]
    }
  ], [activeMarketsCount, pendingKycCount, unreadNotifCount]);

  return (
    <div className="admin-layout">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sticky Left Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isSidebarOpen ? 'open' : ''}`}>
        {/* Header Branding */}
        <div className="sidebar-header">
          <div
            className="sidebar-brand"
            onClick={isSidebarCollapsed ? toggleSidebarCollapse : undefined}
            title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Peeritrade Terminal"}
          >
            <div className="sidebar-logo-icon">
              <img src={logo} alt="Peeritrade Logo" />
            </div>
            {!isSidebarCollapsed && (
              <div className="logo-text-container">
                <span className="logo-title">PEERITRADE</span>
                <div className="logo-badge-row">
                  <span className="logo-status-dot" />
                  <span className="logo-subtitle">Terminal Pro</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button (Expanded mode) */}
          {!isSidebarCollapsed && (
            <button
              type="button"
              className="sidebar-collapse-toggle-btn"
              onClick={toggleSidebarCollapse}
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={15} />
            </button>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            title="Close sidebar"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Collapsed expand action button right under header */}
        {isSidebarCollapsed && (
          <div className="sidebar-collapsed-expand-wrap">
            <button
              type="button"
              className="sidebar-expand-action-btn"
              onClick={toggleSidebarCollapse}
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <nav className="sidebar-nav-container">
          {sidebarNavSections.map((section) => (
            <div key={section.group} className="sidebar-nav-group">
              <div className="sidebar-group-header">
                <span className="sidebar-group-title">{section.group}</span>
                <span className="sidebar-group-divider" />
              </div>

              <ul className="sidebar-menu">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id} className="sidebar-menu-item">
                      <button
                        type="button"
                        onClick={item.onClick}
                        className={`menu-item-btn ${isActive ? 'active' : ''}`}
                        title={isSidebarCollapsed ? (item.badge?.label ? `${item.label} (${item.badge.label})` : item.label) : item.description}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="menu-icon-wrap">
                          <Icon className="menu-icon" size={17} />
                          {isSidebarCollapsed && item.badge && (
                            <span className={`menu-icon-dot ${item.badge.variant}`} />
                          )}
                        </span>
                        
                        {!isSidebarCollapsed && (
                          <>
                            <span className="menu-label-text">{item.label}</span>
                            {item.badge && (
                              <span className={`nav-pill-badge ${item.badge.variant}`}>
                                {item.badge.count}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Admin Profile & Logout */}
        <div className="sidebar-footer">
          <div
            className={`sidebar-user-card ${activeTab === 'profile' ? 'active' : ''}`}
            title={isSidebarCollapsed ? `Admin Profile: ${adminName}` : 'View Admin Profile'}
          >
            <div
              className="sidebar-user-avatar-wrap"
              onClick={() => {
                setActiveTab('profile');
                setCurrentPage(1);
                setIsSidebarOpen(false);
              }}
            >
              <div className="sidebar-avatar-circle">
                {adminInitials}
              </div>
              <span className="sidebar-online-beacon" title="Session Active" />
            </div>

            {!isSidebarCollapsed && (
              <div
                className="sidebar-user-info"
                onClick={() => {
                  setActiveTab('profile');
                  setCurrentPage(1);
                  setIsSidebarOpen(false);
                }}
              >
                <div className="sidebar-user-name" title={adminName}>
                  {adminName}
                </div>
                <div className="sidebar-user-role">Super Admin</div>
              </div>
            )}

            {!isSidebarCollapsed && (
              <button
                type="button"
                className="sidebar-logout-icon-btn"
                onClick={handleLogout}
                id="btn-admin-logout"
                title="Log Out Terminal"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          {/* When collapsed, provide an explicit, easy-to-tap Logout button */}
          {isSidebarCollapsed && (
            <div className="sidebar-collapsed-logout-wrap">
              <button
                type="button"
                className="sidebar-collapsed-logout-btn"
                onClick={handleLogout}
                id="btn-admin-logout"
                title="Log Out Terminal"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="main-wrapper">
        {/* Top Control Bar */}
        <header className="top-bar">
          <button
            className="menu-toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 768) {
                setIsSidebarOpen(!isSidebarOpen);
              } else {
                toggleSidebarCollapse();
              }
            }}
            title="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="search-box-container">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setUserPage(1);
              }}
              id="top-bar-search"
              aria-label="Global search across platform"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <span className="search-shortcut-hint" title="Press Ctrl+K to search">
              <span className="kbd-key">⌘</span><span className="kbd-key">K</span>
            </span>
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
            <button
              type="button"
              className={`control-icon-btn ${activeTab === 'profile' ? 'active' : ''}`}
              title={`Admin Profile (${adminName})`}
              aria-label="Admin Profile"
              onClick={() => {
                setActiveTab('profile');
                setCurrentPage(1);
              }}
            >
              <User size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic screen views switching */}
        {activeTab === 'dashboard' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Market Overview</h2>
                <p className="overview-sub">
                  {dateRange === 'Today'
                    ? 'Real-time performance metrics for today.'
                    : dateRange === '7D'
                    ? 'Aggregated performance metrics for the last 7 days.'
                    : dateRange === '30D'
                    ? 'Aggregated performance metrics for the last 30 days.'
                    : 'All-time cumulative institutional performance metrics.'}
                </p>
              </div>
              <div className="header-action-row">
                {/* Segmented Quick Date Range Controls */}
                <div className="date-filter-group" role="group" aria-label="Date Range Filter">
                  {[
                    { id: 'ALL', label: 'All Time' },
                    { id: 'Today', label: 'Today' },
                    { id: '7D', label: '7 Days' },
                    { id: '30D', label: '30 Days' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`date-filter-pill-btn ${dateRange === opt.id ? 'active' : ''}`}
                      onClick={() => setDateRange(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  className="export-btn"
                  onClick={handleExportReport}
                  title="Export overview data to CSV"
                >
                  <Download size={14} />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Metrics cards grid */}
            <section className="metrics-grid">
              {/* Metric 1: Total Users -> Users Tab */}
              <div
                className="metric-card"
                onClick={() => {
                  setActiveTab('users');
                  setCurrentPage(1);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('users');
                    setCurrentPage(1);
                  }
                }}
                title="Click to view User Management"
              >
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <Users size={16} color="#00D285" />
                  </div>
                  <span className="metric-change-badge positive">+8%</span>
                </div>
                <span className="metric-label">Total Users</span>
                <span className="metric-value">{metrics.users}</span>
              </div>

              {/* Metric 2: Active Trades -> Transactions Tab */}
              <div
                className="metric-card"
                onClick={() => {
                  setActiveTab('transactions');
                  setCurrentPage(1);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('transactions');
                    setCurrentPage(1);
                  }
                }}
                title="Click to view Active Transactions & Trades"
              >
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <Activity size={16} color="#3B82F6" />
                  </div>
                  <span className="metric-change-badge positive">+15.2%</span>
                </div>
                <span className="metric-label">Active Trades</span>
                <span className="metric-value">{metrics.activeTrades}</span>
              </div>

              {/* Metric 3: Total Volume -> Live Markets Tab */}
              <div
                className="metric-card"
                onClick={() => {
                  setActiveTab('markets');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('markets');
                  }
                }}
                title="Click to view Live Football Club Markets"
              >
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <BarChart3 size={16} color="#F59E0B" />
                  </div>
                  <span className="metric-change-badge negative">-0.4%</span>
                </div>
                <span className="metric-label">Total Vol (₦)</span>
                <span className="metric-value">{metrics.volume}</span>
              </div>

              {/* Metric 4: Platform Revenue -> Portfolio Vaults & Reserves Tab */}
              <div
                className="metric-card"
                onClick={() => {
                  setActiveTab('portfolio');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('portfolio');
                  }
                }}
                title="Click to view Vaults, Reserves & Balances Portfolio"
              >
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
                  <div
                    onClick={() => {
                      setActiveTab('transactions');
                      setCurrentPage(1);
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Click to view Transactions"
                  >
                    <h3 className="card-heading">Trade Frequency</h3>
                    <p className="card-subheading">Cumulative transactional activity per hour</p>
                  </div>
                  <div className="chart-period-selectors">
                    <button className="period-btn">1H</button>
                    <button className="period-btn active">4H</button>
                    <button className="period-btn">1W</button>
                  </div>
                </div>

                <div
                  className="bar-chart-container"
                  onClick={() => {
                    setActiveTab('transactions');
                    setCurrentPage(1);
                  }}
                  style={{ cursor: 'pointer' }}
                  title="Click to view Transactions"
                >
                  {tradeFrequencyData.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>
                      No trade transactions recorded in this period
                    </div>
                  ) : (
                    tradeFrequencyData.map((data, index) => {
                      const maxBinCount = Math.max(...tradeFrequencyData.map(d => d.count || 0), 1);
                      const barPercent = data.count > 0 ? Math.max(12, Math.round((data.count / maxBinCount) * 100)) : 6;
                      return (
                        <div
                          key={index}
                          className={`bar-wrapper ${data.highlighted ? 'highlighted' : ''}`}
                        >
                          <div className="bar-tooltip">{data.count} Trades ({data.hour})</div>
                          <div
                            className="bar-column"
                            style={{ height: `${barPercent}%` }}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="chart-x-labels">
                  {tradeFrequencyData.length > 0 ? (
                    tradeFrequencyData.filter((_, idx) => idx % 2 === 0).map((d, i) => (
                      <span key={i} className="x-label-text">{d.hour}</span>
                    ))
                  ) : (
                    <>
                      <span className="x-label-text">12:00 AM</span>
                      <span className="x-label-text">06:00 AM</span>
                      <span className="x-label-text">12:00 PM</span>
                      <span className="x-label-text">06:00 PM</span>
                      <span className="x-label-text">Now</span>
                    </>
                  )}
                </div>
              </div>

              {/* Financial Oversight Panel */}
              <div className="chart-card">
                <div className="card-title-row" style={{ marginBottom: 16 }}>
                  <div
                    onClick={() => setActiveTab('portfolio')}
                    style={{ cursor: 'pointer' }}
                    title="Click to view Vaults & Reserves Portfolio"
                  >
                    <h3 className="card-heading">Financial Oversight</h3>
                  </div>
                </div>

                <div className="oversight-row">
                  {/* Escrow balance */}
                  <div
                    className="oversight-item-card"
                    onClick={() => setActiveTab('portfolio')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveTab('portfolio');
                      }
                    }}
                    title="Click to view Escrow & Vault Reserves"
                  >
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
                  <div
                    className="oversight-item-card"
                    onClick={() => setActiveTab('portfolio')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveTab('portfolio');
                      }
                    }}
                    title="Click to view Cold Vault Reserves"
                  >
                    <div className="oversight-info-left">
                      <div className="oversight-icon-wrap">
                        <Wallet size={16} />
                      </div>
                      <div className="oversight-details">
                        <span className="oversight-label">Cold Wallet Balance</span>
                        <span className="oversight-value">{metrics.coldWalletBalance}</span>
                      </div>
                    </div>
                    <span className="oversight-badge change-pos">Multi-Sig</span>
                  </div>

                  {/* Progress segment */}
                  <div
                    onClick={() => setActiveTab('portfolio')}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveTab('portfolio');
                      }
                    }}
                    title="Click to view Liquidity Distribution in Portfolio"
                  >
                    <div className="liquidity-progress-header">
                      <span>LIQUIDITY DISTRIBUTION</span>
                    </div>
                    {(() => {
                      const totalLiq = Number(dbStats.liquidity) || (Number(dbStats.userFunds || 0) + Number(dbStats.coldWalletBalance || 0)) || 1;
                      const userFunds = Number(dbStats.userFunds || 0);
                      const userPct = Math.min(100, Math.max(0, Math.round((userFunds / totalLiq) * 100))) || 50;
                      const vaultPct = 100 - userPct;
                      return (
                        <>
                          <div className="liquidity-progress-bar-container">
                            <div className="progress-section-bank" style={{ width: `${userPct}%` }} />
                            <div className="progress-section-cards" style={{ width: `${vaultPct}%` }} />
                          </div>
                          <div className="liquidity-labels-row">
                            <div className="liquidity-dot-label">
                              <span className="liquidity-dot bank" />
                              <span>Trader Wallets ({userPct}%)</span>
                            </div>
                            <div className="liquidity-dot-label">
                              <span className="liquidity-dot cards" />
                              <span>Vault Reserves ({vaultPct}%)</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
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
                  <button
                    className="export-btn"
                    onClick={() => {
                      setActiveTab('transactions');
                      setCurrentPage(1);
                    }}
                    title="View all transactions in full table"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeftRight size={14} />
                    <span>View All</span>
                  </button>
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
                        <td className="trade-id-col" title={`Full Trade ID: ${trade.id}`}>
                          <span className="trimmed-trade-id">
                            {trade.id.length > 10 ? `#${trade.id.slice(0, 4)}...${trade.id.slice(-4)}` : `#${trade.id}`}
                          </span>
                        </td>
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
                              {trade.partyA} &amp; {trade.partyB}
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
                            className={`status-badge-td ${trade.status === 'SETTLED' ? 'settled' : 'blocked'
                              }`}
                          >
                            {trade.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', position: 'relative' }}>
                          {/* Desktop Inline Actions: Shown freely */}
                          <div className="desktop-trade-actions">
                            {trade.status !== 'SETTLED' && (
                              <button
                                type="button"
                                className="trade-action-btn settle"
                                onClick={() => handleUpdateStatus(trade.id, 'SETTLED')}
                                title="Settle Trade"
                              >
                                <CheckCircle size={12} />
                                <span>Settle</span>
                              </button>
                            )}
                            {trade.status !== 'BLOCKED' && (
                              <button
                                type="button"
                                className="trade-action-btn block"
                                onClick={() => handleUpdateStatus(trade.id, 'BLOCKED')}
                                title="Block Trade"
                              >
                                <AlertTriangle size={12} />
                                <span>Block</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="trade-action-btn delete"
                              onClick={() => handleDeleteTrade(trade.id)}
                              title="Delete Record"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>

                          {/* Mobile Action Dropdown */}
                          <div className="mobile-trade-actions">
                            <button
                              type="button"
                              className="action-row-btn"
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === trade.id ? null : trade.id
                                )
                              }
                              title="Trade Actions"
                              aria-label="Trade Actions Menu"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuId === trade.id && (
                              <div className="mobile-action-dropdown">
                                {trade.status !== 'SETTLED' && (
                                  <button
                                    type="button"
                                    className="mobile-dropdown-btn settle"
                                    onClick={() => handleUpdateStatus(trade.id, 'SETTLED')}
                                  >
                                    <CheckCircle size={12} color="#00D285" />
                                    <span>Settle Trade</span>
                                  </button>
                                )}
                                {trade.status !== 'BLOCKED' && (
                                  <button
                                    type="button"
                                    className="mobile-dropdown-btn block"
                                    onClick={() => handleUpdateStatus(trade.id, 'BLOCKED')}
                                  >
                                    <AlertTriangle size={12} color="#F59E0B" />
                                    <span>Block Trade</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="mobile-dropdown-btn delete"
                                  onClick={() => handleDeleteTrade(trade.id)}
                                >
                                  <Trash2 size={12} color="#EF4444" />
                                  <span>Delete Record</span>
                                </button>
                              </div>
                            )}
                          </div>
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
                  onClick={handleExportReport}
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
                      <th style={{ minWidth: 120 }}>Txn Hash</th>
                      <th style={{ minWidth: 75 }}>Type</th>
                      <th style={{ minWidth: 160 }}>User Name</th>
                      <th style={{ minWidth: 170 }}>Email Address</th>
                      <th style={{ minWidth: 110 }}>Amount</th>
                      <th style={{ minWidth: 125 }}>Date / Time</th>
                      <th style={{ minWidth: 85 }}>Status</th>
                      <th style={{ textAlign: 'right', minWidth: 95 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => {
                      const typeInfo = formatTxnTypeInfo(txn.type);
                      const displayHash = txn.hash
                        ? txn.hash.length > 12
                          ? `${txn.hash.substring(0, 5)}...${txn.hash.slice(-4)}`
                          : txn.hash
                        : 'N/A';

                      return (
                        <tr key={txn.hash}>
                          {/* Trimmed Hash with quick copy */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              className="txn-hash-badge"
                              title={`Click to copy: ${txn.hash}`}
                              onClick={() => {
                                navigator.clipboard?.writeText(txn.hash);
                                showToast('Transaction hash copied!', 'info');
                              }}
                            >
                              <span>#{displayHash}</span>
                              <Copy size={11} style={{ opacity: 0.6 }} />
                            </button>
                          </td>

                          {/* Simplified Type */}
                          <td>
                            <span className={`txn-type-pill ${typeInfo.className}`}>
                              {typeInfo.label}
                            </span>
                          </td>

                          {/* Visible User Name with Avatar Dot */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
                                border: '1px solid rgba(var(--color-primary-rgb), 0.35)',
                                color: 'var(--color-primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: '500',
                                flexShrink: 0
                              }}>
                                {txn.userName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span style={{ fontWeight: '500', color: 'var(--text-white)', fontSize: 13, letterSpacing: '0.2px' }}>
                                {txn.userName}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                              {txn.userEmail && txn.userEmail !== 'N/A' ? txn.userEmail : '—'}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="amount-cell" style={{ color: '#00D285', fontWeight: '500', fontSize: 12.5 }}>
                            ₦{Number(txn.amount || 0).toLocaleString()}
                          </td>

                          {/* Date & Time */}
                          <td style={{ color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap' }}>
                            {txn.time}
                          </td>

                          {/* Status */}
                          <td>
                            <span
                              className="status-badge-td"
                              style={{
                                backgroundColor: txn.status === 'SUCCESS' ? 'rgba(0, 210, 133, 0.08)' :
                                  txn.status === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                border: txn.status === 'SUCCESS' ? '1px solid rgba(0, 210, 133, 0.25)' :
                                  txn.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                                color: txn.status === 'SUCCESS' ? '#00D285' :
                                  txn.status === 'PENDING' ? '#F59E0B' : '#EF4444',
                                fontSize: 9.5,
                                fontWeight: '500',
                                padding: '3px 7px',
                                borderRadius: 4
                              }}
                            >
                              {txn.status}
                            </span>
                          </td>

                          {/* Action */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {txn.status === 'PENDING' ? (
                              <div style={{ display: 'inline-flex', gap: 5, justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  style={{
                                    backgroundColor: 'rgba(0, 210, 133, 0.12)',
                                    border: '1px solid rgba(0, 210, 133, 0.3)',
                                    color: '#00D285',
                                    fontSize: 10.5,
                                    fontWeight: '500',
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleUpdateTxnStatus(txn.hash, 'SUCCESS')}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#EF4444',
                                    fontSize: 10.5,
                                    fontWeight: '500',
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleUpdateTxnStatus(txn.hash, 'FAILED')}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: '#64748b' }}>Complete</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedTransactions.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
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
                <h2 className="overview-title">Security &amp; Access Logs</h2>
                <p className="overview-sub">Real-time administrative audit trails, security warnings, and access control telemetry.</p>
              </div>
              <div className="header-action-row">
                <button className="export-btn" onClick={fetchSecurityLogs} title="Refresh security logs">
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
                <button className="export-btn" onClick={handleExportReport} title="Export audit logs">
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Security Statistics Ribbon */}
            <section className="metrics-grid" style={{ marginBottom: 24 }}>
              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    <ShieldCheck size={16} />
                  </div>
                  <span className="metric-change-badge positive">All-Time</span>
                </div>
                <span className="metric-label">Total Security Logs</span>
                <span className="metric-value">{securityStats.total.toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                    <AlertTriangle size={16} />
                  </div>
                  <span className="metric-change-badge" style={{ color: '#EF4444' }}>Warnings</span>
                </div>
                <span className="metric-label">Security Alerts &amp; Threats</span>
                <span className="metric-value" style={{ color: '#EF4444' }}>{securityStats.warnings.toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(0, 210, 133, 0.1)', color: '#00D285' }}>
                    <UserCheck size={16} />
                  </div>
                  <span className="metric-change-badge positive">Verified</span>
                </div>
                <span className="metric-label">Authorized Admin Actions</span>
                <span className="metric-value" style={{ color: '#00D285' }}>{securityStats.successful.toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                    <Cpu size={16} />
                  </div>
                  <span className="metric-change-badge" style={{ color: '#F59E0B' }}>Engine</span>
                </div>
                <span className="metric-label">System Node Events</span>
                <span className="metric-value" style={{ color: '#F59E0B' }}>{securityStats.system.toLocaleString()}</span>
              </div>
            </section>

            {/* Admin Password & Credentials Configuration Card */}
            <section className="referral-config-card">
              <div className="referral-config-header">
                <div>
                  <h3 className="referral-config-title">
                    <Key size={16} color="#00D285" />
                    Admin Credentials &amp; Authentication
                  </h3>
                  <p className="referral-config-sub">Update master administrator password. Password must be at least 6 characters.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className="referral-grid-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  <div className="referral-input-group">
                    <label className="referral-input-label">Current Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="referral-input"
                        style={{ paddingRight: 40 }}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={showOldPassword ? "Hide password" : "Show password"}
                      >
                        {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="referral-input-group">
                    <label className="referral-input-label">New Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        className="referral-input"
                        style={{ paddingRight: 40 }}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="referral-input-group">
                    <label className="referral-input-label">Confirm New Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repeat new password"
                        className="referral-input"
                        style={{ paddingRight: 40 }}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    {newPassword && confirmPassword && (
                      <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, color: newPassword === confirmPassword ? '#00D285' : '#EF4444', fontWeight: 500 }}>
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle size={14} />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={14} />
                            <span>Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isChangingPassword}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 18px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      opacity: isChangingPassword ? 0.7 : 1,
                      cursor: isChangingPassword ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isChangingPassword ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Key size={13} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Unified Security Audit Logs Table Card */}
            <section className="recent-trades-card">
              <div className="table-filter-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                {/* Category Navigation Pills */}
                <div className="table-tabs-row">
                  <button
                    type="button"
                    onClick={() => setSecurityCategory('all')}
                    className={`table-tab-btn ${securityCategory === 'all' ? 'active' : ''}`}
                  >
                    <Shield size={13} />
                    <span>All Audit Logs</span>
                    <span className="table-tab-badge">
                      {auditLogs.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSecurityCategory('warnings')}
                    className={`table-tab-btn ${securityCategory === 'warnings' ? 'active' : ''}`}
                  >
                    <AlertTriangle size={13} color="#EF4444" />
                    <span>Warnings &amp; Alerts</span>
                    <span className="table-tab-badge" style={{
                      backgroundColor: securityCategory === 'warnings' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.08)',
                      color: securityCategory === 'warnings' ? '#EF4444' : '#94a3b8'
                    }}>
                      {securityStats.warnings}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSecurityCategory('success')}
                    className={`table-tab-btn ${securityCategory === 'success' ? 'active' : ''}`}
                  >
                    <UserCheck size={13} color="#00D285" />
                    <span>Authorized Actions</span>
                    <span className="table-tab-badge" style={{
                      backgroundColor: securityCategory === 'success' ? 'rgba(0, 210, 133, 0.25)' : 'rgba(255,255,255,0.08)',
                      color: securityCategory === 'success' ? '#00D285' : '#94a3b8'
                    }}>
                      {securityStats.successful}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSecurityCategory('system')}
                    className={`table-tab-btn ${securityCategory === 'system' ? 'active' : ''}`}
                  >
                    <Cpu size={13} color="#3B82F6" />
                    <span>System Node Events</span>
                    <span className="table-tab-badge" style={{
                      backgroundColor: securityCategory === 'system' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.08)',
                      color: securityCategory === 'system' ? '#3B82F6' : '#94a3b8'
                    }}>
                      {securityStats.system}
                    </span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="export-btn" onClick={fetchSecurityLogs} title="Refresh security logs">
                    <RefreshCw size={13} />
                    <span>Refresh</span>
                  </button>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                    25 per page
                  </span>
                </div>
              </div>

              {/* Security Logs Table */}
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 280 }}>Audit Event / Action</th>
                      <th style={{ minWidth: 110 }}>Severity</th>
                      <th style={{ minWidth: 180 }}>Origin / Meta</th>
                      <th style={{ textAlign: 'right', minWidth: 140 }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSecurityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '36px 0' }}>
                          <ShieldCheck size={36} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.5, display: 'block', margin: '0 auto 8px' }} />
                          {searchQuery ? 'No security logs match your search.' : 'No security events recorded in this category.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedSecurityLogs.map((log) => {
                        const isWarning = log.type === 'warning' || log.type === 'danger';
                        const isSuccess = log.type === 'success';
                        const iconBg = isWarning ? 'rgba(239, 68, 68, 0.12)' : isSuccess ? 'rgba(0, 210, 133, 0.12)' : 'rgba(59, 130, 246, 0.12)';
                        const iconColor = isWarning ? '#EF4444' : isSuccess ? '#00D285' : '#3B82F6';

                        return (
                          <tr key={log.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: iconBg,
                                  color: iconColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {log.icon === 'login' ? (
                                    <UserCheck size={14} />
                                  ) : log.icon === 'cpu' ? (
                                    <Cpu size={14} />
                                  ) : log.icon === 'trash' ? (
                                    <Trash2 size={14} />
                                  ) : log.icon === 'alert-triangle' ? (
                                    <AlertTriangle size={14} />
                                  ) : (
                                    <Shield size={14} />
                                  )}
                                </div>
                                <span style={{ fontWeight: 500, color: 'var(--text-white)', fontSize: 12.5, lineHeight: 1.4 }}>
                                  {log.text}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span className="status-badge-td" style={{
                                backgroundColor: isWarning ? 'rgba(239, 68, 68, 0.08)' : isSuccess ? 'rgba(0, 210, 133, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                                border: isWarning ? '1px solid rgba(239, 68, 68, 0.25)' : isSuccess ? '1px solid rgba(0, 210, 133, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)',
                                color: iconColor,
                                textTransform: 'uppercase',
                                fontSize: 9.5,
                                fontWeight: 500
                              }}>
                                {log.type || 'INFO'}
                              </span>
                            </td>

                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11.5 }}>
                                <User size={12} style={{ opacity: 0.6 }} />
                                <span>{log.meta || 'System Authorization'}</span>
                              </div>
                            </td>

                            <td style={{ color: '#64748b', fontSize: 11.5, textAlign: 'right', whiteSpace: 'nowrap' }}>
                              {log.time || 'Just now'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Showing {filteredSecurityLogs.length === 0 ? 0 : (securityPage - 1) * securityPerPage + 1}-
                  {Math.min(securityPage * securityPerPage, filteredSecurityLogs.length)} of {filteredSecurityLogs.length} logs
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="filter-btn"
                    onClick={() => setSecurityPage(p => Math.max(p - 1, 1))}
                    disabled={securityPage === 1}
                    style={{ padding: '4px 10px', fontSize: 11, cursor: securityPage === 1 ? 'not-allowed' : 'pointer', opacity: securityPage === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Page {securityPage} of {totalSecurityPages}
                  </span>
                  <button
                    className="filter-btn"
                    onClick={() => setSecurityPage(p => Math.min(p + 1, totalSecurityPages))}
                    disabled={securityPage >= totalSecurityPages}
                    style={{ padding: '4px 10px', fontSize: 11, cursor: securityPage >= totalSecurityPages ? 'not-allowed' : 'pointer', opacity: securityPage >= totalSecurityPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
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
                  onClick={fetchNotifications}
                  title="Refresh notifications"
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
                <button
                  className="export-btn"
                  onClick={handleMarkAllRead}
                  disabled={notifications.every(n => n.read)}
                  title="Mark all notifications as read"
                >
                  <CheckCircle size={14} />
                  <span>Mark all as read</span>
                </button>
              </div>
            </div>

            {/* Notification Statistics Ribbon */}
            <section className="metrics-grid" style={{ marginBottom: 24 }}>
              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    <Bell size={16} />
                  </div>
                  <span className="metric-change-badge positive">All-Time</span>
                </div>
                <span className="metric-label">Total Notifications</span>
                <span className="metric-value">{notifStats.total.toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                    <AlertTriangle size={16} />
                  </div>
                  <span className="metric-change-badge" style={{ color: '#F59E0B' }}>Action Required</span>
                </div>
                <span className="metric-label">Unread Alerts</span>
                <span className="metric-value" style={{ color: '#F59E0B' }}>{notifStats.unread.toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                    <ShieldCheck size={16} />
                  </div>
                  <span className="metric-change-badge" style={{ color: '#EF4444' }}>High Priority</span>
                </div>
                <span className="metric-label">Security Warnings</span>
                <span className="metric-value" style={{ color: '#EF4444' }}>{notifStats.security.toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(0, 210, 133, 0.1)', color: '#00D285' }}>
                    <Activity size={16} />
                  </div>
                  <span className="metric-change-badge positive">Platform</span>
                </div>
                <span className="metric-label">Operations &amp; KYC</span>
                <span className="metric-value" style={{ color: '#00D285' }}>{notifStats.operations.toLocaleString()}</span>
              </div>
            </section>

            {/* Unified Notifications Table Card */}
            <section className="recent-trades-card">
              <div className="table-filter-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                {/* Category Navigation Pills */}
                <div className="table-tabs-row">
                  <button
                    type="button"
                    onClick={() => setNotifCategory('all')}
                    className={`table-tab-btn ${notifCategory === 'all' ? 'active' : ''}`}
                  >
                    <Bell size={13} />
                    <span>All Notices</span>
                    <span className="table-tab-badge">
                      {notifications.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifCategory('unread')}
                    className={`table-tab-btn ${notifCategory === 'unread' ? 'active' : ''}`}
                  >
                    <AlertTriangle size={13} color="#F59E0B" />
                    <span>Unread Alerts</span>
                    <span className="table-tab-badge" style={{
                      backgroundColor: notifCategory === 'unread' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.08)',
                      color: notifCategory === 'unread' ? '#F59E0B' : '#94a3b8'
                    }}>
                      {notifStats.unread}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifCategory('security')}
                    className={`table-tab-btn ${notifCategory === 'security' ? 'active' : ''}`}
                  >
                    <ShieldCheck size={13} color="#EF4444" />
                    <span>Security Warnings</span>
                    <span className="table-tab-badge" style={{
                      backgroundColor: notifCategory === 'security' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.08)',
                      color: notifCategory === 'security' ? '#EF4444' : '#94a3b8'
                    }}>
                      {notifStats.security}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifCategory('operations')}
                    className={`table-tab-btn ${notifCategory === 'operations' ? 'active' : ''}`}
                  >
                    <Activity size={13} color="#00D285" />
                    <span>Operations &amp; KYC</span>
                    <span className="table-tab-badge" style={{
                      backgroundColor: notifCategory === 'operations' ? 'rgba(0, 210, 133, 0.25)' : 'rgba(255,255,255,0.08)',
                      color: notifCategory === 'operations' ? '#00D285' : '#94a3b8'
                    }}>
                      {notifStats.operations}
                    </span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="export-btn" onClick={fetchNotifications} title="Refresh notification feed">
                    <RefreshCw size={13} />
                    <span>Refresh</span>
                  </button>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                    15 per page
                  </span>
                </div>
              </div>

              {/* Table Body Content */}
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 320 }}>Notification Event</th>
                      <th style={{ minWidth: 110 }}>Category</th>
                      <th style={{ minWidth: 180 }}>Target / Context</th>
                      <th style={{ minWidth: 135 }}>Timestamp</th>
                      <th style={{ textAlign: 'right', minWidth: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotifications.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '36px 0' }}>
                          <Bell size={36} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.5, display: 'block', margin: '0 auto 8px' }} />
                          {searchQuery ? 'No notifications match your search query.' : 'No notices in this category.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedNotifications.map((notif) => {
                        const isSec = notif.category === 'SECURITY' || notif.type === 'security';
                        const isOp = notif.category === 'OPERATIONS' || notif.type === 'operations' || notif.category === 'KYC' || notif.type === 'kyc';
                        const isWarn = notif.category === 'WARNING' || notif.type === 'warning';

                        const iconBg = isSec ? 'rgba(239, 68, 68, 0.12)' : isOp ? 'rgba(0, 210, 133, 0.12)' : isWarn ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)';
                        const iconColor = isSec ? '#EF4444' : isOp ? '#00D285' : isWarn ? '#F59E0B' : '#3B82F6';

                        return (
                          <tr
                            key={notif.id}
                            style={{
                              backgroundColor: !notif.read ? 'rgba(var(--color-primary-rgb), 0.03)' : 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              if (!notif.read) handleMarkSingleRead(notif.id);
                              setSelectedNotification(notif);
                            }}
                          >
                            {/* Notification Title & Snippet */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  backgroundColor: !notif.read ? '#00D285' : 'transparent',
                                  border: !notif.read ? '1px solid #00D285' : '1px solid transparent',
                                  boxShadow: !notif.read ? '0 0 6px #00D285' : 'none',
                                  flexShrink: 0
                                }} />
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: iconBg,
                                  color: iconColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isSec ? <ShieldCheck size={14} /> : isOp ? <Activity size={14} /> : isWarn ? <AlertTriangle size={14} /> : <Bell size={14} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                  <span style={{ fontWeight: !notif.read ? '600' : '500', color: 'var(--text-white)', fontSize: 12.5 }}>
                                    {notif.title}
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {notif.desc}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td>
                              <span className="status-badge-td" style={{
                                backgroundColor: isSec ? 'rgba(239, 68, 68, 0.08)' : isOp ? 'rgba(0, 210, 133, 0.08)' : isWarn ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                                border: isSec ? '1px solid rgba(239, 68, 68, 0.25)' : isOp ? '1px solid rgba(0, 210, 133, 0.25)' : isWarn ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)',
                                color: iconColor,
                                textTransform: 'uppercase',
                                fontSize: 9.5,
                                fontWeight: 500
                              }}>
                                {notif.category || 'SYSTEM'}
                              </span>
                            </td>

                            {/* Target User / Context */}
                            <td>
                              {notif.user ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                    color: '#3B82F6',
                                    fontSize: 10,
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    {(notif.user.firstName || notif.user.email || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-white)' }}>
                                      {notif.user.firstName ? `${notif.user.firstName} ${notif.user.lastName || ''}`.trim() : notif.user.email}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 11 }}>
                                  <Shield size={11} style={{ opacity: 0.6 }} />
                                  <span>System Broadcast</span>
                                </div>
                              )}
                            </td>

                            {/* Timestamp */}
                            <td style={{ color: '#64748b', fontSize: 11.5, whiteSpace: 'nowrap' }}>
                              {notif.fullDate || notif.time}
                            </td>

                            {/* Actions Column */}
                            <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  className="user-action-btn view"
                                  onClick={() => {
                                    if (!notif.read) handleMarkSingleRead(notif.id);
                                    setSelectedNotification(notif);
                                  }}
                                  title="View Notice Details"
                                  style={{ width: 28, height: 28, padding: 0 }}
                                >
                                  <Eye size={13} />
                                </button>

                                {!notif.read && (
                                  <button
                                    className="user-action-btn approve"
                                    onClick={() => handleMarkSingleRead(notif.id)}
                                    title="Mark Read"
                                    style={{ width: 28, height: 28, padding: 0 }}
                                  >
                                    <CheckCircle size={13} />
                                  </button>
                                )}

                                <button
                                  className="user-action-btn delete"
                                  onClick={() => {
                                    openConfirmModal({
                                      title: 'Dismiss Notice',
                                      message: `Are you sure you want to dismiss notice "${notif.title}"?`,
                                      confirmText: 'Dismiss',
                                      type: 'warning',
                                      onConfirm: async () => {
                                        await handleDismissNotification(notif.id);
                                      }
                                    });
                                  }}
                                  title="Dismiss Notice"
                                  style={{ width: 28, height: 28, padding: 0 }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Showing {filteredNotifications.length === 0 ? 0 : (notifPage - 1) * notifPerPage + 1}-
                  {Math.min(notifPage * notifPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="filter-btn"
                    onClick={() => setNotifPage(p => Math.max(p - 1, 1))}
                    disabled={notifPage === 1}
                    style={{ padding: '4px 10px', fontSize: 11, cursor: notifPage === 1 ? 'not-allowed' : 'pointer', opacity: notifPage === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Page {notifPage} of {totalNotifPages}
                  </span>
                  <button
                    className="filter-btn"
                    onClick={() => setNotifPage(p => Math.min(p + 1, totalNotifPages))}
                    disabled={notifPage >= totalNotifPages}
                    style={{ padding: '4px 10px', fontSize: 11, cursor: notifPage >= totalNotifPages ? 'not-allowed' : 'pointer', opacity: notifPage >= totalNotifPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            {/* Notification Detail Modal for Admin */}
            {selectedNotification && (
              <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
                <div
                  className="modal-content-card"
                  style={{
                    maxWidth: 520,
                    width: '92%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 14,
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
                    padding: 24
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="status-badge-td"
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor: selectedNotification.category === 'SECURITY' ? 'rgba(239, 68, 68, 0.12)' :
                            selectedNotification.category === 'OPERATIONS' ? 'rgba(0, 210, 133, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                          color: selectedNotification.category === 'SECURITY' ? '#EF4444' :
                            selectedNotification.category === 'OPERATIONS' ? '#00D285' : '#3B82F6',
                          border: '1px solid currentColor'
                        }}
                      >
                        {selectedNotification.category}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {selectedNotification.fullDate || selectedNotification.time}
                      </span>
                    </div>
                    <button
                      className="modal-close-btn"
                      onClick={() => setSelectedNotification(null)}
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {selectedNotification.user && (
                    <div style={{
                      marginBottom: 14,
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <User size={13} style={{ opacity: 0.7 }} />
                      <span>
                        Target User: <strong style={{ color: 'var(--text-white)' }}>{selectedNotification.user.firstName} {selectedNotification.user.lastName}</strong> &lt;{selectedNotification.user.email}&gt;
                      </span>
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, color: 'var(--text-white)', margin: '0 0 10px 0', fontWeight: 600, lineHeight: 1.35 }}>
                      {selectedNotification.title}
                    </h3>
                    <div
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: 16,
                        color: 'var(--text-white)',
                        fontSize: 13,
                        lineHeight: 1.6,
                        maxHeight: 280,
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        userSelect: 'text'
                      }}
                    >
                      {selectedNotification.desc || selectedNotification.text}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                    {!selectedNotification.read && (
                      <button
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12 }}
                        onClick={() => {
                          handleMarkSingleRead(selectedNotification.id);
                          setSelectedNotification(prev => prev ? { ...prev, read: true } : null);
                        }}
                      >
                        <CheckCircle size={13} />
                        <span>Mark Read</span>
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      onClick={() => {
                        handleDismissNotification(selectedNotification.id);
                        setSelectedNotification(null);
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Dismiss</span>
                    </button>
                    <button
                      type="button"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-light)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedNotification(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        ) : activeTab === 'settings' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Platform Settings &amp; Governance</h2>
                <p className="overview-sub">Configure platform commission fees, multi-sig limits, automated settlement protocols, and payment gateways.</p>
              </div>
              <div className="header-action-row">
                <button className="export-btn" onClick={fetchSettings} title="Refresh settings from server">
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Platform Overview Metrics Ribbon */}
            <section className="metrics-grid" style={{ marginBottom: 24 }}>
              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(0, 210, 133, 0.1)', color: '#00D285' }}>
                    <Percent size={16} />
                  </div>
                  <span className="metric-change-badge positive">Rake Rate</span>
                </div>
                <span className="metric-label">Platform Commission Fee</span>
                <span className="metric-value">{Number(editFee || platformFee || 0).toFixed(2)}%</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Deducted on trade escrow release</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    <ShieldCheck size={16} />
                  </div>
                  <span className="metric-change-badge" style={{ color: '#3B82F6' }}>Tier-2 Multi-Sig</span>
                </div>
                <span className="metric-label">Compliance Safeguard</span>
                <span className="metric-value">₦{Number(editThreshold || complianceThreshold || 0).toLocaleString()}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>High-value dual approval trigger</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                    <CreditCard size={16} />
                  </div>
                  <span className="metric-change-badge" style={{ color: gatewayMode === 'LIVE' ? '#00D285' : '#F59E0B' }}>
                    {gatewayMode === 'LIVE' ? '● LIVE MODE' : '○ SANDBOX'}
                  </span>
                </div>
                <span className="metric-label">Active Payment Gateway</span>
                <span className="metric-value">{activeGateway.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {autoWithdrawalApproval ? '⚡ Instant Automated Payouts' : '🛡️ Manual Admin Payouts'}
                </span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box" style={{ background: maintenanceMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 210, 133, 0.1)', color: maintenanceMode ? '#EF4444' : '#00D285' }}>
                    <Cpu size={16} />
                  </div>
                  <span className="metric-change-badge" style={{ color: maintenanceMode ? '#EF4444' : '#00D285' }}>
                    {maintenanceMode ? 'HALTED' : 'OPERATIONAL'}
                  </span>
                </div>
                <span className="metric-label">System Node Status</span>
                <span className="metric-value" style={{ fontSize: 18, color: maintenanceMode ? '#EF4444' : 'var(--text-white)' }}>
                  {maintenanceMode ? 'Maintenance Mode' : 'Live & Serving'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Protocol: {editMode}
                </span>
              </div>
            </section>

            <div className="settings-grid">
              {/* Financial Configurations */}
              <div className="settings-card">
                <div className="settings-card-title">
                  <ShieldAlert size={18} color="#00D285" />
                  Financial Configurations &amp; Limits
                </div>
                <p className="settings-card-sub">Manage platform escrow rake rates and institutional compliance transaction thresholds.</p>
                <form onSubmit={handleSaveSettings}>
                  <div className="settings-field">
                    <label className="settings-label">Platform Commission Fee (%)</label>
                    <div className="settings-input-affix-wrapper">
                      <span className="settings-input-affix">%</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="vault-input settings-input-with-affix"
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                        required
                        placeholder="e.g. 1.5"
                      />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      This percentage is deducted from the winner's pot upon successful trade outcome resolution.
                    </span>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Multi-Sig Verification Threshold (₦)</label>
                    <div className="settings-input-affix-wrapper">
                      <span className="settings-input-affix">₦</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        className="vault-input settings-input-with-affix"
                        value={editThreshold}
                        onChange={(e) => setEditThreshold(e.target.value)}
                        required
                        placeholder="e.g. 500000"
                      />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Disbursements or bets exceeding this threshold trigger secondary administrative clearance.
                    </span>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Save size={15} />
                    <span>Save Financial Parameters</span>
                  </button>
                </form>
              </div>

              {/* Operational Protocols */}
              <div className="settings-card">
                <div className="settings-card-title">
                  <Sliders size={18} color="#3B82F6" />
                  Operational Protocols &amp; Safeguards
                </div>
                <p className="settings-card-sub">Define automated settlement algorithms and platform emergency operational controls.</p>
                
                <form onSubmit={handleSaveSettings}>
                  <div className="settings-field">
                    <label className="settings-label">Settlement Release Protocol</label>
                    <select
                      className="vault-select"
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value)}
                    >
                      <option value="AUTOMATED">Automated Instant Payouts (Real-Time Settlement)</option>
                      <option value="DELAYED">Delayed Escrow Batching (24h Audit Lock)</option>
                      <option value="MANUAL">Manual Admin Approval Required</option>
                    </select>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {editMode === 'AUTOMATED' && '⚡ Winning funds are instantly released to user balance once an event concludes.'}
                      {editMode === 'DELAYED' && '⏳ Settlements enter a 24-hour verification window before crediting user balances.'}
                      {editMode === 'MANUAL' && '🛡️ All payouts require explicit sign-off from an authorized compliance officer.'}
                    </span>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Platform Maintenance Mode</label>
                    <div className="settings-maintenance-box">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)' }}>
                            Emergency Maintenance
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              padding: '2px 8px',
                              borderRadius: 12,
                              backgroundColor: maintenanceMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 210, 133, 0.15)',
                              color: maintenanceMode ? '#EF4444' : '#00D285'
                            }}
                          >
                            {maintenanceMode ? 'ENABLED (HALTED)' : 'DISABLED (LIVE)'}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                          Temporarily pauses market trades, new order placement, and deposit requests during upgrades.
                        </p>
                      </div>

                      <label className="toggle-switch-container">
                        <input
                          type="checkbox"
                          className="toggle-switch-input"
                          checked={maintenanceMode}
                          onChange={handleToggleMaintenance}
                        />
                        <span className="toggle-switch-slider"></span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Save size={15} />
                    <span>Save Operational Protocols</span>
                  </button>
                </form>
              </div>

              {/* Payment Gateway Configurations Card (VTStack & Flutterwave only) */}
              <div className="settings-card" style={{ gridColumn: 'span 2', marginTop: 8 }}>
                <div className="settings-card-title">
                  <CreditCard size={18} color="#00D285" />
                  Payment Gateway &amp; Merchant Integrations
                </div>
                <p className="settings-card-sub" style={{ marginBottom: 20 }}>
                  Select active payment processing infrastructure and configure API credentials for virtual accounts, instant deposits, and automated withdrawals. Supported gateways: <strong>VTStack</strong> and <strong>Flutterwave</strong>.
                </p>

                <form onSubmit={handleSaveGatewaySettings}>
                  {/* Gateway Selector Cards */}
                  <div style={{ marginBottom: 24 }}>
                    <label className="settings-label" style={{ marginBottom: 10, display: 'block' }}>
                      Select Active Payment Gateway Provider
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                      {[
                        { id: 'vtstack', name: 'VTStack', badge: 'Virtual Accounts & Instant Payouts', icon: '⚡' },
                        { id: 'flutterwave', name: 'Flutterwave', badge: 'Pan-African & Global Cards', icon: '🌍' },
                      ].map((gw) => (
                        <div
                          key={gw.id}
                          className={`settings-gateway-card ${activeGateway === gw.id ? 'active' : ''}`}
                          onClick={() => setActiveGateway(gw.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: '600', color: 'var(--text-white)' }}>
                              {gw.icon} {gw.name}
                            </span>
                            {activeGateway === gw.id && (
                              <span style={{ fontSize: 9, backgroundColor: '#00D285', color: '#090d16', fontWeight: '500', padding: '2px 7px', borderRadius: 10 }}>
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{gw.badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mode & Auto-Approval */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <div className="settings-field">
                      <label className="settings-label">Environment Mode</label>
                      <select
                        className="vault-select"
                        value={gatewayMode}
                        onChange={(e) => setGatewayMode(e.target.value)}
                      >
                        <option value="TEST">Sandbox / Test Mode (Simulated Payouts)</option>
                        <option value="LIVE">Production / Live Mode (Real Banking Rail)</option>
                      </select>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {gatewayMode === 'LIVE' ? '⚠️ Live transactions will move real fiat funds.' : '🧪 Sandbox allows test transactions without moving real funds.'}
                      </span>
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Automated Withdrawal Payouts</label>
                      <select
                        className="vault-select"
                        value={autoWithdrawalApproval ? 'true' : 'false'}
                        onChange={(e) => setAutoWithdrawalApproval(e.target.value === 'true')}
                      >
                        <option value="true">Enabled (Instant gateway disbursement)</option>
                        <option value="false">Disabled (Require Admin approval for payouts)</option>
                      </select>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {autoWithdrawalApproval ? '⚡ User withdrawals below multi-sig threshold are processed instantly.' : '🛡️ Admin must review and approve every withdrawal in the Vault.'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic API Credentials Section */}
                  <div className="settings-credentials-panel">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {activeGateway === 'vtstack' && '⚡ VTStack API & Webhook Credentials'}
                          {activeGateway === 'flutterwave' && '🌍 Flutterwave Merchant API Keys'}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(0, 210, 133, 0.1)', color: '#00D285', fontWeight: 500 }}>
                          {gatewayMode}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSecretKeys(!showSecretKeys)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 500
                        }}
                      >
                        {showSecretKeys ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span>{showSecretKeys ? 'Conceal Keys' : 'Reveal Keys'}</span>
                      </button>
                    </div>

                    {activeGateway === 'vtstack' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                        <div className="settings-field">
                          <label className="settings-label">VTStack API Key</label>
                          <input
                            type={showSecretKeys ? 'text' : 'password'}
                            className="vault-input"
                            placeholder="vts_live_..."
                            value={vtstackApiKey}
                            onChange={(e) => setVtstackApiKey(e.target.value)}
                          />
                        </div>
                        <div className="settings-field">
                          <label className="settings-label">VTStack Payout Key</label>
                          <input
                            type={showSecretKeys ? 'text' : 'password'}
                            className="vault-input"
                            placeholder="vts_payout_..."
                            value={vtstackPayoutKey}
                            onChange={(e) => setVtstackPayoutKey(e.target.value)}
                          />
                        </div>
                        <div className="settings-field" style={{ gridColumn: 'span 2' }}>
                          <label className="settings-label">VTStack Webhook Signing Secret</label>
                          <input
                            type={showSecretKeys ? 'text' : 'password'}
                            className="vault-input"
                            placeholder="whsec_..."
                            value={vtstackWebhookSecret}
                            onChange={(e) => setVtstackWebhookSecret(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {activeGateway === 'flutterwave' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                        <div className="settings-field">
                          <label className="settings-label">Flutterwave Public Key</label>
                          <input
                            type="text"
                            className="vault-input"
                            placeholder="FLWPUBK_TEST-..."
                            value={flutterwavePublicKey}
                            onChange={(e) => setFlutterwavePublicKey(e.target.value)}
                          />
                        </div>
                        <div className="settings-field">
                          <label className="settings-label">Flutterwave Secret Key</label>
                          <input
                            type={showSecretKeys ? 'text' : 'password'}
                            className="vault-input"
                            placeholder="FLWSECK_TEST-..."
                            value={flutterwaveSecretKey}
                            onChange={(e) => setFlutterwaveSecretKey(e.target.value)}
                          />
                        </div>
                        <div className="settings-field" style={{ gridColumn: 'span 2' }}>
                          <label className="settings-label">Flutterwave Webhook Secret Hash (verif-hash)</label>
                          <input
                            type={showSecretKeys ? 'text' : 'password'}
                            className="vault-input"
                            placeholder="peeritrade_flw_secret"
                            value={flutterwaveSecretHash}
                            onChange={(e) => setFlutterwaveSecretHash(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px' }}>
                    <Save size={16} />
                    <span>Update Payment Gateway &amp; Keys</span>
                  </button>
                </form>
              </div>

              {/* External Football & Data APIs Configuration Card */}
              <div className="settings-card" style={{ gridColumn: 'span 2', marginTop: 16 }}>
                <div className="settings-card-title">
                  <Globe size={18} color="#00D285" />
                  Football &amp; External Sports Data API Configurations
                </div>
                <p className="settings-card-sub" style={{ marginBottom: 20 }}>
                  Configure external API keys and live feeds for real-time football fixtures, live match scores, betting odds, and prediction contracts.
                </p>

                <form onSubmit={handleSaveApiSettings}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button
                      type="button"
                      onClick={() => setShowApiKeys(!showApiKeys)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 500
                      }}
                    >
                      {showApiKeys ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{showApiKeys ? 'Conceal API Keys' : 'Reveal API Keys'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {/* API-Football (https://www.api-football.com/) Configuration with .env Fallback */}
                    <div className="settings-field" style={{ gridColumn: '1 / -1', border: '1px solid rgba(0, 210, 133, 0.25)', borderRadius: 10, padding: 18, backgroundColor: 'rgba(0, 210, 133, 0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>⚽</span>
                          <div>
                            <label className="settings-label" style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text-white)' }}>
                              API-Football (<a href="https://www.api-football.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#00D285', textDecoration: 'underline' }}>https://www.api-football.com/</a>)
                            </label>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              API-Sports Direct Endpoint: <code>https://v3.football.api-sports.io</code> (header: <code>x-apisports-key</code>)
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {footballApiKey.trim() ? (
                            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 12, backgroundColor: 'rgba(0, 210, 133, 0.15)', color: '#00D285', fontWeight: 500 }}>
                              ● CUSTOM ADMIN KEY ACTIVE
                            </span>
                          ) : hasEnvFootballApiKey ? (
                            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 500 }}>
                              ● USING .ENV FALLBACK ({envFootballApiKeyMasked || 'FOOTBALL_API_KEY'})
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontWeight: 500 }}>
                              ○ NO KEY CONFIGURED
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                        <input
                          type={showApiKeys ? 'text' : 'password'}
                          className="vault-input"
                          style={{ flex: '1 1 300px' }}
                          placeholder={hasEnvFootballApiKey ? `Leave blank to use .env fallback (${envFootballApiKeyMasked}) or enter custom key...` : "Enter your API key from https://www.api-football.com/..."}
                          value={footballApiKey}
                          onChange={(e) => {
                            setFootballApiKey(e.target.value);
                            setFootballApiStatus(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleTestFootballApi}
                          disabled={isTestingFootballApi}
                          style={{
                            padding: '10px 18px',
                            backgroundColor: 'rgba(0, 210, 133, 0.12)',
                            border: '1px solid #00D285',
                            color: '#00D285',
                            borderRadius: 6,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: isTestingFootballApi ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Activity size={14} />
                          <span>{isTestingFootballApi ? 'Testing...' : 'Test Connection'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncMatchesNow}
                          disabled={isSyncingMatches}
                          style={{
                            padding: '10px 18px',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid #3B82F6',
                            color: '#60A5FA',
                            borderRadius: 6,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: isSyncingMatches ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <RefreshCw size={14} className={isSyncingMatches ? 'animate-spin' : ''} />
                          <span>{isSyncingMatches ? 'Syncing...' : 'Sync Matches Now'}</span>
                        </button>
                      </div>

                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8, display: 'block', lineHeight: 1.5 }}>
                        💡 <strong>Where to find your key:</strong> Register and verify your email at <a href="https://dashboard.api-football.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#00D285', textDecoration: 'underline' }}>https://dashboard.api-football.com/</a>, then copy the 32-character key under your API dashboard. (RapidAPI keys are also automatically detected and supported).
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'block', lineHeight: 1.5 }}>
                        💡 <strong>Fallback logic:</strong> The system prioritizes the key saved above. If left blank or cleared, it automatically uses the <code>FOOTBALL_API_KEY</code> defined in your server environment (<code>.env</code> file).
                      </span>

                      {footballApiStatus && (
                        <div style={{
                          marginTop: 12,
                          padding: '12px 16px',
                          borderRadius: 8,
                          backgroundColor: footballApiStatus.success ? 'rgba(0, 210, 133, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          border: `1px solid ${footballApiStatus.success ? '#00D285' : '#EF4444'}`,
                          fontSize: 12.5,
                          color: footballApiStatus.success ? '#00D285' : '#FCA5A5'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {footballApiStatus.success ? '✓ Verified Connection' : '✗ Verification Failed'}: {footballApiStatus.message}
                          </div>
                          {footballApiStatus.details && (
                            <div style={{ fontSize: 11.5, color: 'var(--text-white)', marginTop: 4, lineHeight: 1.6 }}>
                              Account: <strong>{footballApiStatus.details.accountName}</strong> ({footballApiStatus.details.email}) &nbsp;|&nbsp; 
                              Subscription Plan: <strong>{footballApiStatus.details.plan}</strong> &nbsp;|&nbsp; 
                              Requests Today: <strong>{footballApiStatus.details.requestsToday} / {footballApiStatus.details.requestsLimit}</strong> &nbsp;|&nbsp; 
                              Active Key Source: <em>{footballApiStatus.source}</em>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="settings-field">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label className="settings-label" style={{ margin: 0 }}>🏆 TheSportsDB API Key</label>
                        <span style={{ fontSize: 10, color: '#00D285', fontWeight: 500 }}>thesportsdb.com</span>
                      </div>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        className="vault-input"
                        placeholder="Default is '3' (Free tier) or enter custom key"
                        value={theSportsDbApiKey}
                        onChange={(e) => setTheSportsDbApiKey(e.target.value)}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Used for sports league schedules, team badges, and match info.
                      </span>
                    </div>

                    <div className="settings-field">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label className="settings-label" style={{ margin: 0 }}>📊 Live Sports Odds API Key</label>
                        <span style={{ fontSize: 10, color: '#00D285', fontWeight: 500 }}>the-odds-api.com</span>
                      </div>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        className="vault-input"
                        placeholder="Enter The-Odds-API Key"
                        value={oddsApiKey}
                        onChange={(e) => setOddsApiKey(e.target.value)}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Used for global sports odds benchmarking and live market pricing.
                      </span>
                    </div>

                    <div className="settings-field">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label className="settings-label" style={{ margin: 0 }}>⚡ RapidAPI Key (Multi-Sport Data Hub)</label>
                        <span style={{ fontSize: 10, color: '#00D285', fontWeight: 500 }}>rapidapi.com</span>
                      </div>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        className="vault-input"
                        placeholder="Enter RapidAPI Key"
                        value={rapidApiKey}
                        onChange={(e) => setRapidApiKey(e.target.value)}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Unified key for external sports, boxing, and MMA feeds via RapidAPI.
                      </span>
                    </div>

                    <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label className="settings-label" style={{ margin: 0 }}>🤖 AI Settlement &amp; News Engine Key (Gemini / AI)</label>
                        <span style={{ fontSize: 10, color: '#00D285', fontWeight: 500 }}>AI Market Resolver</span>
                      </div>
                      <input
                        type={showApiKeys ? 'text' : 'password'}
                        className="vault-input"
                        placeholder="AI API Key for automated oracle verification"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Powers automated verification of real-life events, politics, and prediction contracts.
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSavingApis}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px' }}
                  >
                    <Save size={16} />
                    <span>{isSavingApis ? 'Saving API Credentials...' : 'Save Sports &amp; API Credentials'}</span>
                  </button>
                </form>
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
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 12, display: 'block' }}>
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
                              fontWeight: '500'
                            }}
                            onClick={() => setEditAvatar(`https://ui-avatars.com/api/?name=${editName}&background=00D285&color=000&bold=true`)}
                          >
                            Initials
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 6, display: 'block' }}>
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
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 6, display: 'block' }}>
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
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 6, display: 'block' }}>
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
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 6, display: 'block' }}>
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

              {/* Change Password Card in Profile */}
              <div className="security-settings-card" style={{ maxWidth: 650, margin: '0 auto', width: '100%' }}>
                <div className="security-settings-section">
                  <h3 className="security-section-title">Change Account Password</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                    Update your master administrator password. Password must be at least 6 characters.
                  </p>
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group-wrap">
                      <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 4, display: 'block' }}>
                        Current Admin Password
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showOldPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          className="form-input-text"
                          style={{ width: '100%', paddingRight: '40px' }}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={showOldPassword ? "Hide password" : "Show password"}
                        >
                          {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-row-split">
                      <div className="form-group-wrap">
                        <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 4, display: 'block' }}>
                          New Password
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Min 6 characters"
                            className="form-input-text"
                            style={{ width: '100%', paddingRight: '40px' }}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group-wrap">
                        <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 4, display: 'block' }}>
                          Confirm New Password
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repeat new password"
                            className="form-input-text"
                            style={{ width: '100%', paddingRight: '40px' }}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password match helper */}
                    {newPassword && confirmPassword && (
                      <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: newPassword === confirmPassword ? '#00D285' : '#EF4444' }}>
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle size={14} />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={14} />
                            <span>Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isChangingPassword}
                      style={{
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        opacity: isChangingPassword ? 0.7 : 1,
                        cursor: isChangingPassword ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isChangingPassword ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <Key size={14} />
                          <span>Update Password</span>
                        </>
                      )}
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
                <h2 className="overview-title">Prediction Markets &amp; Backdoor Trades</h2>
                <p className="overview-sub">
                  Set manual trades behind backdoor, configure question rules, publish to live markets, and settle outcomes.
                </p>
              </div>
              <div className="header-action-row" style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-secondary"
                  onClick={fetchMarkets}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    resetTradeForm();
                    setIsMarketModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} />
                  <span>Set Manual Trade (Backdoor)</span>
                </button>
              </div>
            </div>

            {/* View Sub-Tabs: Prediction Markets vs Sports Fixtures */}
            <div className="market-subtabs-bar">
              <button
                type="button"
                onClick={() => setMarketSubTab('markets')}
                className={`market-subtab-btn ${marketSubTab === 'markets' ? 'active' : ''}`}
              >
                <span>Prediction Markets &amp; Backdoor Trades</span>
                <span className="market-subtab-badge">
                  {markets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMarketSubTab('sports')}
                className={`market-subtab-btn ${marketSubTab === 'sports' ? 'active' : ''}`}
              >
                <span>Sports Fixtures &amp; Contracts (Overpower Safeguards)</span>
                <span className="market-subtab-badge">
                  {matches.length}
                </span>
              </button>
            </div>

            {/* Metrics Ribbon */}
            <div className="market-metrics-grid">
              <div className="market-metric-card">
                <span className="market-metric-label">Total Trades &amp; Markets</span>
                <span className="market-metric-value">{markets.length}</span>
                <span className="market-metric-subtext">All categories</span>
              </div>
              <div className="market-metric-card">
                <span className="market-metric-label">Published (Live)</span>
                <span className="market-metric-value" style={{ color: '#00D285' }}>
                  {markets.filter((m) => m.status === 'ACTIVE').length}
                </span>
                <span className="market-metric-subtext">Open for user trading</span>
              </div>
              <div className="market-metric-card">
                <span className="market-metric-label">Locked / Overpowered</span>
                <span className="market-metric-value" style={{ color: '#EF4444' }}>
                  {markets.filter((m) => m.isLocked || m.isOverpowered || m.status === 'SUSPENDED').length + matches.filter((m) => m.isLocked || m.isOverpowered || m.status === 'SUSPENDED').length}
                </span>
                <span className="market-metric-subtext">Crowd &gt;70% / Safeguard</span>
              </div>
              <div className="market-metric-card">
                <span className="market-metric-label">Backdoor Drafts</span>
                <span className="market-metric-value" style={{ color: '#F59E0B' }}>
                  {markets.filter((m) => m.status === 'DRAFT').length}
                </span>
                <span className="market-metric-subtext">Private / Unpublished</span>
              </div>
              <div className="market-metric-card">
                <span className="market-metric-label">Total Staked Pool</span>
                <span className="market-metric-value" style={{ color: '#3B82F6' }}>
                  ₦{markets.reduce((acc, m) => acc + (m.poolAmount || 0), 0).toLocaleString()}
                </span>
                <span className="market-metric-subtext">Cumulative user volume</span>
              </div>
              <div className="market-metric-card">
                <span className="market-metric-label">Settled / Resolved</span>
                <span className="market-metric-value" style={{ color: '#A855F7' }}>
                  {markets.filter((m) => m.status === 'RESOLVED').length}
                </span>
                <span className="market-metric-subtext">Completed payouts</span>
              </div>
            </div>

            {/* Markets Main Card */}
            <section className="recent-trades-card">
              {/* Category Filter Pills & Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  {/* Category Pills with Real Lucide Icons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { id: 'ALL', label: 'All Categories', icon: Layers },
                      ...APP_CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon }))
                    ].map((cat) => {
                      const isActive = marketCategoryFilter === cat.id;
                      const IconComp = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setMarketCategoryFilter(cat.id)}
                          className={`market-category-chip ${isActive ? 'active' : ''}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <IconComp size={12} style={{ opacity: isActive ? 1 : 0.75 }} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Status Dropdown */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      className="dropdown-select"
                      style={{ height: 34, fontSize: 12, padding: '0 10px', minWidth: 150 }}
                      value={marketStatusFilter}
                      onChange={(e) => setMarketStatusFilter(e.target.value)}
                    >
                      <option value="ALL">Status: All</option>
                      <option value="ACTIVE">Status: Published (Live)</option>
                      <option value="LOCKED">Status: Locked (Overpowered)</option>
                      <option value="DRAFT">Status: Backdoor Drafts</option>
                      <option value="RESOLVED">Status: Resolved</option>
                      <option value="VOIDED">Status: Voided</option>
                    </select>
                  </div>
                </div>

                {/* Search Input Bar */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 8, padding: '0 12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Search size={15} color="#64748B" style={{ marginRight: 8 }} />
                  <input
                    type="text"
                    placeholder="Search trade question, subcategory (e.g. Spotify, Music, Grammys, Elections), or rules..."
                    value={marketSearchText}
                    onChange={(e) => setMarketSearchText(e.target.value)}
                    style={{
                      flex: 1,
                      height: 36,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: 12.5,
                    }}
                  />
                  {marketSearchText && (
                    <button
                      onClick={() => setMarketSearchText('')}
                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {marketSubTab === 'markets' ? (
              /* Markets Table */
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 260 }}>Trade Question</th>
                      <th style={{ minWidth: 140 }}>Category</th>
                      <th style={{ minWidth: 160 }}>Odds &amp; Outcomes</th>
                      <th style={{ minWidth: 110 }}>Pool Volume</th>
                      <th style={{ minWidth: 95 }}>Publish Status</th>
                      <th style={{ minWidth: 110 }}>Closing Date</th>
                      <th style={{ textAlign: 'right', minWidth: 155 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminMarkets.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px 12px', color: '#64748B' }}>
                          No markets found matching your current filter. Click <strong>"Set Manual Trade (Backdoor)"</strong> to create one!
                        </td>
                      </tr>
                    ) : (
                      filteredAdminMarkets.map((mkt) => {
                        const isDraft = mkt.status === 'DRAFT';
                        const isActive = mkt.status === 'ACTIVE';
                        const isResolved = mkt.status === 'RESOLVED';
                        const isVoided = mkt.status === 'VOIDED';

                        // Badge color per category
                        let catColor = '#3B82F6';
                        if (mkt.category === 'Entertainment') catColor = '#A855F7';
                        if (mkt.category === 'Politics') catColor = '#38BDF8';
                        if (mkt.category === 'Live Event Prediction' || mkt.category === 'Real Life Events') catColor = '#F59E0B';
                        if (mkt.category === 'Pop Culture') catColor = '#EC4899';
                        if (mkt.category === 'Football' || mkt.category === 'European Football') catColor = '#00D285';
                        if (mkt.category === 'Boxing') catColor = '#EF4444';
                        if (mkt.category === 'UFC' || mkt.category === 'UFC & Boxing') catColor = '#E11D48';
                        if (mkt.category === 'Basketball' || mkt.category === 'NBA Basketball') catColor = '#F97316';

                        return (
                          <tr key={mkt.id || mkt._id}>
                            {/* Question Title without messy wrapping */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="market-question-title" style={{ fontWeight: '500', color: 'var(--text-white)', fontSize: 13 }}>
                                  {mkt.title || mkt.pair}
                                </span>
                                {mkt.rules && (
                                  <span
                                    title={`Question Rules: ${mkt.rules}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 15,
                                      height: 15,
                                      borderRadius: '50%',
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      color: '#94A3B8',
                                      fontSize: 9.5,
                                      fontWeight: '500',
                                      cursor: 'help',
                                      flexShrink: 0
                                    }}
                                  >
                                    i
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Clean Category & Subcategory Tag */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                                <span
                                  className="market-cat-badge"
                                  style={{
                                    color: catColor,
                                    backgroundColor: `${catColor}15`,
                                    border: `1px solid ${catColor}35`,
                                  }}
                                >
                                  {mkt.category || 'General'}
                                </span>
                                {mkt.subcategory && (
                                  <span style={{ fontSize: 10.5, color: '#94A3B8' }}>
                                    {mkt.subcategory}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Odds & Outcomes */}
                            <td>
                              {mkt.marketType === 'YES_NO' || (!mkt.marketType && mkt.options?.length === 2) ? (
                                <div style={{ display: 'flex', gap: 5 }}>
                                  {mkt.options?.map((opt, optIdx) => (
                                    <span
                                      key={opt._id || `${opt.id || 'opt'}_${optIdx}`}
                                      className={`market-odds-pill ${(opt.id || opt.label || '').toLowerCase() === 'yes' ? 'yes' : 'no'}`}
                                    >
                                      {opt.label}: {Number(opt.odds || 1.9).toFixed(2)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div
                                  title={mkt.options?.map(o => `${o.label} (${Number(o.odds || 2).toFixed(2)})`).join(', ')}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'help' }}
                                >
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3B82F6',
                                    border: '1px solid rgba(59, 130, 246, 0.25)'
                                  }}>
                                    <Layers size={11} />
                                    <span>{mkt.options?.length || 0} Choices</span>
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {mkt.options?.slice(0, 2).map(o => o.label).join(', ')}{mkt.options?.length > 2 ? '...' : ''}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Pool Volume */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#00D285', fontWeight: '500', fontSize: 12.5 }}>
                                  ₦{(mkt.poolAmount || 0).toLocaleString()}
                                </span>
                                <span style={{ color: '#64748B', fontSize: 10.5 }}>
                                  {mkt.betCount || 0} bets
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td>
                              {mkt.isLocked || mkt.isOverpowered || mkt.status === 'SUSPENDED' ? (
                                <span className="market-status-pill locked" title={mkt.lockedReason || 'Overpowered crowd safeguard'}>
                                  <Lock size={10} />
                                  <span>LOCKED</span>
                                </span>
                              ) : (
                                <span
                                  className={`market-status-pill ${
                                    isDraft ? 'draft' : isActive ? 'active' : isResolved ? 'resolved' : 'voided'
                                  }`}
                                >
                                  {isDraft
                                    ? 'DRAFT'
                                    : isActive
                                    ? 'PUBLISHED'
                                    : isResolved
                                    ? 'RESOLVED'
                                    : mkt.status}
                                </span>
                              )}
                            </td>

                            {/* Closing Date */}
                            <td style={{ color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap' }}>
                              {mkt.closingDate
                                ? new Date(mkt.closingDate).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Open'}
                            </td>

                            {/* Aligned Icon Actions with Tooltips */}
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div className="market-actions-group">
                                {/* Overpower Lock / Unlock Action Button */}
                                {!isResolved && !isVoided && (
                                  <button
                                    type="button"
                                    className={`market-action-btn ${
                                      (mkt.isLocked || mkt.isOverpowered || mkt.status === 'SUSPENDED') ? 'unlock' : 'lock'
                                    }`}
                                    onClick={() => handleToggleMarketLock(mkt.id || mkt._id, Boolean(mkt.isLocked || mkt.isOverpowered || mkt.status === 'SUSPENDED'))}
                                    title={
                                      (mkt.isLocked || mkt.isOverpowered || mkt.status === 'SUSPENDED')
                                        ? 'Unlock market for client trading'
                                        : 'Lock market: Overpowered crowd (>70%) safeguard'
                                    }
                                  >
                                    {(mkt.isLocked || mkt.isOverpowered || mkt.status === 'SUSPENDED') ? (
                                      <Unlock size={13} />
                                    ) : (
                                      <Lock size={13} />
                                    )}
                                  </button>
                                )}

                                {/* Publish / Unpublish Toggle */}
                                {!isResolved && !isVoided && (
                                  <button
                                    type="button"
                                    className={`market-action-btn ${isDraft ? 'publish' : 'unpublish'}`}
                                    onClick={() => handleTogglePublish(mkt.id || mkt._id)}
                                    title={isDraft ? 'Publish to live market for users' : 'Unpublish back to private draft'}
                                  >
                                    {isDraft ? <Send size={13} /> : <EyeOff size={13} />}
                                  </button>
                                )}

                                {/* Settle / Resolve Button */}
                                {!isResolved && !isVoided && (
                                  <button
                                    type="button"
                                    className="market-action-btn resolve"
                                    onClick={() => handleOpenResolveModal(mkt)}
                                    title="Settle winning outcome & payout winners"
                                  >
                                    <Award size={13} />
                                  </button>
                                )}

                                {/* Void / Cancel Button */}
                                {!isResolved && !isVoided && (
                                  <button
                                    type="button"
                                    className="market-action-btn void"
                                    onClick={() => handleVoidMarket(mkt.id || mkt._id, mkt.title)}
                                    title="Void market and refund all user stakes"
                                  >
                                    <AlertTriangle size={13} />
                                  </button>
                                )}

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  className="market-action-btn delete"
                                  onClick={() => handleDeleteMarket(mkt.id || mkt._id, mkt.title)}
                                  title="Delete market permanently"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              ) : (
              /* Sports Matches & Safeguard Overpower Table */
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 240 }}>Match / Fixture</th>
                      <th>Sport &amp; League</th>
                      <th>Scheduled Kickoff</th>
                      <th>Pool Volume</th>
                      <th>Status &amp; Safeguard</th>
                      <th style={{ textAlign: 'right', minWidth: 90 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminMatches.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px 12px', color: '#64748B' }}>
                          No sports matches found matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAdminMatches.map((match) => {
                        const isMatchLocked = Boolean(match.isLocked || match.isOverpowered || match.status === 'SUSPENDED');
                        return (
                          <tr key={match._id || match.id}>
                            <td>
                              <div style={{ fontWeight: '500', color: 'var(--text-white)', fontSize: 13 }}>
                                {match.homeTeam} vs {match.awayTeam}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  1: <strong style={{ color: 'var(--text-white)' }}>{match.odds?.home || 1.85}</strong> &bull; X: <strong style={{ color: 'var(--text-white)' }}>{match.odds?.draw || 3.10}</strong> &bull; 2: <strong style={{ color: 'var(--text-white)' }}>{match.odds?.away || 2.40}</strong>
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: 10.5, fontWeight: '500', color: '#00D285' }}>
                                  {match.sport || 'Football'}
                                </span>
                                <span style={{ fontSize: 10.5, color: '#94A3B8' }}>
                                  {match.leagueName || match.league || 'Championship'}
                                </span>
                              </div>
                            </td>
                            <td style={{ color: '#cbd5e1', fontSize: 11 }}>
                              {match.startTime ? new Date(match.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Live'}
                            </td>
                            <td>
                              <span style={{ color: '#00D285', fontWeight: '500', fontSize: 12.5 }}>
                                ₦{(match.poolAmount || 0).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              {isMatchLocked ? (
                                <span className="market-status-pill locked">
                                  <Lock size={10} />
                                  <span>LOCKED</span>
                                </span>
                              ) : (
                                <span className={`market-status-pill ${match.status === 'LIVE' ? 'locked' : 'active'}`}>
                                  {match.status || 'UPCOMING'}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className={`market-action-btn ${isMatchLocked ? 'unlock' : 'lock'}`}
                                onClick={() => handleToggleMatchLock(match._id || match.id, isMatchLocked)}
                              >
                                {isMatchLocked ? (
                                  <>
                                    <Unlock size={11} />
                                    <span>Unlock Match</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock size={11} />
                                    <span>Lock (Overpowered)</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              )}
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
                    <Landmark size={14} />
                  </div>
                  <span className="vault-badge green">Active</span>
                </div>
                <span className="vault-label">Main Custody Pool</span>
                <span className="vault-amount" style={{ color: '#00D285' }}>₦{(vaultBalances.custodyPool || 0).toLocaleString()}</span>
                <span className="vault-sublabel">Institutional Reserve Wallet</span>
              </div>

              <div className="vault-card">
                <div className="vault-card-top">
                  <div className="vault-icon-box" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                    <Lock size={14} />
                  </div>
                  <span className="vault-badge blue">{metrics.activeTrades} Trades</span>
                </div>
                <span className="vault-label">Active Escrow Locked</span>
                <span className="vault-amount" style={{ color: '#3B82F6' }}>₦{(vaultBalances.escrowLocked || 0).toLocaleString()}</span>
                <span className="vault-sublabel">Currently Locked in Trades</span>
              </div>

              <div className="vault-card">
                <div className="vault-card-top">
                  <div className="vault-icon-box" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                    <ShieldCheck size={14} />
                  </div>
                  <span className="vault-badge orange">Multi-Sig</span>
                </div>
                <span className="vault-label">Cold Vault Reserves</span>
                <span className="vault-amount" style={{ color: '#F59E0B' }}>₦{(vaultBalances.coldReserve || 0).toLocaleString()}</span>
                <span className="vault-sublabel">Multi-Sig Hard Locked</span>
              </div>

              <div className="vault-card">
                <div className="vault-card-top">
                  <div className="vault-icon-box" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                    <ArrowLeftRight size={14} />
                  </div>
                  <span className="vault-badge purple">Live</span>
                </div>
                <span className="vault-label">Payout Bank Float</span>
                <span className="vault-amount" style={{ color: 'var(--text-white)' }}>₦{(vaultBalances.payoutBank || 0).toLocaleString()}</span>
                <span className="vault-sublabel">Automated Releases Float</span>
              </div>

              {/* 5th Card: Promo & Airdrop Treasury Vault */}
              <div className="vault-card" style={{ border: '1px solid rgba(236,72,153,0.3)', backgroundColor: 'rgba(236,72,153,0.03)' }}>
                <div className="vault-card-top">
                  <div className="vault-icon-box" style={{ background: 'rgba(236,72,153,0.15)', color: '#EC4899' }}>
                    <Gift size={14} />
                  </div>
                  <button
                    onClick={() => setShowPromoDepositModal(true)}
                    style={{
                      background: 'rgba(236,72,153,0.2)',
                      border: '1px solid rgba(236,72,153,0.4)',
                      color: '#EC4899',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={10} /> Top Up
                  </button>
                </div>
                <span className="vault-label">Promo Treasury Vault</span>
                <span className="vault-amount" style={{ color: '#EC4899' }}>₦{(vaultBalances.promoReserve || 0).toLocaleString()}</span>
                <span className="vault-sublabel">Disbursed: ₦{(vaultBalances.totalPromoDisbursed || 0).toLocaleString()}</span>
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
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#00D285' }}>Authorized</span>
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
                    <option value="promoReserve">Promo Treasury Vault</option>
                  </select>
                </div>
                <div className="vault-arrow-divider">
                  <ArrowLeftRight size={18} color="var(--color-primary)" />
                </div>
                <div className="vault-field-group">
                  <label className="vault-field-label">Destination Vault</label>
                  <select className="vault-select" value={transferDest} onChange={(e) => setTransferDest(e.target.value)}>
                    <option value="promoReserve">Promo Treasury Vault</option>
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

            {/* Random Bonus & Airdrop Dispatcher */}
            <section className="vault-transfer-card" style={{ border: '1px solid rgba(0,210,133,0.3)', backgroundColor: 'rgba(0,210,133,0.02)' }}>
              <div className="table-filter-row" style={{ marginBottom: 16 }}>
                <div>
                  <h3 className="card-heading" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} color="#00D285" />
                    Promotional Bonus &amp; Random Airdrop Launcher
                  </h3>
                  <p className="card-subheading">Reward random traders or user cohorts backed by the Promo Treasury Vault</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', padding: '6px 14px', borderRadius: 8 }}>
                  <Gift size={14} color="#EC4899" />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#EC4899' }}>
                    Available Vault: ₦{(vaultBalances.promoReserve || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div className="vault-field-group">
                  <label className="vault-field-label">Campaign Title</label>
                  <input
                    type="text"
                    className="vault-input"
                    placeholder="e.g. UCL Weekend Surge Bonus ⚽"
                    value={airdropCampaign}
                    onChange={(e) => setAirdropCampaign(e.target.value)}
                  />
                </div>

                <div className="vault-field-group">
                  <label className="vault-field-label">Target Audience</label>
                  <select
                    className="vault-select"
                    value={airdropAudience}
                    onChange={(e) => setAirdropAudience(e.target.value)}
                  >
                    <option value="random">🎲 Random Lucky Draw</option>
                    <option value="active_traders">⚡ Active Traders (Past 30 Days)</option>
                    <option value="top_traders">🏆 Top Tournament Traders</option>
                    <option value="all_users">👥 All Registered Users</option>
                  </select>
                </div>

                {(airdropAudience === 'random' || airdropAudience === 'top_traders') && (
                  <div className="vault-field-group">
                    <label className="vault-field-label">User Count</label>
                    <input
                      type="number"
                      className="vault-input"
                      placeholder="e.g. 25"
                      value={airdropCount}
                      onChange={(e) => setAirdropCount(e.target.value)}
                    />
                  </div>
                )}

                <div className="vault-field-group">
                  <label className="vault-field-label">Bonus Per User (₦)</label>
                  <input
                    type="number"
                    className="vault-input"
                    placeholder="1000"
                    value={airdropAmount}
                    onChange={(e) => setAirdropAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Live Cost & Liquidity Check Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid #1e293b',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 500 }}>Est. Recipients</span>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
                      {airdropAudience === 'random' || airdropAudience === 'top_traders' ? (airdropCount || 0) : 'All Eligible'} Users
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 500 }}>Per User</span>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#00D285' }}>
                      ₦{parseFloat(airdropAmount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 500 }}>Total Budget Required</span>
                    <div style={{ fontSize: 15, fontWeight: 600, color: ((airdropAudience === 'random' || airdropAudience === 'top_traders') ? (parseInt(airdropCount) || 0) * (parseFloat(airdropAmount) || 0) : (parseFloat(airdropAmount) || 0)) > (vaultBalances.promoReserve || 0) ? '#EF4444' : '#3B82F6' }}>
                      ₦{((airdropAudience === 'random' || airdropAudience === 'top_traders') ? ((parseInt(airdropCount) || 0) * (parseFloat(airdropAmount) || 0)).toLocaleString() : 'Calculated on launch')}
                    </div>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleLaunchAirdrop}
                  disabled={isLaunchingAirdrop || (vaultBalances.promoReserve || 0) <= 0}
                  style={{
                    backgroundColor: '#00D285',
                    color: '#090d16',
                    fontWeight: 600,
                    padding: '12px 24px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: (vaultBalances.promoReserve || 0) <= 0 ? 'not-allowed' : 'pointer',
                    opacity: isLaunchingAirdrop || (vaultBalances.promoReserve || 0) <= 0 ? 0.6 : 1
                  }}
                >
                  <Send size={15} />
                  {isLaunchingAirdrop ? 'Dispatching...' : 'Launch Airdrop 🚀'}
                </button>
              </div>
            </section>

            {/* Unified Ledger & History Table */}
            <section className="recent-trades-card">
              <div className="table-filter-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div className="table-tabs-row">
                  <button
                    type="button"
                    onClick={() => setVaultTableTab('balances')}
                    className={`table-tab-btn ${vaultTableTab === 'balances' ? 'active' : ''}`}
                  >
                    <Users size={13} />
                    <span>User Accounts &amp; Escrow Ledger</span>
                    <span className="table-tab-badge">
                      {filteredUserBalances.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVaultTableTab('airdrop')}
                    className={`table-tab-btn ${vaultTableTab === 'airdrop' ? 'active' : ''}`}
                  >
                    <Gift size={13} />
                    <span>Airdrop &amp; Bonus Distribution</span>
                    <span className="table-tab-badge">
                      {filteredAirdropHistory.length}
                    </span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {vaultTableTab === 'airdrop' && (
                    <button className="export-btn" onClick={fetchAirdropHistory} title="Refresh Airdrop History">
                      <RefreshCw size={13} />
                      <span>Refresh</span>
                    </button>
                  )}
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                    50 per page
                  </span>
                </div>
              </div>

              <div className="trades-table-container">
                {vaultTableTab === 'balances' ? (
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
                      {filteredUserBalances.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>
                            {searchQuery ? 'No accounts match your search.' : 'No user records found.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedUserBalances.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(0, 210, 133, 0.12)',
                                  color: '#00D285',
                                  fontWeight: 500,
                                  fontSize: 11,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {(user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 500, color: 'var(--text-white)', fontSize: 12 }}>{user.name}</span>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ color: '#00D285', fontWeight: '500', fontSize: 12 }}>₦{(user.balance || 0).toLocaleString()}</td>
                            <td style={{ color: 'var(--text-white)', fontWeight: '500', fontSize: 12 }}>{(user.stock || 0).toLocaleString()} Units</td>
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
                              <button className="notif-action-btn" onClick={() => handleOpenCreditModal(user)}>
                                Credit Wallet
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="trades-table">
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Audience</th>
                        <th>Per User</th>
                        <th>Recipients</th>
                        <th>Total Disbursed</th>
                        <th>Executed By</th>
                        <th style={{ textAlign: 'right' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAirdropHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>
                            <Gift size={32} strokeWidth={1} style={{ marginBottom: 6, opacity: 0.5, display: 'block', margin: '0 auto 6px' }} />
                            {searchQuery ? 'No airdrop events match your search.' : 'No airdrop events recorded yet.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedAirdropHistory.map((item, idx) => (
                          <tr key={item._id || idx}>
                            <td style={{ fontWeight: 500, color: 'var(--text-white)', fontSize: 12 }}>{item.campaignName}</td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: 10,
                                fontWeight: 500,
                                backgroundColor: item.targetAudience === 'random' ? 'rgba(0,210,133,0.1)' : 'rgba(59,130,246,0.1)',
                                color: item.targetAudience === 'random' ? '#00D285' : '#3B82F6',
                                textTransform: 'uppercase'
                              }}>
                                {item.targetAudience?.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ color: '#00D285', fontWeight: 500, fontSize: 12 }}>₦{(item.amountPerUser || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: 500, fontSize: 12 }}>{item.recipientCount} traders</td>
                            <td style={{ color: '#EC4899', fontWeight: 600, fontSize: 12 }}>₦{(item.totalDistributed || 0).toLocaleString()}</td>
                            <td style={{ color: '#94a3b8', fontSize: 12 }}>{item.executedBy || 'Admin'}</td>
                            <td style={{ color: '#64748b', fontSize: 12, textAlign: 'right' }}>
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              {vaultTableTab === 'balances' ? (
                <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Showing {filteredUserBalances.length === 0 ? 0 : (vaultBalancesPage - 1) * vaultPerPage + 1}-
                    {Math.min(vaultBalancesPage * vaultPerPage, filteredUserBalances.length)} of {filteredUserBalances.length} accounts
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="filter-btn"
                      onClick={() => setVaultBalancesPage(p => Math.max(p - 1, 1))}
                      disabled={vaultBalancesPage === 1}
                      style={{ padding: '4px 10px', fontSize: 11, cursor: vaultBalancesPage === 1 ? 'not-allowed' : 'pointer', opacity: vaultBalancesPage === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Page {vaultBalancesPage} of {totalVaultBalancePages}
                    </span>
                    <button
                      className="filter-btn"
                      onClick={() => setVaultBalancesPage(p => Math.min(p + 1, totalVaultBalancePages))}
                      disabled={vaultBalancesPage >= totalVaultBalancePages}
                      style={{ padding: '4px 10px', fontSize: 11, cursor: vaultBalancesPage >= totalVaultBalancePages ? 'not-allowed' : 'pointer', opacity: vaultBalancesPage >= totalVaultBalancePages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Showing {filteredAirdropHistory.length === 0 ? 0 : (vaultAirdropPage - 1) * vaultPerPage + 1}-
                    {Math.min(vaultAirdropPage * vaultPerPage, filteredAirdropHistory.length)} of {filteredAirdropHistory.length} records
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="filter-btn"
                      onClick={() => setVaultAirdropPage(p => Math.max(p - 1, 1))}
                      disabled={vaultAirdropPage === 1}
                      style={{ padding: '4px 10px', fontSize: 11, cursor: vaultAirdropPage === 1 ? 'not-allowed' : 'pointer', opacity: vaultAirdropPage === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Page {vaultAirdropPage} of {totalVaultAirdropPages}
                    </span>
                    <button
                      className="filter-btn"
                      onClick={() => setVaultAirdropPage(p => Math.min(p + 1, totalVaultAirdropPages))}
                      disabled={vaultAirdropPage >= totalVaultAirdropPages}
                      style={{ padding: '4px 10px', fontSize: 11, cursor: vaultAirdropPage >= totalVaultAirdropPages ? 'not-allowed' : 'pointer', opacity: vaultAirdropPage >= totalVaultAirdropPages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          </main>
        ) : activeTab === 'users' ? (
          <main className="dashboard-container">
            {/* Header section */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">User Accounts &amp; Verification</h2>
                <p className="overview-sub">Manage platform user accounts, credit user wallet balances, and review identity verification status.</p>
              </div>
            </div>

            {/* User Statistics Ribbon */}
            <div className="user-stats-grid">
              <div className="user-stat-card">
                <span className="user-stat-label">Total Users</span>
                <span className="user-stat-value">{kycUsers.length}</span>
                <span className="user-stat-subtext">All registered accounts</span>
              </div>
              <div className="user-stat-card">
                <span className="user-stat-label">Active / Verified</span>
                <span className="user-stat-value" style={{ color: '#00D285' }}>
                  {kycUsers.filter(u => u.status === 'APPROVED' || u.isVerified).length}
                </span>
                <span className="user-stat-subtext">KYC approved &amp; verified</span>
              </div>
              <div className="user-stat-card">
                <span className="user-stat-label">Pending Verification</span>
                <span className="user-stat-value" style={{ color: '#F59E0B' }}>
                  {kycUsers.filter(u => u.status === 'PENDING').length}
                </span>
                <span className="user-stat-subtext">Awaiting identity review</span>
              </div>
              <div className="user-stat-card">
                <span className="user-stat-label">Unverified / None</span>
                <span className="user-stat-value" style={{ color: '#EF4444' }}>
                  {kycUsers.filter(u => u.status === 'REJECTED' || u.status === 'NONE' || (!u.isVerified && u.status !== 'PENDING')).length}
                </span>
                <span className="user-stat-subtext">Requires attention</span>
              </div>
              <div className="user-stat-card">
                <span className="user-stat-label">Total Client Balances</span>
                <span className="user-stat-value" style={{ color: '#3B82F6' }}>
                  ₦{kycUsers.reduce((sum, u) => sum + (u.balance || 0), 0).toLocaleString()}
                </span>
                <span className="user-stat-subtext">Cumulative user deposits</span>
              </div>
            </div>

            {/* Filter controls card */}
            <div className="table-filter-card" style={{ marginBottom: 20, padding: '14px 20px', backgroundColor: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px', minWidth: 320, flex: 1, maxWidth: 440 }}>
                  <Search size={15} color="var(--text-muted)" style={{ marginRight: 8 }} />
                  <input
                    type="text"
                    placeholder="Search name, email, phone number..."
                    style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-white)', outline: 'none', fontSize: 12.5, width: '100%' }}
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
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: '500' }}>Verification Status:</span>
                  <select
                    className="dropdown-select"
                    style={{ height: 34, padding: '0 12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-white)', borderRadius: 7, fontSize: 12 }}
                    value={kycStatusFilter}
                    onChange={(e) => setKycStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Users</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="NONE">Unverified / None</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Users Registry Card */}
            <section className="recent-trades-card">
              <div className="table-filter-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <h3 className="card-heading" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      Registered Platform Users
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11.5,
                        fontWeight: 500,
                        backgroundColor: 'rgba(0, 210, 133, 0.12)',
                        color: '#00D285',
                        border: '1px solid rgba(0, 210, 133, 0.25)'
                      }}>
                        {filteredKycUsers.length} Users
                      </span>
                    </h3>
                    <p className="card-subheading">Prioritised registry with instant profile inspector and quick actions</p>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="trades-table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 150 }}>User Name</th>
                      <th style={{ minWidth: 160 }}>Email Address</th>
                      <th style={{ minWidth: 120 }}>Phone Number</th>
                      <th style={{ minWidth: 105 }}>Naira Balance</th>
                      <th style={{ minWidth: 95 }}>KYC Status</th>
                      <th style={{ textAlign: 'right', minWidth: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKycUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '36px 0' }}>
                          No user records found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedKycUsers.map((user) => (
                        <tr key={user.id}>
                          {/* Name + Avatar */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="user-table-avatar">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '500', color: 'var(--text-white)', fontSize: 12.5 }}>
                                  {user.name}
                                </span>
                                {user.username && (
                                  <span style={{ fontSize: 10.5, color: '#64748B' }}>
                                    @{user.username}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td>
                            <span style={{ color: '#cbd5e1', fontSize: 11.5 }}>
                              {user.email || '—'}
                            </span>
                          </td>

                          {/* Phone */}
                          <td>
                            <span style={{ color: '#94A3B8', fontSize: 11.5, fontFamily: 'monospace' }}>
                              {user.phone || '—'}
                            </span>
                          </td>

                          {/* Naira Balance */}
                          <td style={{ color: '#00D285', fontWeight: '500', fontSize: 12.5 }}>
                            ₦{(user.balance || 0).toLocaleString()}
                          </td>

                          {/* KYC Status */}
                          <td>
                            <span
                              className="status-badge-td"
                              style={{
                                backgroundColor: user.status === 'APPROVED' ? 'rgba(0, 210, 133, 0.08)' :
                                  user.status === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                border: user.status === 'APPROVED' ? '1px solid rgba(0, 210, 133, 0.25)' :
                                  user.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                                color: user.status === 'APPROVED' ? '#00D285' :
                                  user.status === 'PENDING' ? '#F59E0B' : '#EF4444',
                                fontSize: 9.5,
                                fontWeight: '500',
                                padding: '3px 8px',
                                borderRadius: 4
                              }}
                            >
                              {user.status}
                            </span>
                          </td>

                          {/* Compact Action Icons */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div className="user-actions-group">
                              {/* View Full Profile Card */}
                              <button
                                type="button"
                                className="user-action-btn view"
                                title="View Full Profile Card & Additional Details"
                                onClick={() => setSelectedKycUser(user)}
                              >
                                <Eye size={13} />
                              </button>

                              {/* Credit User Wallet */}
                              <button
                                type="button"
                                className="user-action-btn credit"
                                title="Credit User Wallet Balance"
                                onClick={() => handleOpenCreditModal(user)}
                              >
                                <PlusCircle size={13} />
                              </button>

                              {/* Approve / Reject / Reset KYC */}
                              {user.status === 'PENDING' ? (
                                <>
                                  <button
                                    type="button"
                                    className="user-action-btn approve"
                                    title="Approve User KYC"
                                    onClick={() => handleUpdateKycStatus(user.id, 'APPROVED')}
                                  >
                                    <CheckCircle size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="user-action-btn reject"
                                    title="Reject User KYC"
                                    onClick={() => handleUpdateKycStatus(user.id, 'REJECTED')}
                                  >
                                    <X size={13} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="user-action-btn reset"
                                  title="Reset Status to Pending"
                                  onClick={() => handleUpdateKycStatus(user.id, 'PENDING')}
                                >
                                  <RefreshCw size={12} />
                                </button>
                              )}

                              {/* Delete User Account */}
                              <button
                                type="button"
                                className="user-action-btn delete"
                                title={`Permanently Delete "${user.name}"`}
                                onClick={() => handleDeleteUser(user.id, user.name)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Users pagination controller */}
              <div className="table-pagination-row">
                <span className="pagination-info">
                  Showing {filteredKycUsers.length === 0 ? 0 : (userPage - 1) * userPerPage + 1}-
                  {Math.min(userPage * userPerPage, filteredKycUsers.length)} of{' '}
                  {filteredKycUsers.length} users
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Per page:</span>
                    <select
                      className="dropdown-select"
                      style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                      value={userPerPage}
                      onChange={(e) => {
                        setUserPerPage(Number(e.target.value));
                        setUserPage(1);
                      }}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={500}>All</option>
                    </select>
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pag-btn"
                      onClick={() => setUserPage(Math.max(userPage - 1, 1))}
                      disabled={userPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 6px' }}>
                      Page {userPage} of {userTotalPages}
                    </span>
                    <button
                      className="pag-btn"
                      onClick={() => setUserPage(Math.min(userPage + 1, userTotalPages))}
                      disabled={userPage >= userTotalPages}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </main>
        ) : activeTab === 'referrals' ? (
          <main className="dashboard-container">
            {/* Referral Management Header */}
            <div className="section-header">
              <div>
                <h2 className="overview-title">Referral Program</h2>
                <p className="overview-sub">Manage referral bonuses, track performance, and configure the referral system.</p>
              </div>
              <button className="export-btn" onClick={fetchReferralStats}>
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Stats Cards */}
            <section className="metrics-grid" style={{ marginBottom: 24 }}>
              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <UserPlus size={16} color="#00D285" />
                  </div>
                  <span className="metric-change-badge positive">All Time</span>
                </div>
                <span className="metric-label">Total Referrals</span>
                <span className="metric-value">{(referralStats.totalReferrals || 0).toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <Award size={16} color="#3B82F6" />
                  </div>
                  <span className="metric-change-badge positive">Rewarded</span>
                </div>
                <span className="metric-label">Total Bonus Paid</span>
                <span className="metric-value">₦{(referralStats.totalBonusPaid || 0).toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <Share2 size={16} color="#F59E0B" />
                  </div>
                  <span className="metric-change-badge positive">Active</span>
                </div>
                <span className="metric-label">Active Referrers</span>
                <span className="metric-value">{(referralStats.activeReferrers || 0).toLocaleString()}</span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon-box">
                    <Gift size={16} color="#8B5CF6" />
                  </div>
                  <span className="metric-change-badge" style={{ color: '#8B5CF6' }}>In Queue</span>
                </div>
                <span className="metric-label">Pending Referrals</span>
                <span className="metric-value">{(referralStats.pendingReferrals || 0).toLocaleString()}</span>
              </div>
            </section>

            {/* Configuration Form */}
            <section className="referral-config-card">
              <div className="referral-config-header">
                <div>
                  <h3 className="referral-config-title">
                    <Settings size={16} color="#00D285" />
                    Referral Program Configuration
                  </h3>
                  <p className="referral-config-sub">Configure referral reward tiers, new user perks, and anti-abuse win-share limits.</p>
                </div>
                <button
                  onClick={saveReferralSettings}
                  disabled={isSavingReferral}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 500,
                    opacity: isSavingReferral ? 0.7 : 1
                  }}
                >
                  <Save size={14} />
                  <span>{isSavingReferral ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>

              {/* Status Toggle Box */}
              <div className="referral-status-toggle-box">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Referral Program System</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 600,
                      backgroundColor: editReferralEnabled ? 'rgba(0,210,133,0.12)' : 'rgba(239,68,68,0.12)',
                      color: editReferralEnabled ? '#00D285' : '#EF4444',
                      border: editReferralEnabled ? '1px solid rgba(0,210,133,0.3)' : '1px solid rgba(239,68,68,0.3)',
                      textTransform: 'uppercase'
                    }}>
                      {editReferralEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    When enabled, users can invite friends and earn rewards upon qualifying trades
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditReferralEnabled(!editReferralEnabled)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  title={editReferralEnabled ? 'Disable Referral Program' : 'Enable Referral Program'}
                >
                  <ToggleLeft size={34} color={editReferralEnabled ? '#00D285' : '#64748b'} style={{ transform: editReferralEnabled ? 'scaleX(-1)' : 'none' }} />
                </button>
              </div>

              {/* Grid Inputs */}
              <div className="referral-grid-form">
                <div className="referral-input-group">
                  <label className="referral-input-label">Referrer Reward (₦)</label>
                  <input
                    type="number"
                    value={editReferrerBonus}
                    onChange={(e) => setEditReferrerBonus(e.target.value)}
                    placeholder="1000"
                    className="referral-input"
                  />
                  <span className="referral-input-hint">Credited to the affiliate who shared code</span>
                </div>

                <div className="referral-input-group">
                  <label className="referral-input-label">New Member Perk (₦)</label>
                  <input
                    type="number"
                    value={editRefereeBonus}
                    onChange={(e) => setEditRefereeBonus(e.target.value)}
                    placeholder="1000"
                    className="referral-input"
                  />
                  <span className="referral-input-hint">Welcome balance for joining friend</span>
                </div>

                <div className="referral-input-group">
                  <label className="referral-input-label">Win Receipt Share Bonus (₦)</label>
                  <input
                    type="number"
                    value={editWinShareBonus}
                    onChange={(e) => setEditWinShareBonus(e.target.value)}
                    placeholder="1000"
                    className="referral-input"
                  />
                  <span className="referral-input-hint">Reward for social media victory post</span>
                </div>

                <div className="referral-input-group">
                  <label className="referral-input-label">Max Win Shares / Week</label>
                  <input
                    type="number"
                    value={editWinWeeklyLimit}
                    onChange={(e) => setEditWinWeeklyLimit(e.target.value)}
                    placeholder="3"
                    className="referral-input"
                  />
                  <span className="referral-input-hint">Anti-abuse weekly claim limit per user</span>
                </div>
              </div>

              {/* Description field */}
              <div className="referral-input-group">
                <label className="referral-input-label">Program Description &amp; Terms</label>
                <textarea
                  value={editReferralDescription}
                  onChange={(e) => setEditReferralDescription(e.target.value)}
                  placeholder="Describe program rules and eligibility..."
                  rows={2}
                  className="referral-textarea"
                />
              </div>
            </section>

            {/* Unified Referral Records & Leaderboard Table */}
            <section className="recent-trades-card">
              <div className="table-filter-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                {/* Category navigation pills */}
                <div className="table-tabs-row">
                  <button
                    type="button"
                    onClick={() => setReferralCategory('all')}
                    className={`table-tab-btn ${referralCategory === 'all' ? 'active' : ''}`}
                  >
                    <UserPlus size={13} />
                    <span>All Referrals</span>
                    <span className="table-tab-badge">
                      {filteredAllReferrals.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReferralCategory('top')}
                    className={`table-tab-btn ${referralCategory === 'top' ? 'active' : ''}`}
                  >
                    <Award size={13} />
                    <span>Top Referrers</span>
                    <span className="table-tab-badge">
                      {filteredTopReferrers.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReferralCategory('recent')}
                    className={`table-tab-btn ${referralCategory === 'recent' ? 'active' : ''}`}
                  >
                    <Activity size={13} />
                    <span>Recent Activity</span>
                    <span className="table-tab-badge">
                      {filteredRecentReferrals.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReferralCategory('win_shares')}
                    className={`table-tab-btn ${referralCategory === 'win_shares' ? 'active' : ''}`}
                  >
                    <Share2 size={13} />
                    <span>Win Receipt Shares</span>
                    <span className="table-tab-badge">
                      {filteredWinShares.length}
                    </span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="export-btn" onClick={fetchReferralStats} title="Refresh referral telemetry">
                    <RefreshCw size={13} />
                    <span>Refresh</span>
                  </button>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                    25 per page
                  </span>
                </div>
              </div>

              {/* Table Body Content */}
              <div className="trades-table-container">
                {referralCategory === 'top' ? (
                  /* Top Referrers View */
                  <table className="trades-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60, textAlign: 'center' }}>Rank</th>
                        <th>Referrer User</th>
                        <th>Referral Code</th>
                        <th>Network Size</th>
                        <th>Total Earnings</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReferralList.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '36px 0' }}>
                            <Award size={36} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.5, display: 'block', margin: '0 auto 8px' }} />
                            {searchQuery ? 'No top referrers match your search.' : 'No referral leaderboard data yet.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedReferrals.map((r, i) => {
                          const info = getTopReferrerInfo(r);
                          const rank = (referralPage - 1) * referralPerPage + i + 1;
                          const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
                          return (
                            <tr key={r._id || r.id || `${info.code}_${i}`}>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`referral-rank-badge ${rankClass}`}>
                                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                    color: '#F59E0B',
                                    fontWeight: 500,
                                    fontSize: 11,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    {(info.name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-white)', fontSize: 12 }}>{info.name}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{info.email || '—'}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="referral-code-pill">{info.code}</span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 500, color: '#00D285', fontSize: 12 }}>
                                  {info.count} traders
                                </span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#F59E0B', fontSize: 12 }}>
                                  ₦{info.earnings.toLocaleString()}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className="status-badge-td" style={{
                                  backgroundColor: 'rgba(0, 210, 133, 0.08)',
                                  border: '1px solid rgba(0, 210, 133, 0.25)',
                                  color: '#00D285'
                                }}>
                                  Active Partner
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                ) : referralCategory === 'win_shares' ? (
                  /* Win Receipt Shares View */
                  <table className="trades-table">
                    <thead>
                      <tr>
                        <th>Trader</th>
                        <th>Social Platform</th>
                        <th>Slip Category</th>
                        <th>Bonus Disbursed</th>
                        <th style={{ textAlign: 'right' }}>Shared Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReferralList.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '36px 0' }}>
                            <Share2 size={36} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.5, display: 'block', margin: '0 auto 8px' }} />
                            {searchQuery ? 'No social shares match your search.' : 'No win receipt shares recorded yet.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedReferrals.map((ws, i) => {
                          const info = getWinShareInfo(ws);
                          return (
                            <tr key={ws._id || ws.id || i}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(168, 85, 247, 0.12)',
                                    color: '#A855F7',
                                    fontWeight: 500,
                                    fontSize: 11,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    {(info.name || 'T').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-white)', fontSize: 12 }}>{info.name}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{info.email || '—'}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 12,
                                  fontSize: 10,
                                  fontWeight: 500,
                                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                  color: '#38BDF8',
                                  border: '1px solid rgba(56, 189, 248, 0.25)',
                                  textTransform: 'capitalize'
                                }}>
                                  {ws.platform || 'Social Share'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--text-white)', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>
                                {ws.tradeType || 'Standard Trade'}
                              </td>
                              <td>
                                <span style={{ color: '#00D285', fontWeight: 600, fontSize: 12 }}>
                                  +₦{(ws.bonusAmount || 1000).toLocaleString()}
                                </span>
                              </td>
                              <td style={{ color: '#64748b', fontSize: 12, textAlign: 'right' }}>
                                {ws.sharedAt ? new Date(ws.sharedAt).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* All Referrals / Recent Activity View */
                  <table className="trades-table">
                    <thead>
                      <tr>
                        <th>Referrer</th>
                        <th>Referral Code</th>
                        <th>Referred New Member</th>
                        <th>Bonus Disbursed</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReferralList.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '36px 0' }}>
                            <UserPlus size={36} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.5, display: 'block', margin: '0 auto 8px' }} />
                            {searchQuery ? 'No referral activity matches your search.' : 'No referral transactions recorded yet.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedReferrals.map((ref, i) => {
                          const refInfo = getReferrerInfo(ref);
                          const feeInfo = getRefereeInfo(ref);
                          const totalDisbursed = (ref.referrerBonus || 0) + (ref.refereeBonus || 0);
                          const isCompleted = ref.status === 'completed' || ref.status === 'rewarded';
                          return (
                            <tr key={ref._id || ref.id || i}>
                              {/* Referrer */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(0, 210, 133, 0.12)',
                                    color: '#00D285',
                                    fontWeight: 500,
                                    fontSize: 11,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    {(refInfo.name || 'R').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-white)', fontSize: 12 }}>{refInfo.name}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{refInfo.email || '—'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Referral Code */}
                              <td>
                                <span className="referral-code-pill">{refInfo.code}</span>
                              </td>

                              {/* Referred New Member */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                    color: '#3B82F6',
                                    fontWeight: 500,
                                    fontSize: 11,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    {(feeInfo.name || 'M').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-white)', fontSize: 12 }}>{feeInfo.name}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{feeInfo.email || '—'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Bonus Disbursed */}
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ color: '#00D285', fontWeight: 500, fontSize: 12 }}>
                                    ₦{(totalDisbursed || 2000).toLocaleString()}
                                  </span>
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                    ₦{(ref.referrerBonus || 1000).toLocaleString()} / ₦{(ref.refereeBonus || 1000).toLocaleString()}
                                  </span>
                                </div>
                              </td>

                              {/* Status */}
                              <td>
                                <span className="status-badge-td" style={{
                                  backgroundColor: isCompleted ? 'rgba(0, 210, 133, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                  border: isCompleted ? '1px solid rgba(0, 210, 133, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                                  color: isCompleted ? '#00D285' : '#F59E0B'
                                }}>
                                  {ref.status || 'rewarded'}
                                </span>
                              </td>

                              {/* Date */}
                              <td style={{ color: '#64748b', fontSize: 12, textAlign: 'right' }}>
                                {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Showing {activeReferralList.length === 0 ? 0 : (referralPage - 1) * referralPerPage + 1}-
                  {Math.min(referralPage * referralPerPage, activeReferralList.length)} of {activeReferralList.length} records
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="filter-btn"
                    onClick={() => setReferralPage(p => Math.max(p - 1, 1))}
                    disabled={referralPage === 1}
                    style={{ padding: '4px 10px', fontSize: 11, cursor: referralPage === 1 ? 'not-allowed' : 'pointer', opacity: referralPage === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Page {referralPage} of {totalReferralPages}
                  </span>
                  <button
                    className="filter-btn"
                    onClick={() => setReferralPage(p => Math.min(p + 1, totalReferralPages))}
                    disabled={referralPage >= totalReferralPages}
                    style={{ padding: '4px 10px', fontSize: 11, cursor: referralPage >= totalReferralPages ? 'not-allowed' : 'pointer', opacity: referralPage >= totalReferralPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </main>
        ) : (
          <main className="dashboard-container">
            {/* Screen Tab Placeholder */}
            <div className="placeholder-view">
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h2>
              <p>
                Administrative access options for Peeritrade escrow systems, clearing registries, risk managers, and network nodes. All live records and telemetry are synchronized directly with your MongoDB database.
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
              <h2>Initiate Escrow Trade</h2>
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

      {/* Set Manual Backdoor Trade Modal */}
      {isMarketModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-title-row">
              <div>
                <h2 style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>Set Manual Trade (Backdoor)</h2>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Configure prediction question, rules, and publishing status for live client markets.
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsMarketModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Template Presets Bar */}
            <div style={{ margin: '14px 0', padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: 11, fontWeight: '500', color: '#00D285', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚡ Quick Template Presets:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {[
                  { key: 'justin_streams', label: '🎵 Justin Bieber 50M Streams' },
                  { key: 'justin_grammy', label: '🏆 Justin Grammy Win' },
                  { key: 'movie_budget', label: '🎬 Movie Budget Pass' },
                  { key: 'spotify_most', label: '🎧 Most Spotify Streams' },
                  { key: 'politics_fed', label: '🏛️ Fed Rate Cut' },
                  { key: 'politics_election', label: '🗳️ Election Certification' },
                  { key: 'spacex_orbital', label: '🚀 SpaceX Orbital Catch' },
                  { key: 'gta_revenue', label: '🎮 GTA VI $1B Record' },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyTradePreset(preset.key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: '500',
                      backgroundColor: 'rgba(0, 210, 133, 0.08)',
                      border: '1px solid rgba(0, 210, 133, 0.25)',
                      color: '#00D285',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateMarket}>
              <div className="modal-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Category and Subcategory */}
                <div className="form-row-split">
                  <div className="form-group-wrap">
                    <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>Category</label>
                    <select
                      className="dropdown-select"
                      style={{ height: 42, width: '100%' }}
                      value={tradeCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setTradeCategory(newCat);
                        const found = APP_CATEGORIES.find((c) => c.id === newCat);
                        if (found && found.subcategories.length > 0) {
                          setTradeSubcategory(found.subcategories[0]);
                        }
                      }}
                    >
                      {APP_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-wrap">
                    <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>
                      Subcategory (Synchronized with App)
                    </label>
                    <select
                      className="dropdown-select"
                      style={{ height: 42, width: '100%' }}
                      value={tradeSubcategory}
                      onChange={(e) => setTradeSubcategory(e.target.value)}
                      required
                    >
                      {(
                        APP_CATEGORIES.find((c) => c.id === tradeCategory)?.subcategories || [
                          'General',
                        ]
                      ).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live App Sync Path Indicator */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(0, 210, 133, 0.08)',
                  border: '1px solid rgba(0, 210, 133, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#00D285',
                  marginTop: -4
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} color="#00D285" />
                    <span><strong>App Tab Target:</strong> {tradeCategory} &rarr; {tradeSubcategory}</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Verified Category
                  </span>
                </div>

                {/* Trade Question / Title */}
                <div className="form-group-wrap">
                  <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>
                    Trade Question / Market Title
                  </label>
                  <input
                    type="text"
                    className="form-input-text"
                    placeholder="e.g. Will Justin Bieber get 50M streams today yes or no"
                    value={tradeTitle}
                    onChange={(e) => setTradeTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Market Format Selection */}
                <div className="form-group-wrap">
                  <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>Question Format</label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setTradeMarketType('YES_NO')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: '500',
                        cursor: 'pointer',
                        backgroundColor: tradeMarketType === 'YES_NO' ? 'rgba(0, 210, 133, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: tradeMarketType === 'YES_NO' ? '1px solid #00D285' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: tradeMarketType === 'YES_NO' ? '#00D285' : '#94A3B8',
                      }}
                    >
                      ✓ Binary (Yes / No)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeMarketType('MULTIPLE_CHOICE')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: '500',
                        cursor: 'pointer',
                        backgroundColor: tradeMarketType === 'MULTIPLE_CHOICE' ? 'rgba(0, 210, 133, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: tradeMarketType === 'MULTIPLE_CHOICE' ? '1px solid #00D285' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: tradeMarketType === 'MULTIPLE_CHOICE' ? '#00D285' : '#94A3B8',
                      }}
                    >
                      ✓ Multiple Choice (e.g. Spotify Streams by Artist)
                    </button>
                  </div>
                </div>

                {/* Odds Configuration */}
                {tradeMarketType === 'YES_NO' ? (
                  <div className="form-row-split">
                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, fontWeight: '500', color: '#00D285' }}>YES Decimal Odds</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input-text"
                        placeholder="1.85"
                        value={tradeYesOdds}
                        onChange={(e) => setTradeYesOdds(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group-wrap">
                      <label style={{ fontSize: 12, fontWeight: '500', color: '#EF4444' }}>NO Decimal Odds</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input-text"
                        placeholder="1.95"
                        value={tradeNoOdds}
                        onChange={(e) => setTradeNoOdds(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group-wrap">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>Options &amp; Odds</label>
                      <button
                        type="button"
                        onClick={() =>
                          setTradeOptions([
                            ...tradeOptions,
                            { id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, label: '', odds: '2.00' },
                          ])
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00D285',
                          fontSize: 12,
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        + Add Choice
                      </button>
                    </div>
                    {tradeOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Option Name (e.g. Drake, Taylor Swift...)"
                          className="form-input-text"
                          style={{ flex: 2 }}
                          value={opt.label}
                          onChange={(e) => {
                            const next = [...tradeOptions];
                            next[idx].label = e.target.value;
                            setTradeOptions(next);
                          }}
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Odds"
                          className="form-input-text"
                          style={{ flex: 1 }}
                          value={opt.odds}
                          onChange={(e) => {
                            const next = [...tradeOptions];
                            next[idx].odds = e.target.value;
                            setTradeOptions(next);
                          }}
                          required
                        />
                        {tradeOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setTradeOptions(tradeOptions.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rules & Resolution Description */}
                <div className="form-group-wrap">
                  <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>
                    Rules &amp; Resolution Criteria (Settlement Conditions)
                  </label>
                  <textarea
                    className="form-input-text"
                    style={{ height: 75, resize: 'vertical', paddingTop: 8 }}
                    placeholder="Specify the exact rules under which this market resolves to YES, NO, or a specific option..."
                    value={tradeRules}
                    onChange={(e) => setTradeRules(e.target.value)}
                    required
                  />
                </div>

                {/* Resolution Source & Pool */}
                <div className="form-row-split">
                  <div className="form-group-wrap">
                    <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>
                      Resolution Source / Oracle
                    </label>
                    <input
                      type="text"
                      className="form-input-text"
                      placeholder="e.g. Spotify for Artists, Grammy.com, Box Office Mojo..."
                      value={tradeResolutionSource}
                      onChange={(e) => setTradeResolutionSource(e.target.value)}
                    />
                  </div>

                  <div className="form-group-wrap">
                    <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>
                      Initial Seed Pool (₦)
                    </label>
                    <input
                      type="number"
                      className="form-input-text"
                      placeholder="500000"
                      value={tradePoolAmount}
                      onChange={(e) => setTradePoolAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Trading Window & Publication Status */}
                <div className="form-row-split" style={{ alignItems: 'center' }}>
                  <div className="form-group-wrap">
                    <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>
                      Trading Window (Hours until close)
                    </label>
                    <input
                      type="number"
                      className="form-input-text"
                      placeholder="24"
                      value={tradeClosingHours}
                      onChange={(e) => setTradeClosingHours(e.target.value)}
                    />
                  </div>

                  <div className="form-group-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: '500', color: '#cbd5e1' }}>Publication Mode</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: tradePublishNow ? '#00D285' : '#F59E0B' }}>
                      <input
                        type="checkbox"
                        checked={tradePublishNow}
                        onChange={(e) => setTradePublishNow(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#00D285' }}
                      />
                      <span>
                        {tradePublishNow ? 'Publish Immediately (Live in App)' : 'Save as Backdoor Draft (Private)'}
                      </span>
                    </label>
                    <span style={{ fontSize: 11, color: tradePublishNow ? '#00D285' : '#F59E0B' }}>
                      {tradePublishNow ? '✓ Market will immediately appear on the User App under ' + tradeCategory : '⚠️ Private DRAFT: hidden from the User App until published'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-action-buttons" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsMarketModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {tradePublishNow ? 'Publish to Live Market' : 'Save Backdoor Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution & Payout Modal */}
      {isResolveModalOpen && resolvingMarket && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 480 }}>
            <div className="modal-title-row">
              <div>
                <h2 style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>Settle Trade &amp; Payout Winners</h2>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Official market resolution and automated winnings distribution.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsResolveModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ margin: '16px 0', padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 10 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '500' }}>
                {resolvingMarket.category} • {resolvingMarket.subcategory}
              </span>
              <h3 style={{ color: '#ffffff', fontSize: 14, marginTop: 4, fontWeight: 600, lineHeight: 1.4 }}>
                {resolvingMarket.title}
              </h3>
              {resolvingMarket.rules && (
                <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6, fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
                  "{resolvingMarket.rules}"
                </p>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: '500', color: '#ffffff', display: 'block', marginBottom: 8 }}>
                Select Declared Winning Outcome:
              </label>

              {resolvingMarket.marketType === 'YES_NO' || (!resolvingMarket.marketType && resolvingMarket.options?.length === 2) ? (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedWinningOption('yes')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 10,
                      fontSize: 16,
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: selectedWinningOption.toLowerCase() === 'yes' ? '#00D285' : 'rgba(0, 210, 133, 0.1)',
                      color: selectedWinningOption.toLowerCase() === 'yes' ? '#000000' : '#00D285',
                      border: '1px solid #00D285',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    YES (Winner)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWinningOption('no')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 10,
                      fontSize: 16,
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: selectedWinningOption.toLowerCase() === 'no' ? '#EF4444' : 'rgba(239, 68, 68, 0.1)',
                      color: selectedWinningOption.toLowerCase() === 'no' ? '#ffffff' : '#EF4444',
                      border: '1px solid #EF4444',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    NO (Winner)
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resolvingMarket.options?.map((opt, optIdx) => {
                    const isSelected = selectedWinningOption === opt.label || selectedWinningOption === opt.id;
                    return (
                      <button
                        key={opt._id || `${opt.id || 'opt'}_${optIdx}`}
                        type="button"
                        onClick={() => setSelectedWinningOption(opt.label)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: '500',
                          textAlign: 'left',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#00D285' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? '#000000' : '#ffffff',
                          border: isSelected ? '1px solid #00D285' : '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {opt.label} ({opt.odds?.toFixed(2)})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: 10, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: 18 }}>
              <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: '500', lineHeight: 1.4 }}>
                ⚠️ Warning: Executing settlement will credit wallet balances of all winning users, mark losing bets as LOST, and send real-time in-app notifications.
              </span>
            </div>

            <div className="modal-action-buttons">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsResolveModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmResolve}
                style={{ backgroundColor: '#00D285', color: '#000000', fontWeight: '600' }}
              >
                Confirm &amp; Pay Out Winners
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected KYC User Detail Card Modal */}
      {selectedKycUser && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-title-row">
              <h2>User Profile &amp; Verification Card</h2>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedKycUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '14px 0 20px', textAlign: 'center' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: '500',
                marginBottom: 10,
                border: '2px solid rgba(255, 255, 255, 0.15)'
              }}>
                {selectedKycUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h3 style={{ fontSize: 17, color: '#ffffff', fontWeight: 600, margin: '0 0 3px 0' }}>{selectedKycUser.name}</h3>
              {selectedKycUser.username && (
                <p style={{ fontSize: 12, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>@{selectedKycUser.username}</p>
              )}
              <p style={{ fontSize: 12.5, color: '#94A3B8', margin: '0 0 10px 0' }}>{selectedKycUser.email}</p>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span
                  className="status-badge-td"
                  style={{
                    backgroundColor: selectedKycUser.status === 'APPROVED' ? 'rgba(0, 210, 133, 0.1)' :
                      selectedKycUser.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: selectedKycUser.status === 'APPROVED' ? '1px solid rgba(0, 210, 133, 0.3)' :
                      selectedKycUser.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    color: selectedKycUser.status === 'APPROVED' ? '#00D285' :
                      selectedKycUser.status === 'PENDING' ? '#F59E0B' : '#EF4444',
                    fontSize: 10.5,
                    fontWeight: '500',
                    padding: '3px 10px',
                    borderRadius: 5
                  }}
                >
                  KYC: {selectedKycUser.status}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: '500',
                    padding: '3px 8px',
                    borderRadius: 5,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    textTransform: 'uppercase'
                  }}
                >
                  Role: {selectedKycUser.role || 'USER'}
                </span>
              </div>
            </div>

            {/* Profile Detail Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: 'rgba(13, 21, 39, 0.7)', padding: 14, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748b' }}>Phone Number:</span>
                <span style={{ color: '#ffffff', fontWeight: '500', fontFamily: 'monospace' }}>{selectedKycUser.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748b' }}>Wallet Balance:</span>
                <span style={{ color: '#00D285', fontWeight: '500' }}>₦{(selectedKycUser.balance || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748b' }}>Identification Doc:</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>{selectedKycUser.documentType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748b' }}>Doc / Account ID:</span>
                <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: 11 }}>{selectedKycUser.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748b' }}>Joined / Registered:</span>
                <span style={{ color: '#cbd5e1' }}>{selectedKycUser.date}</span>
              </div>
              {selectedKycUser.referralCode && selectedKycUser.referralCode !== 'N/A' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: '#64748b' }}>Referral Code:</span>
                  <span style={{ color: '#A855F7', fontWeight: '500', fontFamily: 'monospace' }}>{selectedKycUser.referralCode}</span>
                </div>
              )}
              {selectedKycUser.virtualAccount?.accountNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: '#64748b' }}>Virtual Account:</span>
                  <span style={{ color: '#38BDF8', fontWeight: '500' }}>
                    {selectedKycUser.virtualAccount.bankName} - {selectedKycUser.virtualAccount.accountNumber}
                  </span>
                </div>
              )}
              {selectedKycUser.idCardFront && (
                <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ color: '#64748b', fontSize: 12, display: 'block', marginBottom: 6 }}>KYC Document Upload:</span>
                  <a
                    href={selectedKycUser.idCardFront}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#38BDF8', textDecoration: 'underline' }}
                  >
                    View Uploaded Document Image / File
                  </a>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  color: '#EF4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
                onClick={() => handleDeleteUser(selectedKycUser.id, selectedKycUser.name)}
              >
                <Trash2 size={13} />
                <span>Delete Account</span>
              </button>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  onClick={() => {
                    handleOpenCreditModal(selectedKycUser);
                  }}
                >
                  <PlusCircle size={13} />
                  <span>Credit Wallet</span>
                </button>

                {selectedKycUser.status === 'PENDING' ? (
                  <>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ backgroundColor: '#EF4444', fontSize: 12 }}
                      onClick={() => {
                        handleUpdateKycStatus(selectedKycUser.id, 'REJECTED');
                        setSelectedKycUser(null);
                      }}
                    >
                      Reject KYC
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ fontSize: 12 }}
                      onClick={() => {
                        handleUpdateKycStatus(selectedKycUser.id, 'APPROVED');
                        setSelectedKycUser(null);
                      }}
                    >
                      Approve KYC
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      handleUpdateKycStatus(selectedKycUser.id, 'PENDING');
                      setSelectedKycUser(null);
                    }}
                  >
                    Reset Status
                  </button>
                )}

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: 12 }}
                  onClick={() => setSelectedKycUser(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit User Modal Popup */}
      {isCreditModalOpen && creditTargetUser && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 15, 30, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1e293b',
            borderRadius: 12,
            width: '100%',
            maxWidth: 480,
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PlusCircle size={20} color="#00D285" />
                Credit User Wallet
              </h3>
              <button
                onClick={() => { setIsCreditModalOpen(false); setCreditTargetUser(null); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: '500', color: '#f8fafc' }}>{creditTargetUser.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{creditTargetUser.email} • {creditTargetUser.phone}</div>
              <div style={{ fontSize: 13, color: '#00D285', fontWeight: 600, marginTop: 6 }}>
                Current Balance: ₦{(creditTargetUser.balance || 0).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleExecuteCredit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: '500', color: '#cbd5e1', marginBottom: 6 }}>
                  Amount to Credit (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 50000"
                  value={creditAmountInput}
                  onChange={(e) => setCreditAmountInput(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: '500',
                    outline: 'none'
                  }}
                />
                
                {/* Quick preset amount pills */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {[10000, 50000, 100000, 500000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCreditAmountInput(preset.toString())}
                      style={{
                        backgroundColor: creditAmountInput === preset.toString() ? 'rgba(0, 210, 133, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                        border: creditAmountInput === preset.toString() ? '1px solid #00D285' : '1px solid #334155',
                        color: creditAmountInput === preset.toString() ? '#00D285' : '#94a3b8',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      +₦{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: '500', color: '#cbd5e1', marginBottom: 6 }}>
                  Credit Note / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platform bonus credit / Manual deposit adjustment"
                  value={creditNoteInput}
                  onChange={(e) => setCreditNoteInput(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setIsCreditModalOpen(false); setCreditTargetUser(null); }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    borderRadius: 6,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCredit}
                  style={{
                    backgroundColor: '#00D285',
                    border: 'none',
                    color: '#090d16',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: isSubmittingCredit ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isSubmittingCredit ? 'Crediting...' : 'Confirm & Credit Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promo Vault Top-Up Modal */}
      {showPromoDepositModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 15, 30, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1e293b',
            borderRadius: 12,
            width: '100%',
            maxWidth: 480,
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gift size={20} color="#EC4899" />
                Deposit to Promo Treasury Vault
              </h3>
              <button
                onClick={() => setShowPromoDepositModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Current Promo Liquidity Reserve:</div>
              <div style={{ fontSize: 20, color: '#EC4899', fontWeight: 600, marginTop: 4 }}>
                ₦{(vaultBalances.promoReserve || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                All random bonuses, referral payouts, and airdrops are deducted from this pool.
              </div>
            </div>

            <form onSubmit={handleDepositPromo}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: '500', color: '#cbd5e1', marginBottom: 6 }}>
                  Deposit Amount (₦)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="any"
                  placeholder="e.g. 500000"
                  value={promoDepositAmount}
                  onChange={(e) => setPromoDepositAmount(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: '500',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: '500', color: '#cbd5e1', marginBottom: 6 }}>
                  Reference / Campaign Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marketing Liquidity Q4 Allocation"
                  value={promoDepositNote}
                  onChange={(e) => setPromoDepositNote(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowPromoDepositModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDepositingPromo}
                  style={{
                    backgroundColor: '#EC4899',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: isDepositingPromo ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isDepositingPromo ? 'Depositing...' : 'Confirm Deposit to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Confirmation Dialog */}
      {confirmModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={() => !confirmModal.isProcessing && setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          style={{ zIndex: 12000 }}
        >
          <div
            className="confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 440,
              width: '92%',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 14,
              border: '1px solid var(--border-color)',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: confirmModal.type === 'danger' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: `1px solid ${confirmModal.type === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                color: confirmModal.type === 'danger' ? '#EF4444' : '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {confirmModal.type === 'danger' ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-white)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                  {confirmModal.title}
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                disabled={confirmModal.isProcessing}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-light)',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.15s ease'
                }}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                disabled={confirmModal.isProcessing}
                onClick={async () => {
                  if (confirmModal.onConfirm) {
                    setConfirmModal(prev => ({ ...prev, isProcessing: true }));
                    try {
                      await confirmModal.onConfirm();
                    } finally {
                      setConfirmModal(prev => ({ ...prev, isOpen: false, isProcessing: false }));
                    }
                  } else {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: confirmModal.isProcessing ? 'not-allowed' : 'pointer',
                  backgroundColor: confirmModal.type === 'danger' ? '#EF4444' : '#00D285',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: confirmModal.type === 'danger' ? '0 4px 14px rgba(239, 68, 68, 0.35)' : '0 4px 14px rgba(0, 210, 133, 0.35)',
                  opacity: confirmModal.isProcessing ? 0.7 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {confirmModal.type === 'danger' && <Trash2 size={13} />}
                <span>{confirmModal.isProcessing ? 'Processing...' : confirmModal.confirmText || 'Confirm'}</span>
              </button>
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
