'use client';

import { useState } from 'react';
import { Song } from '@/lib/playlistGenerator';

interface SongManagerProps {
  songs: Song[];
  onSongsUpdate: (songs: Song[]) => void;
}

interface SyncStatus {
  type: 'success' | 'error' | 'loading' | null;
  message: string;
}

export default function SongManager({ songs, onSongsUpdate }: SongManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ type: null, message: '' });
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    year: '',
    genre: '',
    cultural_region: '',
    historical_significance: '',
    spotify_url: '',
    youtube_url: '',
    apple_music_url: ''
  });

  const handleSync = async (direction: 'to-sheets' | 'to-json') => {
    setSyncStatus({ type: 'loading', message: 'Syncing...' });
    
    try {
      const response = await fetch('/api/songs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', direction })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus({ type: 'success', message: data.message });
        
        // Refresh songs if syncing to JSON
        if (direction === 'to-json') {
          const songsResponse = await fetch('/api/songs?source=json');
          const songsData = await songsResponse.json();
          if (songsData.success) {
            onSongsUpdate(songsData.songs);
          }
        }
      } else {
        setSyncStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      setSyncStatus({ type: 'error', message: 'Failed to sync' });
    }
    
    setTimeout(() => setSyncStatus({ type: null, message: '' }), 5000);
  };

  const handleSetupSheets = async () => {
    setSyncStatus({ type: 'loading', message: 'Setting up Google Sheets...' });
    
    try {
      const response = await fetch('/api/songs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus({ type: 'success', message: 'Google Sheets headers created. You can now sync data.' });
      } else {
        setSyncStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      setSyncStatus({ type: 'error', message: 'Failed to setup Google Sheets' });
    }
    
    setTimeout(() => setSyncStatus({ type: null, message: '' }), 5000);
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSong.title || !newSong.artist || !newSong.year) {
      setSyncStatus({ type: 'error', message: 'Title, Artist, and Year are required' });
      return;
    }
    
    setSyncStatus({ type: 'loading', message: 'Adding song...' });
    
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          song: {
            ...newSong,
            year: parseInt(newSong.year)
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus({ type: 'success', message: 'Song added successfully' });
        setNewSong({
          title: '',
          artist: '',
          year: '',
          genre: '',
          cultural_region: '',
          historical_significance: '',
          spotify_url: '',
          youtube_url: '',
          apple_music_url: ''
        });
        
        // Refresh songs
        const songsResponse = await fetch('/api/songs?source=sheets');
        const songsData = await songsResponse.json();
        if (songsData.success) {
          onSongsUpdate(songsData.songs);
        }
      } else {
        setSyncStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      setSyncStatus({ type: 'error', message: 'Failed to add song' });
    }
    
    setTimeout(() => setSyncStatus({ type: null, message: '' }), 5000);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          Manage Songs
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Song Database Manager</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {syncStatus.type && (
            <div className={`mb-4 p-3 rounded ${
              syncStatus.type === 'success' ? 'bg-green-100 text-green-700' :
              syncStatus.type === 'error' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {syncStatus.message}
            </div>
          )}

          <div className="space-y-6">
            {/* Google Sheets Setup */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">Google Sheets Setup</h3>
              <p className="text-sm text-gray-600 mb-3">
                First time? Set up your Google Sheets with the proper headers.
              </p>
              <button
                onClick={handleSetupSheets}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                disabled={syncStatus.type === 'loading'}
              >
                Setup Google Sheets
              </button>
            </div>

            {/* Sync Controls */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">Sync Data</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSync('to-sheets')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  disabled={syncStatus.type === 'loading'}
                >
                  JSON → Google Sheets
                </button>
                <button
                  onClick={() => handleSync('to-json')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  disabled={syncStatus.type === 'loading'}
                >
                  Google Sheets → JSON
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Current songs: {songs.length}
              </p>
            </div>

            {/* Add New Song */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Add New Song</h3>
              <form onSubmit={handleAddSong} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Title *"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Artist *"
                    value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Year *"
                    value={newSong.year}
                    onChange={(e) => setNewSong({ ...newSong, year: e.target.value })}
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Genre"
                    value={newSong.genre}
                    onChange={(e) => setNewSong({ ...newSong, genre: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Cultural Region"
                    value={newSong.cultural_region}
                    onChange={(e) => setNewSong({ ...newSong, cultural_region: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Spotify URL"
                    value={newSong.spotify_url}
                    onChange={(e) => setNewSong({ ...newSong, spotify_url: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                </div>
                <textarea
                  placeholder="Historical Significance"
                  value={newSong.historical_significance}
                  onChange={(e) => setNewSong({ ...newSong, historical_significance: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  rows={2}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="YouTube URL"
                    value={newSong.youtube_url}
                    onChange={(e) => setNewSong({ ...newSong, youtube_url: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Apple Music URL"
                    value={newSong.apple_music_url}
                    onChange={(e) => setNewSong({ ...newSong, apple_music_url: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  disabled={syncStatus.type === 'loading'}
                >
                  Add Song to Google Sheets
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}