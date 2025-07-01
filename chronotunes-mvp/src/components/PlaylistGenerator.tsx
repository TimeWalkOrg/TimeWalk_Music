'use client';

import { useState } from 'react';
import { generatePlaylist, parseInput, PlaylistResult, Song } from '@/lib/playlistGenerator';

export default function PlaylistGenerator() {
  const [input, setInput] = useState('');
  const [playlist, setPlaylist] = useState<PlaylistResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError('Please use format: "1776, New York" or "New York, 1776"');
        setIsLoading(false);
        return;
      }

      // Simulate a brief loading period for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = generatePlaylist(parsed.year, parsed.location);
      setPlaylist(result);
    } catch (err) {
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            Try: "1664, New Amsterdam", "1950 America", "1890 London", or "2020 Global"
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
              '1664, New Amsterdam',
              '1776, America',
              '1890, London',
              '1930, New York',
              '1950, America',
              '2020, Global'
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