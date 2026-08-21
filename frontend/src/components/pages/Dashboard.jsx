import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import { getMyUrls, shortenUrl, getLinkAnalytics } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import Button from '../ui/Button';

export default function Dashboard() {
  const { user, ready, logout } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [analytics, setAnalytics] = useState({}); // { [linkId]: data }
  const [analyticsLoading, setAnalyticsLoading] = useState(null); // linkId currently loading

  useEffect(() => {
    if (!user) return;
    getMyUrls()
      .then(setLinks)
      .finally(() => setLoading(false));
  }, [user]);

  if (ready && !user) return <Navigate to="/login" replace />;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const link = await shortenUrl({
        longUrl: url,
        alias: alias || undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      });
      setLinks((prev) => [link, ...prev]);
      setUrl('');
      setAlias('');
      setExpiresInDays('');
    } catch (err) {
      setError(err.message || 'Could not shorten that URL.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (link) => {
    try {
      await navigator.clipboard.writeText(`http://${link.shortUrl}`);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((current) => (current === link.id ? null : current)), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const handleToggleExpand = async (link) => {
    if (expandedId === link.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(link.id);
    if (!analytics[link.id]) {
      setAnalyticsLoading(link.id);
      try {
        const data = await getLinkAnalytics(link.id);
        setAnalytics((prev) => ({ ...prev, [link.id]: data }));
      } catch (err) {
        setAnalytics((prev) => ({ ...prev, [link.id]: { error: err.message || 'Could not load analytics' } }));
      } finally {
        setAnalyticsLoading(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-ink-900">
            <Logo size={32} />
            ShortenLink
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-500">{user?.name}</span>
            <Button variant="outline" onClick={logout} className="px-4 py-2">
              Log out
            </Button>
          </div>
        </header>

        <h1 className="font-display font-bold text-2xl mb-6">Your links</h1>

        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(20,184,166,0.1)] p-5 mb-8 flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            required
            placeholder="Paste a long URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300"
          />
          <input
            type="text"
            placeholder="Custom alias (optional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="sm:w-48 rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300"
          />
          <select
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            className="sm:w-40 rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300 bg-white text-ink-700"
          >
            <option value="">Never expires</option>
            <option value="1">Expires in 1 day</option>
            <option value="7">Expires in 7 days</option>
            <option value="30">Expires in 30 days</option>
          </select>
          <Button type="submit" loading={creating}>
            Shorten
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-ink-500">Loading your links…</p>
        ) : links.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-ink-500">No links yet — shorten your first one above.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {links.map((link) => {
              const isExpanded = expandedId === link.id;
              const linkAnalytics = analytics[link.id];
              const isLoadingAnalytics = analyticsLoading === link.id;

              return (
                <li
                  key={link.id}
                  className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(20,184,166,0.08)] overflow-hidden"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggleExpand(link)}
                    onKeyDown={(e) => e.key === 'Enter' && handleToggleExpand(link)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-mint-600">{link.shortUrl}</p>
                      <p className="text-xs text-ink-500 truncate mt-0.5">{link.longUrl}</p>
                      {link.expiresAt && (
                        <p className="text-[11px] text-amber-600 mt-0.5">
                          {new Date(link.expiresAt) < new Date()
                            ? 'Expired'
                            : `Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-ink-500">{link.clicks} clicks</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(link);
                        }}
                        className={`text-xs rounded-full px-3 py-1.5 transition-colors ${
                          copiedId === link.id
                            ? 'bg-mint-500 text-white'
                            : 'bg-mint-50 text-mint-600 hover:bg-mint-100'
                        }`}
                      >
                        {copiedId === link.id ? 'Copied!' : 'Copy'}
                      </button>
                      <span className={`text-ink-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-mint-50">
                      {isLoadingAnalytics ? (
                        <p className="text-xs text-ink-500 py-4">Loading analytics…</p>
                      ) : linkAnalytics?.error ? (
                        <p className="text-xs text-red-500 py-4">{linkAnalytics.error}</p>
                      ) : linkAnalytics ? (
                        <div className="grid sm:grid-cols-3 gap-4 pt-4 text-sm">
                          <div>
                            <p className="text-xs text-ink-500 mb-1">Total clicks</p>
                            <p className="font-semibold text-ink-900">{linkAnalytics.totalClicks}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">Devices</p>
                            {linkAnalytics.devices?.length ? (
                              linkAnalytics.devices.map((d) => (
                                <p key={d.label} className="text-ink-700">
                                  {d.label}: {d.count}
                                </p>
                              ))
                            ) : (
                              <p className="text-ink-400">No data yet</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">Top referrers</p>
                            {linkAnalytics.topReferrers?.length ? (
                              linkAnalytics.topReferrers.map((r) => (
                                <p key={r.label} className="text-ink-700 truncate">
                                  {r.label}: {r.count}
                                </p>
                              ))
                            ) : (
                              <p className="text-ink-400">No data yet</p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}