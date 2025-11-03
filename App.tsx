import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { EmailAccount } from './types';
import { MetricsCard } from './components/MetricsCard';
import { AccountsTable } from './components/AccountsTable';
import { SettingsDialog } from './components/SettingsDialog';
import { ActivityIcon, AlertTriangleIcon, ClipboardIcon, FileTextIcon, SettingsIcon, LoaderIcon } from './components/Icons';

// --- Main App Component ---
const App = () => {
    const [apiKey, setApiKey] = useState(() => {
        try {
            return localStorage.getItem('smartlead_api_key') || '';
        } catch (error) {
            console.error("Failed to access localStorage for API key:", error);
            return '';
        }
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [rawAccounts, setRawAccounts] = useState<any[]>([]);
    const [allAccounts, setAllAccounts] = useState<EmailAccount[]>([]);
    const [scanState, setScanState] = useState<'idle' | 'fetching' | 'processing' | 'completed'>('idle');
    const [scanCompleted, setScanCompleted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [showOnlyErrors, setShowOnlyErrors] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [scanProgress, setScanProgress] = useState({ fetched: 0, totalToProcess: 0 });

    const displayNotification = useCallback((message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);
    
    useEffect(() => {
        if (!apiKey) {
            setIsSettingsOpen(true);
        }
    }, [apiKey]);
    
    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const findErrorInAccountObject = useCallback((acc: any): string => {
        // Prioritize specific, known error fields with clear prefixes
        if (typeof acc.smtp_failure_error === 'string' && acc.smtp_failure_error.trim()) return `SMTP Error: ${acc.smtp_failure_error}`;
        if (typeof acc.imap_failure_error === 'string' && acc.imap_failure_error.trim()) return `IMAP Error: ${acc.imap_failure_error}`;
        if (acc.warmup_details && typeof acc.warmup_details.blocked_reason === 'string' && acc.warmup_details.blocked_reason.trim()) return `Warmup Blocked: ${acc.warmup_details.blocked_reason}`;
        
        // Check a list of common generic error keys
        const genericErrorKeys = ['latest_mailbox_issue_message', 'error_message', 'status_message', 'error_description', 'error', 'detail'];
        for (const key of genericErrorKeys) {
            if (typeof acc[key] === 'string' && acc[key].trim()) {
                return acc[key];
            }
        }
        
        // Fallback to boolean flags for connection issues
        if (acc.is_smtp_success === false) return 'SMTP Connection Failed';
        if (acc.is_imap_success === false) return 'IMAP Connection Failed';
        if (acc.mailbox_issue === true) return 'Generic mailbox issue detected';

        return '';
    }, []);

    useEffect(() => {
        const formattedAccounts: EmailAccount[] = rawAccounts.map((acc, index) => ({
            id: acc.id || index,
            client: acc.client_name || acc.owner_name || acc.from_name || 'N/A',
            protocol: acc.provider_type?.toUpperCase() || acc.type?.toUpperCase() || 'SMTP',
            email: acc.email || acc.from_email || acc.email_address || 'Unknown Email',
            error: findErrorInAccountObject(acc),
        }));
        setAllAccounts(formattedAccounts);
    }, [rawAccounts, findErrorInAccountObject]);


    const accountsWithErrors = useMemo(() => {
        return allAccounts.filter(acc => acc.error && acc.error.trim() !== '');
    }, [allAccounts]);

    const displayedAccounts = useMemo(() => {
        const sourceAccounts = showOnlyErrors ? accountsWithErrors : allAccounts;
        if (!debouncedSearchTerm) return sourceAccounts;
        const lowercasedFilter = debouncedSearchTerm.toLowerCase();
        return sourceAccounts.filter(acc =>
            acc.client.toLowerCase().includes(lowercasedFilter) ||
            acc.email.toLowerCase().includes(lowercasedFilter)
        );
    }, [allAccounts, accountsWithErrors, debouncedSearchTerm, showOnlyErrors]);
    
    const handleSaveApiKey = (newApiKey: string) => {
        setApiKey(newApiKey);
        setIsSettingsOpen(false);
        try {
            localStorage.setItem('smartlead_api_key', newApiKey);
            displayNotification('API Key saved successfully!', 'success');
        } catch (error) {
            console.error("Failed to save API key to localStorage:", error);
            displayNotification('Could not save API key. Your browser might be blocking storage.', 'error');
        }
    };
    
    const handleScan = async () => {
        if (!apiKey) {
            displayNotification('Please set your API key in settings before scanning.', 'error');
            return;
        }
        setScanState('fetching');
        setScanCompleted(false);
        setRawAccounts([]);
        setAllAccounts([]);
        setShowOnlyErrors(false);
        setScanProgress({ fetched: 0, totalToProcess: 0 });

        const allFetchedAccounts: any[] = [];
        const BATCH_SIZE = 100;
        let offset = 0;
        let hasMore = true;

        try {
            while (hasMore) {
                const response = await fetch(`https://server.smartlead.ai/api/v1/email-accounts?api_key=${encodeURIComponent(apiKey)}&limit=${BATCH_SIZE}&offset=${offset}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                });
    
                if (!response.ok) {
                    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorData.detail || JSON.stringify(errorData);
                    } catch (e) { /* Ignore parsing error */ }
                    throw new Error(errorMsg);
                }
    
                const data = await response.json();
                const records: any[] = Array.isArray(data) ? data : (data?.data || data?.email_accounts || data?.items || []);
                
                if (records.length > 0) {
                    allFetchedAccounts.push(...records);
                    offset += records.length;
                    setScanProgress(prev => ({ ...prev, fetched: allFetchedAccounts.length }));
                }
    
                if (records.length < BATCH_SIZE) {
                    hasMore = false;
                }
            }
            
            setScanProgress({ fetched: allFetchedAccounts.length, totalToProcess: allFetchedAccounts.length });
            setScanState('processing');
            await new Promise(resolve => setTimeout(resolve, 50));

            setRawAccounts(allFetchedAccounts);
            
            if (allFetchedAccounts.length === 0) {
                displayNotification('Scan complete. No accounts found.', 'success');
            } else {
                const errorsFound = allFetchedAccounts.filter(a => findErrorInAccountObject(a)).length;
                displayNotification(`Scan complete. Found ${allFetchedAccounts.length} accounts with ${errorsFound} issue(s).`, 'success');
            }
            setScanCompleted(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            displayNotification(errorMessage, 'error');
        } finally {
            setScanState('idle');
        }
    };
    
    const handleGenerateReport = () => {
        if (!scanCompleted) return;
        const reportLines = [
            "Smartlead Health Report",
            `Generated: ${new Date().toLocaleString()}`,
            "====================================",
            `Total Accounts: ${allAccounts.length}`,
            `Accounts with Errors: ${accountsWithErrors.length}`,
            "\n--- Accounts with Errors ---\n",
        ];

        if (accountsWithErrors.length === 0) {
            reportLines.push("No errors found.");
        } else {
            accountsWithErrors.forEach(acc => {
                reportLines.push(`Client: ${acc.client}`);
                reportLines.push(`Email: ${acc.email}`);
                reportLines.push(`Error: ${acc.error}`);
                reportLines.push("");
            });
        }
        const report = reportLines.join('\n');
        navigator.clipboard.writeText(report).then(() => {
            displayNotification('Report copied to clipboard!', 'success');
        }).catch(() => {
            displayNotification('Failed to copy report.', 'error');
        });
    };

    const handleCopyEmails = () => {
        if (displayedAccounts.length === 0) return;
        const emails = displayedAccounts.map(acc => acc.email).join('\n');
        navigator.clipboard.writeText(emails).then(() => {
            displayNotification(`${displayedAccounts.length} emails copied to clipboard!`, 'success');
        }).catch(() => {
            displayNotification('Failed to copy emails.', 'error');
        });
    };

    const renderScanButtonContent = () => {
        if (scanState === 'fetching' || scanState === 'processing') {
            return (
                <>
                    <LoaderIcon />
                    {scanState === 'fetching' ? `Scanning... (${scanProgress.fetched} found)` : `Processing ${scanProgress.totalToProcess}...`}
                </>
            );
        }
        return scanCompleted ? 'Scan Again' : 'Scan All Accounts';
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveApiKey} currentApiKey={apiKey} />
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Smartlead Health Monitor</h1>
                        <p className="text-slate-400">Dashboard for tracking email account health.</p>
                    </div>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-md hover:bg-slate-700 transition-colors" aria-label="Open settings">
                        <SettingsIcon />
                    </button>
                </header>
                
                {/* --- Redesigned Control Center --- */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white">Control Center</h2>
                            <p className="text-slate-400 mt-1 mb-4">Click to start a health scan across all your accounts.</p>
                             <button onClick={handleScan} disabled={scanState !== 'idle'} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-500 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-600/30">
                                {renderScanButtonContent()}
                            </button>
                        </div>
                        <div className="flex gap-4 self-stretch md:self-center w-full md:w-auto">
                           <MetricsCard title="Total Accounts" value={allAccounts.length} icon={<ActivityIcon />} />
                           <MetricsCard title="Errors Found" value={accountsWithErrors.length} icon={<AlertTriangleIcon />} />
                        </div>
                    </div>
                </div>

                {scanCompleted && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 animate-fade-in">
                        <div className="md:flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Scan Results</h2>
                                <p className="text-slate-400 mt-1">Found {allAccounts.length} accounts. Displaying {displayedAccounts.length}.</p>
                            </div>
                            <button onClick={handleGenerateReport} disabled={!scanCompleted} className="mt-4 md:mt-0 flex items-center justify-center bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors disabled:bg-slate-600/50 disabled:text-slate-400 disabled:cursor-not-allowed">
                                <FileTextIcon />
                                Generate Report
                            </button>
                        </div>
                        
                        {/* --- Redesigned Filter Toolbar --- */}
                        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                            <div className="relative w-full md:flex-1">
                                <input
                                    id="filter"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filter by client name or email..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button onClick={() => setShowOnlyErrors(prev => !prev)} className="w-full md:w-auto flex-1 bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors data-[active=true]:bg-red-600 data-[active=true]:hover:bg-red-700" data-active={showOnlyErrors}>
                                    {showOnlyErrors ? 'Show All' : 'Errors Only'}
                                </button>
                                <button onClick={handleCopyEmails} disabled={displayedAccounts.length === 0} className="w-full md:w-auto flex-1 flex items-center justify-center bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <ClipboardIcon />
                                    Copy Emails
                                </button>
                            </div>
                        </div>
                        
                        <AccountsTable accounts={displayedAccounts} />
                    </div>
                )}
            </div>

            {notification && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white animate-fade-in-out ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default App;