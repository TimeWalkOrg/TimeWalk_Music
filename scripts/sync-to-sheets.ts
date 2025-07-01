#!/usr/bin/env npx tsx

import { GoogleSheetsService } from '../src/lib/googleSheets';
import path from 'path';
import fs from 'fs';

async function main() {
  try {
    // Check if .env.local exists and has SPREADSHEET_ID
    const envPath = path.join(process.cwd(), '.env.local');
    let spreadsheetId = '';
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GOOGLE_SPREADSHEET_ID=(.+)/);
      if (match) {
        spreadsheetId = match[1].trim();
      }
    }
    
    if (!spreadsheetId) {
      console.error('❌ GOOGLE_SPREADSHEET_ID not found in .env.local');
      console.log('\n📝 Please:');
      console.log('1. Create a Google Spreadsheet');
      console.log('2. Copy the spreadsheet ID from the URL');
      console.log('3. Add it to .env.local: GOOGLE_SPREADSHEET_ID=your_spreadsheet_id');
      process.exit(1);
    }
    
    console.log('🚀 Starting sync to Google Sheets...');
    console.log(`📊 Spreadsheet ID: ${spreadsheetId}`);
    
    const sheetsService = new GoogleSheetsService(spreadsheetId);
    const jsonPath = path.join(process.cwd(), 'src/data/songs.json');
    
    await sheetsService.syncJsonToSheet(jsonPath);
    
    console.log('✅ Successfully synced songs to Google Sheets!');
    console.log(`🔗 View your sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    
  } catch (error) {
    console.error('❌ Error syncing to sheets:', error);
    process.exit(1);
  }
}

main();