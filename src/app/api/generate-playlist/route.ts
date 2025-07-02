import { NextResponse } from 'next/server';
import GoogleSheetsService from '@/lib/googleSheets';
import { Song, WeightedSong, PlaylistResult } from '@/lib/playlistGenerator';

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
 * Generate a playlist based on year and location using live data from Google Sheets
 */
async function generatePlaylistFromSheets(queryYear: number, queryLocation: string): Promise<PlaylistResult> {
  // Initialize Google Sheets service
  const sheetsService = new GoogleSheetsService();
  
  // Pull songs from Google Sheets
  const songs = await sheetsService.pullSongsFromSheets();
  
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year, location } = body;
    
    if (!year || !location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Year and location are required'
        },
        { status: 400 }
      );
    }
    
    const playlist = await generatePlaylistFromSheets(year, location);
    
    return NextResponse.json({
      success: true,
      playlist
    });
    
  } catch (error) {
    console.error('Error generating playlist:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Generate Playlist',
    method: 'POST',
    description: 'Generates a playlist based on year and location using live data from Google Sheets',
    body: {
      year: 'number (required)',
      location: 'string (required)'
    }
  });
} 