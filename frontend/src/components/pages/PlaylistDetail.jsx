import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getPlaylistDetail,
  getMyUrls,
  addLinkToPlaylist,
  removeLinkFromPlaylist,
  reorderPlaylistLinks,
  updatePlaylistDetails,
  deletePlaylist,
  BACKEND_HOST,
} from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import Button from '../ui/Button';
import Logo from '../ui/Logo';

// ── Drag handle icon ────────────────────────────────────────────────────────
function DragHandle({ listeners, attributes }) {
  return (
    <button
      type="button"
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing text-ink-300 hover:text-ink-500 p-1 rounded touch-none"
      aria-label="Drag to reorder"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.2" />
        <circle cx="11" cy="4" r="1.2" />
        <circle cx="5" cy="8" r="1.2" />
        <circle cx="11" cy="8" r="1.2" />
        <circle cx="5" cy="12" r="1.2" />
        <circle cx="11" cy="12" r="1.2" />
      </svg>
    </button>
  );
}

// ── Sortable link row ────────────────────────────────────────────────────────
function SortableLink({ l, copiedLinkId, onCopy, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: l.link_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4 select-none"
    >
      <div className="flex items-center gap-3 min-w-0">
        <DragHandle listeners={listeners} attributes={attributes} />
        <div className="min-w-0">
          <a
            href={`http://${BACKEND_HOST}/${l.short_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-mint-600 hover:underline truncate block"
          >
            {BACKEND_HOST}/{l.short_code}
          </a>
          <p className="text-xs text-ink-500 truncate">{l.original_url}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onCopy(l)}
          className={`text-xs rounded-full px-3 py-1.5 transition-colors ${
            copiedLinkId === l.link_id
              ? 'bg-mint-500 text-white'
              : 'bg-mint-50 text-mint-600 hover:bg-mint-100'
          }`}
        >
          {copiedLinkId === l.link_id ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={() => onRemove(l.link_id)}
          className="text-xs text-red-500 hover:bg-red-50 rounded-full px-3 py-1.5"
        >
          Remove
        </button>
      </div>
    </li>
  );
}

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, ready } = useAuth();

  const [playlist, setPlaylist] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [myLinks, setMyLinks] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [adding, setAdding] = useState(false);

  const [editingVisibility, setEditingVisibility] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  // dnd-kit sensors — pointer for mouse, touch for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleCopyShareUrl = async () => {
    try {
      const frontendUrl = `${window.location.origin}/p/${playlist?.share_code}`;
      await navigator.clipboard.writeText(frontendUrl);
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const load = () => {
    setLoading(true);
    getPlaylistDetail(id)
      .then((data) => {
        setPlaylist(data.playlist);
        setLinks(data.links);
        setVisibility(data.playlist.visibility);
      })
      .catch((err) => setError(err.message || 'Could not load playlist'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, id]);

  if (ready && !user) return <Navigate to="/login" replace />;

  const openPicker = async () => {
    setShowPicker(true);
    if (myLinks.length === 0) {
      const all = await getMyUrls();
      setMyLinks(all);
    }
  };

  const handleAddLink = async (linkId) => {
    setAdding(true);
    setError('');
    try {
      await addLinkToPlaylist(id, linkId);
      load();
    } catch (err) {
      setError(err.message || 'Could not add link.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveLink = async (linkId) => {
    setError('');
    try {
      await removeLinkFromPlaylist(id, linkId);
      setLinks((prev) => prev.filter((l) => l.link_id !== linkId));
    } catch (err) {
      setError(err.message || 'Could not remove link.');
    }
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(`http://${BACKEND_HOST}/${link.short_code}`);
      setCopiedLinkId(link.link_id);
      setTimeout(() => setCopiedLinkId((current) => (current === link.link_id ? null : current)), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const onDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.link_id === active.id);
    const newIndex = links.findIndex((l) => l.link_id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);
    setLinks(reordered); // optimistic update
    try {
      await reorderPlaylistLinks(id, reordered.map((l) => l.link_id));
    } catch (err) {
      setError(err.message || 'Could not save new order.');
      load();
    }
  }, [links, id]);

  const moveLink = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= links.length) return;

    const reordered = [...links];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setLinks(reordered); // optimistic update

    try {
      await reorderPlaylistLinks(id, reordered.map((l) => l.link_id));
    } catch (err) {
      setError(err.message || 'Could not save new order.');
      load(); // revert to server truth on failure
    }
  };

  const handleVisibilityChange = async (newVisibility) => {
    setVisibility(newVisibility);
    try {
      const updated = await updatePlaylistDetails(id, { visibility: newVisibility });
      setPlaylist((prev) => ({ ...prev, visibility: updated.visibility }));
      setEditingVisibility(false);
    } catch (err) {
      setError(err.message || 'Could not update visibility.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this playlist? This cannot be undone.')) return;
    try {
      await deletePlaylist(id);
      navigate('/playlists');
    } catch (err) {
      setError(err.message || 'Could not delete playlist.');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-cream px-6 py-10 text-center text-ink-500">Loading…</div>;
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-cream px-6 py-10 text-center">
        <p className="text-ink-500">Playlist not found.</p>
        <Link to="/playlists" className="text-mint-600 hover:underline text-sm mt-2 inline-block">
          Back to playlists
        </Link>
      </div>
    );
  }

  const linkIdsInPlaylist = new Set(links.map((l) => l.link_id));

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-ink-900">
            <Logo size={32} />
            ShortenLink
          </Link>
          <Link to="/playlists" className="text-sm text-ink-500 hover:text-ink-900 transition-colors">
            ← Back to playlists
          </Link>
        </header>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(20,184,166,0.1)] p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="font-display font-bold text-2xl">{playlist.name}</h1>
              {playlist.description && <p className="text-sm text-ink-500 mt-1">{playlist.description}</p>}
            </div>
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:bg-red-50 rounded-full px-3 py-1.5 shrink-0"
            >
              Delete
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {editingVisibility ? (
              <select
                value={visibility}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                onBlur={() => setEditingVisibility(false)}
                autoFocus
                className="text-xs rounded-full border border-mint-200 px-3 py-1.5 bg-white"
              >
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            ) : (
              <button
                onClick={() => setEditingVisibility(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-mint-50 text-mint-600 hover:bg-mint-100"
              >
                {playlist.visibility} · change
              </button>
            )}

            {playlist.visibility !== 'private' && (
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
                  copiedShareUrl
                    ? 'bg-mint-500 text-white'
                    : 'bg-mint-50 text-mint-600 hover:bg-mint-100'
                }`}
              >
                {copiedShareUrl ? 'Copied!' : 'Copy share link'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-6">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Links ({links.length})</h2>
          <Button onClick={openPicker} className="px-4 py-2 text-sm">
            + Add link
          </Button>
        </div>

        {showPicker && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <p className="text-xs text-ink-500 mb-2">Pick one of your links to add:</p>
            {myLinks.length === 0 ? (
              <p className="text-xs text-ink-400">You don't have any links yet.</p>
            ) : (
              <ul className="space-y-1 max-h-56 overflow-y-auto">
                {myLinks.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="text-xs font-mono text-ink-700 truncate">{l.shortUrl}</span>
                    <button
                      disabled={adding || linkIdsInPlaylist.has(l.id)}
                      onClick={() => handleAddLink(l.id)}
                      className="text-[11px] shrink-0 rounded-full bg-mint-50 text-mint-600 px-2.5 py-1 hover:bg-mint-100 disabled:opacity-40"
                    >
                      {linkIdsInPlaylist.has(l.id) ? 'Added' : 'Add'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setShowPicker(false)}
              className="text-xs text-ink-500 hover:underline mt-3"
            >
              Close
            </button>
          </div>
        )}

        {links.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-ink-500">No links in this playlist yet.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={links.map((l) => l.link_id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {links.map((l) => (
                  <SortableLink
                    key={l.link_id}
                    l={l}
                    copiedLinkId={copiedLinkId}
                    onCopy={handleCopyLink}
                    onRemove={handleRemoveLink}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}