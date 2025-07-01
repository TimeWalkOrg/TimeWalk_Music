import { NextRequest, NextResponse } from 'next/server';
import { createGoogleSheetsService } from '@/lib/googleSheets';
import songsData from '@/data/songs.json';
import { Song } from '@/lib/playlistGenerator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'auto'; // 'sheets', 'json', or 'auto'

  try {
    let songs: Song[];

    if (source === 'sheets') {
      // Force Google Sheets
      const sheetsService = createGoogleSheetsService();
      await sheetsService.initialize();
      songs = await sheetsService.getSongsFromSheet();
    } else if (source === 'json') {
      // Force local JSON
      songs = songsData as Song[];
    } else {
      // Auto: Try Google Sheets first, fallback to JSON
      try {
        if (process.env.GOOGLE_SHEETS_ID) {
          const sheetsService = createGoogleSheetsService();
          await sheetsService.initialize();
          songs = await sheetsService.getSongsFromSheet();
          console.log('Using Google Sheets as data source');
        } else {
          throw new Error('Google Sheets not configured');
        }
      } catch (error) {
        console.warn('Google Sheets unavailable, falling back to JSON:', error);
        songs = songsData as Song[];
      }
    }

    return NextResponse.json({
      success: true,
      songs,
      source: source === 'auto' ? (process.env.GOOGLE_SHEETS_ID ? 'sheets' : 'json') : source,
      count: songs.length
    });

  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch songs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { song } = body;

    if (!song || !song.title || !song.artist || !song.year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, artist, year' },
        { status: 400 }
      );
    }

    const sheetsService = createGoogleSheetsService();
    await sheetsService.initialize();
    
    const newSong = await sheetsService.addSongToSheet(song);

    return NextResponse.json({
      success: true,
      song: newSong,
      message: 'Song added successfully'
    });

  } catch (error) {
    console.error('Error adding song:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add song',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}