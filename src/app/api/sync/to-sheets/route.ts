import { NextResponse } from 'next/server';
import GoogleSheetsService from '@/lib/googleSheets';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Read songs from JSON file
    const songsPath = path.join(process.cwd(), 'src', 'data', 'songs.json');
    const songsData = fs.readFileSync(songsPath, 'utf8');
    const songs = JSON.parse(songsData);

    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService();

    // Push songs to Google Sheets
    await sheetsService.pushSongsToSheets(songs);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${songs.length} songs to Google Sheets`,
      count: songs.length
    });

  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    
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
    endpoint: 'Sync to Google Sheets',
    method: 'POST',
    description: 'Syncs songs from local JSON file to Google Sheets'
  });
}