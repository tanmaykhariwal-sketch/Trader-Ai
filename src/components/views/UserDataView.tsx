import React, { useEffect, useState } from 'react';
import { Users, ChevronDown, ChevronRight, Briefcase, BookOpen, Wallet, Star, ShieldCheck, RefreshCw } from 'lucide-react';
import { apiGetAllUsersAdmin, AdminUserRecord } from '../../utils/api';

interface UserDataViewProps {
  currency: 'INR' | 'USD';
}

// Owner-only page: shows every registered account's profile plus their full
// trade history. Never receives or displays password_hash — the backend
// route itself excludes it, since bcrypt is one-way and there is no
// legitimate reason to surface it here even to the owner.
export const UserDataView: React.FC<UserDataViewProps> = ({ currency }) => {
  const [users, setUsers] = useState<AdminUserRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const currSymbol = currency === 'INR' ? '₹' : '$';

  const load = () => {
    setIsLoading(true);
    setError(null);
    apiGetAllUsersAdmin()
      .then(setUsers)
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load user data.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <Users className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">User Data</h1>
            <p className="text-xs text-slate-400">Every registered account and its trade history — owner-only.</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 disabled:opacity-60 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</div>
      )}

      {isLoading && !users && (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {users && users.length === 0 && (
        <div className="text-sm text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-6 text-center">
          No accounts registered yet.
        </div>
      )}

      {users && users.length > 0 && (
        <div className="space-y-3">
          {users.map(u => {
            const isOpen = expandedId === u.id;
            return (
              <div key={u.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isOpen ? null : u.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer hover:bg-slate-900"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white truncate">{u.username}</span>
                        {u.displayName && <span className="text-xs text-slate-500 truncate">({u.displayName})</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">Joined {new Date(u.createdAt.includes('T') ? u.createdAt : `${u.createdAt.replace(' ', 'T')}Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-300">{currSymbol}{u.capital.toLocaleString()}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{u.holdings.length} open</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{u.journal.length} closed</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800 p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-slate-500 flex items-center space-x-1"><Wallet className="h-3 w-3" /><span>Capital</span></div>
                        <div className="font-mono font-bold text-white mt-0.5">{currSymbol}{u.capital.toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-slate-500 flex items-center space-x-1"><ShieldCheck className="h-3 w-3" /><span>Disclaimer</span></div>
                        <div className="font-bold text-white mt-0.5">{u.disclaimerAcknowledged ? 'Acknowledged' : 'Not yet'}</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-slate-500 flex items-center space-x-1"><Star className="h-3 w-3" /><span>Watchlist</span></div>
                        <div className="font-bold text-white mt-0.5">{u.watchlist.length} symbols</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-slate-500">Trading Mode</div>
                        <div className="font-bold text-white mt-0.5">{u.tradingMode}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>Open Holdings ({u.holdings.length})</span>
                      </div>
                      {u.holdings.length === 0 ? (
                        <p className="text-xs text-slate-500">No open holdings.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-500 text-left">
                                <th className="pb-1 pr-3">Symbol</th>
                                <th className="pb-1 pr-3">Qty</th>
                                <th className="pb-1 pr-3">Buy Price</th>
                                <th className="pb-1 pr-3">Type</th>
                                <th className="pb-1">Purchased</th>
                              </tr>
                            </thead>
                            <tbody>
                              {u.holdings.map(h => (
                                <tr key={h.id} className="border-t border-slate-800/60">
                                  <td className="py-1 pr-3 font-mono text-white">{h.symbol}</td>
                                  <td className="py-1 pr-3">{h.quantity}</td>
                                  <td className="py-1 pr-3 font-mono">{currSymbol}{h.purchasePrice.toLocaleString()}</td>
                                  <td className="py-1 pr-3">{h.tradeType}</td>
                                  <td className="py-1 text-slate-400">{h.purchasedAt}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Closed Trades ({u.journal.length})</span>
                      </div>
                      {u.journal.length === 0 ? (
                        <p className="text-xs text-slate-500">No closed trades yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-500 text-left">
                                <th className="pb-1 pr-3">Symbol</th>
                                <th className="pb-1 pr-3">Buy</th>
                                <th className="pb-1 pr-3">Sell</th>
                                <th className="pb-1 pr-3">Qty</th>
                                <th className="pb-1">P&L</th>
                              </tr>
                            </thead>
                            <tbody>
                              {u.journal.map(j => (
                                <tr key={j.id} className="border-t border-slate-800/60">
                                  <td className="py-1 pr-3 font-mono text-white">{j.symbol}</td>
                                  <td className="py-1 pr-3 font-mono">{currSymbol}{j.buyPrice.toLocaleString()}</td>
                                  <td className="py-1 pr-3 font-mono">{currSymbol}{j.sellPrice.toLocaleString()}</td>
                                  <td className="py-1 pr-3">{j.quantity}</td>
                                  <td className={`py-1 font-mono font-bold ${j.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {j.pnl >= 0 ? '+' : ''}{currSymbol}{j.pnl.toLocaleString()} ({j.pnlPercent.toFixed(1)}%)
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">Capital Ledger ({u.capitalRecords.length})</div>
                      {u.capitalRecords.length === 0 ? (
                        <p className="text-xs text-slate-500">No capital records.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-500 text-left">
                                <th className="pb-1 pr-3">Type</th>
                                <th className="pb-1 pr-3">Amount</th>
                                <th className="pb-1 pr-3">Resulting</th>
                                <th className="pb-1">When</th>
                              </tr>
                            </thead>
                            <tbody>
                              {u.capitalRecords.map(r => (
                                <tr key={r.id} className="border-t border-slate-800/60">
                                  <td className="py-1 pr-3">{r.type}</td>
                                  <td className={`py-1 pr-3 font-mono ${r.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{r.amount >= 0 ? '+' : ''}{currSymbol}{r.amount.toLocaleString()}</td>
                                  <td className="py-1 pr-3 font-mono">{currSymbol}{r.resultingCapital.toLocaleString()}</td>
                                  <td className="py-1 text-slate-400">{r.createdAt}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {u.watchlist.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Watchlist</div>
                        <div className="flex flex-wrap gap-1.5">
                          {u.watchlist.map(sym => (
                            <span key={sym} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{sym}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
