
import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';
import SubscriptionModal from './SubscriptionModal';
import authService from '../services/authService';
import { FiCpu, FiFileText, FiBarChart2, FiEdit, FiMenu, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ChatHistorySidebar from './ChatHistorySIdebar';
import { useConversation } from '../context/ConversationContext.jsx';
import api from '../services/api';
import { createTour } from '../tour';

// Navigation links component
const NavLinks = ({ onLinkClick, isCollapsed }) => {
    const navItems = [
        { to: "/ai-analyst", icon: <FiCpu />, label: "AI Data Analyst" },
        { to: "/manual-analysis", icon: <FiEdit />, label: "Manual Analysis" },
        { to: "/sample-size", icon: <FiBarChart2 />, label: "Sample Size Calculator" },
        { to: "/literature-review", icon: <FiFileText />, label: "Literature Review" },
    ];

    return (
        <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
            {navItems.map(item => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onLinkClick}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isCollapsed ? 'justify-center' : ''
                        } ${
                            isActive
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                    }
                >
                    <span className="text-lg">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
            ))}
        </nav>
    );
};


const AppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const tourRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const isAiAnalystPage = location.pathname.startsWith('/ai-analyst');
    const userRole = authService.getUserRole();
    const { selectedConversationId, setSelectedConversationId } = useConversation();

    const handleTakeTour = () => {
        // Navigate to AI analyst page
        navigate('/ai-analyst');
        
        // Create a new chat
        setSelectedConversationId(null);
        
        // Start the tour after a brief delay to ensure the page has loaded
        setTimeout(() => {
            if (tourRef.current) {
                tourRef.current.start();
            } else {
                const tour = createTour();
                tourRef.current = tour;
                tour.start();
            }
        }, 500);
    };

    const handleLogout = () => {
        authService.logout();
        window.location.href = '#/login';
    };

    const handleSubscriptionSuccess = (subscriptionData) => {
        setShowSubscriptionModal(false);
        // Refresh usage data
        const fetchUsage = async () => {
            try {
                const resp = await api.get('/users/me/usage');
                setUsage(resp.data);
            } catch (e) {
                // ignore
            }
        };
        fetchUsage();
        
        // Show success message
        alert(`Subscription created successfully! ${subscriptionData.promo_code_applied ? `Promo code "${subscriptionData.promo_code_applied}" applied with ₹${subscriptionData.discount_amount} discount!` : ''}`);
    };

    const [usage, setUsage] = useState(null);
    useEffect(() => {
        let mounted = true;
        const fetchUsage = async () => {
            try {
                const resp = await api.get('/users/me/usage');
                if (!mounted) return;
                setUsage(resp.data);
            } catch (e) {
                // ignore
            }
        };
        fetchUsage();
        return () => { mounted = false; };
    }, []);

    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    const UsageBox = ({ collapsed }) => (
        <div className={`${collapsed ? 'px-2' : ''} mb-3`}>
            {usage ? (
                usage.is_paid ? (
                    !collapsed && <div className="text-xs text-gray-600 dark:text-gray-300">Messages: Unlimited</div>
                ) : (
                    <div className="space-y-2">
                        {!collapsed && (
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                                Messages: <strong>{usage.remaining_free_messages}/{usage.free_limit}</strong>
                            </div>
                        )}
                        <button
                            onClick={() => setShowSubscriptionModal(true)}
                            className={`${collapsed ? 'p-2' : 'w-full px-3 py-1.5'} bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md font-medium transition-all`}
                            title={collapsed ? "Upgrade to Pro" : undefined}
                        >
                            {collapsed ? '⭐' : 'Upgrade to Pro'}
                        </button>
                    </div>
                )
            ) : null}
        </div>
    );

    // Sidebar content component
    const SidebarContent = ({ collapsed = false, onToggleCollapse }) => (
        <div className={`flex z-40 flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl lg:shadow-none transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'}`}>
            {/* Header */}
            <div className={`p-3 border-b border-gray-200 dark:border-gray-700 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} flex-shrink-0`}>
                {!collapsed && <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">GemmaStat</h1>}
                {collapsed && <span className="text-xl font-bold text-blue-600 dark:text-blue-400">G</span>}
                <button
                    onClick={onToggleCollapse || (() => setIsSidebarOpen(false))}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg hidden lg:block"
                    title={collapsed ? "Expand" : "Collapse"}
                >
                    {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                </button>
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md lg:hidden"
                >
                    <FiX size={24} />
                </button>
            </div>

            {/* Content Area */}
            {isAiAnalystPage ? (
                <ChatHistorySidebar
                    activeConversationId={selectedConversationId}
                    isCollapsed={collapsed}
                    onToggleCollapse={onToggleCollapse}
                    onSelectConversation={(id) => {
                        setSelectedConversationId(id);
                        setIsSidebarOpen(false);
                    }}
                />
            ) : (
                <NavLinks onLinkClick={() => setIsSidebarOpen(false)} isCollapsed={collapsed} />
            )}

            {/* Footer */}
            <div className={`${collapsed ? 'p-2' : 'p-4'} mt-auto border-t border-gray-200 dark:border-gray-700 flex-shrink-0`}>
                <UsageBox collapsed={collapsed} />
                <ProfileMenu
                    onLogout={handleLogout}
                    onTakeTour={handleTakeTour}
                    isAdmin={userRole === 'admin'}
                    onAdmin={() => { window.location.href = '#/admin'; }}
                    collapsed={collapsed}
                />
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block flex-shrink-0">
                <SidebarContent 
                    collapsed={isSidebarCollapsed} 
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                />
            </aside>

            {/* Mobile Sidebar & Overlay */}
            <div
                className={`fixed inset-y-0 left-0 z-40 lg:hidden bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <SidebarContent collapsed={false} />
            </div>
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="lg:hidden flex justify-between items-center border-b p-4 bg-white dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
                    <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">GemmaStat</h1>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md">
                        <FiMenu size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <Outlet />
                </div>
            </main>
            
            {/* Subscription Modal */}
            <SubscriptionModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                onSuccess={handleSubscriptionSuccess}
            />
        </div>
    );
};

export default AppLayout;