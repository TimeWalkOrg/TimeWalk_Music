'use client';

import { useState } from 'react';
import { parseInput, PlaylistResult, Song } from '@/lib/playlistGenerator';

export default function PlaylistGenerator() {
  const [input, setInput] = useState('');
  const [playlist, setPlaylist] = useState<PlaylistResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncLoading, setSyncLoading] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter a year and location');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const parsed = parseInput(input);
      if (!parsed) {
        setError('Please use format: 1776, New York or New York, 1776');
        setIsLoading(false);
        return;
      }

      // Call the API to generate playlist using live data from Google Sheets
      const response = await fetch('/api/generate-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: parsed.year,
          location: parsed.location
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }
      
      if (data.success) {
        setPlaylist(data.playlist);
      } else {
        setError(data.error || 'Failed to generate playlist. Please try again.');
      }
    } catch {
      setError('Failed to generate playlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  const handleUpdateSpreadsheet = async () => {
    setSyncLoading('update');
    try {
      const response = await fetch('/api/sync/to-sheets', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully updated spreadsheet with ${data.count} songs!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert('Failed to update spreadsheet. Please try again.');
    } finally {
      setSyncLoading(null);
    }
  };



  const handlePullFromSpreadsheet = async () => {
    if (!confirm('This will replace all songs in the database with songs from the spreadsheet. Continue?')) {
      return;
    }
    
    setSyncLoading('pull');
    try {
      const response = await fetch('/api/sync/from-sheets', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        const noteMessage = data.note ? `\n\nNote: ${data.note}` : '';
        alert(`Successfully pulled ${data.count} songs from spreadsheet!${noteMessage}`);
        // Note: In serverless environment, the songs.json file won't be updated
        // The application will continue to use the existing local data
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert('Failed to pull from spreadsheet. Please try again.');
    } finally {
      setSyncLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Music TimeWalk</h1>
          <div className="flex justify-center">
            <a
              href="https://docs.google.com/spreadsheets/d/1c88b1aT_Iufmc-tztfPMPFZeUVQ8J2BTXnLbAPnWkKA/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 px-3 py-1 rounded-full transition-all duration-200"
            >
              📝 Edit Song List
            </a>
          </div>
        </div>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Generate an historical-accurate playlist for any year and location.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-blue-100 rounded-lg shadow-md p-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="input" className="block text-sm font-medium text-gray-700">
            Enter Year and Location
          </label>
          <div className="flex space-x-3">
            <input
              id="input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., 1776, New York or 1960 London"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Try: &ldquo;1664, New Amsterdam&rdquo;, &ldquo;1950 America&rdquo;, &ldquo;1890 London&rdquo;, or &ldquo;2020 Global&rdquo;
          </p>
          
          {/* Spreadsheet Management Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={handleUpdateSpreadsheet}
              disabled={syncLoading !== null}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncLoading === 'update' ? 'Updating...' : 'Update Spreadsheet'}
            </button>
            <button
              onClick={handlePullFromSpreadsheet}
              disabled={syncLoading !== null}
              className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncLoading === 'pull' ? 'Pulling...' : 'Pull from Spreadsheet'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {playlist && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Playlist for {playlist.queryYear}, {playlist.queryLocation}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Generated on {playlist.generatedAt.toLocaleDateString()} at {playlist.generatedAt.toLocaleTimeString()}
            </p>
          </div>

          {playlist.songs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No songs found for this query. Try a different year or location.
            </div>
          ) : (
            <div className="space-y-3">
              {playlist.songs.map((song, index) => (
                <SongCard key={song.id} song={song} position={index + 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Examples Section */}
      {!playlist && (
        <div className="bg-blue-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Try these examples:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              '1664 - New Amsterdam',
              '1776 - America',
              '1890 - London',
              '1930 - New York',
              '1950 - America',
              '2020 - Global'
            ].map((example) => (
              <button
                key={example}
                onClick={() => setInput(example)}
                className="text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <span className="text-blue-600 font-medium">{example}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get the best available music link
function getMusicLink(song: Song): { url: string; platform: string } | null {
  if (song.youtube_url) {
    return { url: song.youtube_url, platform: 'YouTube' };
  }
  if (song.spotify_url) {
    return { url: song.spotify_url, platform: 'Spotify' };
  }
  if (song.apple_music_url) {
    return { url: song.apple_music_url, platform: 'Apple Music' };
  }
  return null;
}

function SongCard({ song, position }: { song: Song; position: number }) {
  const musicLink = getMusicLink(song);
  
  const handleSongClick = () => {
    if (musicLink) {
      window.open(musicLink.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 
              className={`text-lg font-medium truncate ${
                musicLink 
                  ? 'text-blue-600 cursor-pointer hover:text-blue-800 hover:underline' 
                  : 'text-gray-900'
              }`}
              onClick={musicLink ? handleSongClick : undefined}
              title={musicLink ? `Play on ${musicLink.platform}` : song.title}
            >
              {song.title}
              {musicLink && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  ▶ {musicLink.platform}
                </span>
              )}
            </h4>
            <p className="text-sm text-gray-600">
              by {song.artist} • {song.year}
            </p>
            <div className="flex space-x-4 text-xs text-gray-500">
              <span className="bg-gray-200 px-2 py-1 rounded">{song.genre}</span>
              <span className="bg-blue-100 px-2 py-1 rounded">{song.cultural_region}</span>
            </div>
          </div>
        </div>
        {song.historical_significance && (
          <p className="text-sm text-gray-600 mt-2 italic">
            {song.historical_significance}
          </p>
        )}
      </div>
    </div>
  );
}