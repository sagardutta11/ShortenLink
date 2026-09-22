import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicPlaylist, BACKEND_HOST } from '../../lib/api';
import Logo from '../ui/Logo';

export default function PublicPlaylist() {
  const { shareCode } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    getPublicPlaylist(shareCode)
      .then((data) => {
        setPlaylist(data.playlist);
        setLinks(data.links);
      })
      .catch((err) => setError(err.message || 'Playlist not found'))
      .finally(() => setLoading(false));
  }, [shareCode]);

  const handleCopy = async (l) => {
    try {
      await navigator.clipboard.writeText(`http://${BACKEND_HOST}/${l.short_code}`);
      setCopiedId(l.link_id);
      setTimeout(() => setCopiedId((cur) => (cur === l.link_id ? null : cur)), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-ink-900">
            <Logo size={32} />
            ShortenLink
          </Link>
          <Link to="/playlists" className="text-sm text-mint-600 hover:underline">
            ← Back to playlists
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading playlist…</p>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-ink-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(20,184,166,0.1)] p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display font-bold text-2xl">{playlist.name}</h1>
                  {playlist.description && (
                    <p className="text-sm text-ink-500 mt-1">{playlist.description}</p>
                  )}
                  <p className="text-xs text-ink-400 mt-3">{links.length} links</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopiedId('__playlist__');
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className={`shrink-0 text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
                    copiedId === '__playlist__'
                      ? 'bg-mint-500 text-white'
                      : 'bg-mint-50 text-mint-600 hover:bg-mint-100'
                  }`}
                >
                  {copiedId === '__playlist__' ? 'Copied!' : 'Copy playlist link'}
                </button>
              </div>
            </div>

            {links.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <p className="text-ink-500">This playlist is empty.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {links.map((l) => (
                  <li
                    key={l.link_id}
                    className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <a
                        href={`http://${BACKEND_HOST}/${l.short_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-mint-600 hover:underline block truncate"
                      >
                        {BACKEND_HOST}/{l.short_code}
                      </a>
                      <p className="text-xs text-ink-500 truncate mt-0.5">{l.original_url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(l)}
                      className={`shrink-0 text-xs rounded-full px-3 py-1.5 transition-colors ${
                        copiedId === l.link_id
                          ? 'bg-mint-500 text-white'
                          : 'bg-mint-50 text-mint-600 hover:bg-mint-100'
                      }`}
                    >
                      {copiedId === l.link_id ? 'Copied!' : 'Copy'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}