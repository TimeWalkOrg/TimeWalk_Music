import songsData from '@/data/songs.json';
import { readSongsFromSheets } from './googleSheets';

export interface Song {
  id: number;
  title: string;
  artist: string;
  year: number;
  genre: string;
  cultural_region: string;
  historical_significance: string;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
}

export interface WeightedSong extends Song {
  weight: number;
}

export interface PlaylistResult {
  songs: Song[];
  queryYear: number;
  queryLocation: string;
  generatedAt: Date;
}

/**
 * Calculate temporal weight based on distance from query year
 * Only includes songs that existed before or during the query year
 * Weights favor more recent songs exponentially (10x more likely for songs 40 years newer)
 */
function calculateTemporalWeight(songYear: number, queryYear: number): number {
  // Only include songs that existed before or during the query year
  if (songYear > queryYear) return 0;
  
  const yearsBefore = queryYear - songYear;
  
  // Exponential decay where songs 40 years older are 10x less likely
  // Using decay factor of 17.5 to achieve this ratio
  // Example: for 1700 query, 1690 song is 10x more likely than 1650 song
  return Math.exp(-yearsBefore / 17.5);
}

/**
 * Calculate location relevance based on cultural region
 */
function calculateLocationRelevance(song: Song, queryLocation: string): number {
  const location = queryLocation.toLowerCase();
  const region = song.cultural_region.toLowerCase();
  
  // Base score
  let score = 0.5;
  
  // Exact region match
  if (region.includes(location) || location.includes(region)) {
    score = 1.0;
  }
  
  // Historical location mappings
  const locationMappings: { [key: string]: string[] } = {
    'new amsterdam': ['dutch', 'holland', 'netherlands', 'new york'],
    'new york': ['america', 'american', 'new amsterdam'],
    'boston': ['america', 'american', 'england', 'british'],
    'philadelphia': ['america', 'american'],
    'virginia': ['america', 'american', 'england', 'british'],
    'london': ['england', 'british', 'global'],
    'paris': ['france', 'french', 'global'],
  };
  
  // Check mappings
  for (const [key, regions] of Object.entries(locationMappings)) {
    if (location.includes(key)) {
      for (const mappedRegion of regions) {
        if (region.includes(mappedRegion)) {
          score = Math.max(score, 0.8);
        }
      }
    }
  }
  
  // Global music gets moderate score everywhere
  if (region.includes('global')) {
    score = Math.max(score, 0.7);
  }
  
  return score;
}

/**
 * Weighted random selection ensuring diversity
 */
function selectDiversePlaylist(weightedSongs: WeightedSong[], count: number): Song[] {
  // Sort by weight descending
  const sorted = weightedSongs
    .filter(song => song.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  
  if (sorted.length === 0) return [];
  
  const selected: Song[] = [];
  const usedArtists = new Set<string>();
  const usedGenres = new Set<string>();
  
  // First pass: select high-weight songs with diversity constraints
  for (const song of sorted) {
    if (selected.length >= count) break;
    
    const artistCount = Array.from(usedArtists).filter(artist => artist === song.artist).length;
    const genreCount = Array.from(usedGenres).filter(genre => genre === song.genre).length;
    
    // Diversity rules: max 2 songs per artist, max 3 per genre
    if (artistCount < 2 && genreCount < 3) {
      selected.push(song);
      usedArtists.add(song.artist);
      usedGenres.add(song.genre);
    }
  }
  
  // Second pass: fill remaining slots with best available
  if (selected.length < count) {
    for (const song of sorted) {
      if (selected.length >= count) break;
      if (!selected.find(s => s.id === song.id)) {
        selected.push(song);
      }
    }
  }
  
  return selected.slice(0, count);
}

/**
 * Generate a playlist based on year and location
 */
export async function generatePlaylist(queryYear: number, queryLocation: string, useGoogleSheets: boolean = false): Promise<PlaylistResult> {
  let songs: Song[];
  
  if (useGoogleSheets && process.env.GOOGLE_SHEETS_ID) {
    try {
      songs = await readSongsFromSheets();
      console.log(`Loaded ${songs.length} songs from Google Sheets`);
    } catch (error) {
      console.warn('Failed to load from Google Sheets, falling back to local data:', error);
      songs = songsData;
    }
  } else {
    songs = songsData;
  }
  
  // Calculate weights for all songs
  const weightedSongs: WeightedSong[] = songs.map(song => ({
    ...song,
    weight: calculateTemporalWeight(song.year, queryYear) * 
            calculateLocationRelevance(song, queryLocation)
  }));
  
  // Select diverse playlist
  const playlistSongs = selectDiversePlaylist(weightedSongs, 10);
  
  return {
    songs: playlistSongs,
    queryYear,
    queryLocation,
    generatedAt: new Date()
  };
}

/**
 * Generate a playlist based on year and location (synchronous version using local data)
 */
export function generatePlaylistSync(queryYear: number, queryLocation: string): PlaylistResult {
  const songs: Song[] = songsData;
  
  // Calculate weights for all songs
  const weightedSongs: WeightedSong[] = songs.map(song => ({
    ...song,
    weight: calculateTemporalWeight(song.year, queryYear) * 
            calculateLocationRelevance(song, queryLocation)
  }));
  
  // Select diverse playlist
  const playlistSongs = selectDiversePlaylist(weightedSongs, 10);
  
  return {
    songs: playlistSongs,
    queryYear,
    queryLocation,
    generatedAt: new Date()
  };
}

/**
 * Parse year and location from input string
 */
export function parseInput(input: string): { year: number; location: string } | null {
  // Try different formats: "1776, New York" or "1776 New York" 
  const patterns = [
    /^(\d{4}),?\s+(.+)$/,  // "1776, New York" or "1776 New York"
    /^(.+),?\s+(\d{4})$/   // "New York, 1776" or "New York 1776"
  ];
  
  for (const pattern of patterns) {
    const match = input.trim().match(pattern);
    if (match) {
      const [, first, second] = match;
      
      // Check which part is the year
      if (/^\d{4}$/.test(first)) {
        return { year: parseInt(first), location: second.trim() };
      } else if (/^\d{4}$/.test(second)) {
        return { year: parseInt(second), location: first.trim() };
      }
    }
  }
  
  return null;
}