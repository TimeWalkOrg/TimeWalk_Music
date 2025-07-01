import { NextRequest, NextResponse } from 'next/server';
import { createGoogleSheetsService } from '@/lib/googleSheets';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { direction, action } = body; // direction: 'to-sheets' | 'to-json', action: 'sync' | 'setup'

    const sheetsService = createGoogleSheetsService();
    await sheetsService.initialize();

    const jsonFilePath = path.join(process.cwd(), 'src/data/songs.json');

    switch (action) {
      case 'setup':
        // Create the sheet headers
        await sheetsService.createSongsSheet();
        return NextResponse.json({
          success: true,
          message: 'Google Sheets headers created successfully'
        });

      case 'sync':
        if (direction === 'to-sheets') {
          // Sync from JSON to Google Sheets
          await sheetsService.syncFromJsonToSheet(jsonFilePath);
          return NextResponse.json({
            success: true,
            message: 'Successfully synced data from JSON to Google Sheets'
          });
        } else if (direction === 'to-json') {
          // Sync from Google Sheets to JSON
          await sheetsService.syncFromSheetToJson(jsonFilePath);
          return NextResponse.json({
            success: true,
            message: 'Successfully synced data from Google Sheets to JSON'
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid direction. Use "to-sheets" or "to-json"' },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "sync" or "setup"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error during sync operation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sync operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}