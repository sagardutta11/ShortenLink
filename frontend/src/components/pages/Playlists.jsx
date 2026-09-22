import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getMyPlaylists, createPlaylist, searchPublicPlaylists, BACKEND_HOST } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import Button from '../ui/Button';
import Logo from '../ui/Logo';

export default function Playlists() {
  const { user, ready } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const [myFilter, setMyFilter] = useState('');

  const [publicQuery, setPublicQuery] = useState('');
  const [publicResults, setPublicResults] = useState([]);
  const [searchingPublic, setSearchingPublic] = useState(false);
  const [publicSearched, setPublicSearched] = useState(false);

  useEffect(() => {
    if (!user) return;
    getMyPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, [user]);

  if (ready && !user) return <Navigate to="/login" replace />;

  const handleCopyShare = async (e, playlist) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Use the frontend origin so the link opens the React page, not the raw API
      const frontendUrl = `${window.location.origin}/p/${playlist.share_code}`;
      await navigator.clipboard.writeText(frontendUrl);
      setCopiedId(playlist.id);
      setTimeout(() => setCopiedId((current) => (current === playlist.id ? null : current)), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const handlePublicSearch = async (e) => {
    e.preventDefault();
    if (!publicQuery.trim()) return;
    setSearchingPublic(true);
    setPublicSearched(true);
    try {
      const results = await searchPublicPlaylists(publicQuery.trim());
      setPublicResults(results);
    } catch (err) {
      setError(err.message || 'Search failed.');
    } finally {
      setSearchingPublic(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const playlist = await createPlaylist({ name, description: description || undefined, visibility });
      setPlaylists((prev) => [playlist, ...prev]);
      setName('');
      setDescription('');
      setVisibility('private');
    } catch (err) {
      setError(err.message || 'Could not create playlist.');
    } finally {
      setCreating(false);
    }
  };

  const filteredPlaylists = myFilter.trim()
    ? playlists.filter((p) => p.name.toLowerCase().includes(myFilter.trim().toLowerCase()))
    : playlists;

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-ink-900">
            <Logo size={32} />
            ShortenLink
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-ink-500 hover:text-ink-900 transition-colors">
              Your links
            </Link>
          </div>
        </header>

        <h1 className="font-display font-bold text-2xl mb-6">Your playlists</h1>

        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(20,184,166,0.1)] p-5 mb-8 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="Playlist name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300"
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="sm:w-40 rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300 bg-white"
            >
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
            <Button type="submit" loading={creating}>
              Create
            </Button>
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300"
          />
        </form>

        {error && (
          <p role="alert" className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-6">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Filter your playlists by name…"
          value={myFilter}
          onChange={(e) => setMyFilter(e.target.value)}
          className="w-full rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300 mb-4"
        />

        {loading ? (
          <p className="text-sm text-ink-500">Loading your playlists…</p>
        ) : playlists.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-ink-500">No playlists yet — create your first one above.</p>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <p className="text-sm text-ink-400 mb-8">No playlists match "{myFilter}".</p>
        ) : (
          <ul className="space-y-3 mb-12">
            {filteredPlaylists.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/playlists/${p.id}`}
                  className="block bg-white rounded-2xl shadow-[0_8px_30px_rgba(20,184,166,0.08)] p-5 hover:shadow-[0_8px_30px_rgba(20,184,166,0.16)] transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display font-semibold">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-ink-500 truncate mt-0.5">{p.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.visibility !== 'private' && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyShare(e, p)}
                          className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                            copiedId === p.id
                              ? 'bg-mint-500 text-white'
                              : 'bg-mint-50 text-mint-600 hover:bg-mint-100'
                          }`}
                        >
                          {copiedId === p.id ? 'Copied!' : 'Copy link'}
                        </button>
                      )}
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                          p.visibility === 'public'
                            ? 'bg-mint-100 text-mint-700'
                            : p.visibility === 'unlisted'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.visibility}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-mint-100 pt-8">
          <h2 className="font-display font-bold text-xl mb-4">Discover public playlists</h2>
          <form onSubmit={handlePublicSearch} className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Search public playlists…"
              value={publicQuery}
              onChange={(e) => setPublicQuery(e.target.value)}
              className="flex-1 rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300"
            />
            <Button type="submit" loading={searchingPublic} className="px-5">
              Search
            </Button>
          </form>

          {publicSearched && !searchingPublic && (
            publicResults.length === 0 ? (
              <p className="text-sm text-ink-400">No public playlists found for "{publicQuery}".</p>
            ) : (
              <ul className="space-y-3">
                {publicResults.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/p/${p.share_code}`}
                      className="block bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
                    >
                      <p className="font-display font-semibold">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-ink-500 truncate mt-0.5">{p.description}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  );
}