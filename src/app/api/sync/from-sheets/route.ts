import { NextRequest, NextResponse } from 'next/server';
import GoogleSheetsService from '@/lib/googleSheets';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService();

    // Pull songs from Google Sheets
    const songs = await sheetsService.pullSongsFromSheets();

    // Create backup of existing file
    const songsPath = path.join(process.cwd(), 'src', 'data', 'songs.json');
    const backupPath = path.join(
      process.cwd(), 
      'src', 
      'data', 
      `songs.backup.${Date.now()}.json`
    );

    if (fs.existsSync(songsPath)) {
      fs.copyFileSync(songsPath, backupPath);
    }

    // Sort by ID for consistent ordering
    songs.sort((a, b) => a.id - b.id);

    // Write songs to JSON file
    fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2));

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${songs.length} songs from Google Sheets`,
      count: songs.length,
      backup: path.basename(backupPath)
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