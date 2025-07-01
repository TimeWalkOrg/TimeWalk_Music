'use client';

import { useState } from 'react';
import { generatePlaylist, PlaylistResult, Song } from '@/lib/playlistGenerator';

export default function PlaylistGenerator() {
  const [year, setYear] = useState('');
  const [location, setLocation] = useState('');
  const [playlist, setPlaylist] = useState<PlaylistResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!year.trim() || !location.trim()) {
      setError('Please enter both year and location');
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1000 || yearNum > 2100) {
      setError('Please enter a valid year (1000-2100)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate a brief loading period for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = generatePlaylist(yearNum, location.trim());
      setPlaylist(result);
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">ChronoTunes</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Generate a historical playlist for any year and location. Experience the music of different eras and places.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                onFocus={(e) => e.target.placeholder = ''}
                onBlur={(e) => e.target.placeholder = 'e.g., 1776'}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 1776"
                className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={(e) => e.target.placeholder = ''}
                onBlur={(e) => e.target.placeholder = 'e.g., New York'}
                onKeyPress={handleKeyPress}
                placeholder="e.g., New York"
                className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate Playlist'}
            </button>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Try: 1664 + New Amsterdam, 1950 + America, 1890 + London, or 2020 + Global
          </p>
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
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Try these examples:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { year: '1664', location: 'New Amsterdam' },
              { year: '1776', location: 'America' },
              { year: '1890', location: 'London' },
              { year: '1930', location: 'New York' },
              { year: '1950', location: 'America' },
              { year: '2020', location: 'Global' }
            ].map((example) => (
              <button
                key={`${example.year}-${example.location}`}
                onClick={() => {
                  setYear(example.year);
                  setLocation(example.location);
                }}
                className="text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <span className="text-blue-600 font-medium">{example.year}, {example.location}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SongCard({ song, position }: { song: Song; position: number }) {
  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="text-lg font-medium text-gray-900 truncate">
              {song.title}
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