import { NextResponse } from 'next/server';
import GoogleSheetsService from '@/lib/googleSheets';

export async function POST() {
  try {
    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService();

    // Pull songs from Google Sheets
    const songs = await sheetsService.pullSongsFromSheets();

    // Sort by ID for consistent ordering
    songs.sort((a, b) => a.id - b.id);

    // In serverless environments, we can't write to the file system
    // Instead, we'll return the songs data and let the client handle it
    // For now, we'll just return success with the count
    // TODO: Consider implementing a database or external storage solution

    return NextResponse.json({
      success: true,
      message: `Successfully pulled ${songs.length} songs from Google Sheets`,
      count: songs.length,
      note: 'In serverless environment, songs are not saved to local file. Consider using a database for persistent storage.'
    });

  } catch (error) {
    console.error('Error syncing from Google Sheets:', error);
    
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
    endpoint: 'Sync from Google Sheets',
    method: 'POST',
    description: 'Syncs songs from Google Sheets to local JSON file'
  });
}