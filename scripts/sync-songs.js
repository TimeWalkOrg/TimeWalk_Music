#!/usr/bin/env node

/**
 * Command-line script for syncing songs between JSON and Google Sheets
 * 
 * Usage:
 *   node scripts/sync-songs.js to-sheets    # Sync from JSON to Google Sheets
 *   node scripts/sync-songs.js to-json      # Sync from Google Sheets to JSON
 *   node scripts/sync-songs.js setup        # Setup Google Sheets headers
 *   node scripts/sync-songs.js status       # Check current song counts
 */

const path = require('path');
const fs = require('fs').promises;

// Import our Google Sheets service
async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log('Usage: node scripts/sync-songs.js <command>');
    console.log('Commands:');
    console.log('  to-sheets  Sync from JSON to Google Sheets');
    console.log('  to-json    Sync from Google Sheets to JSON');
    console.log('  setup      Setup Google Sheets headers');
    console.log('  status     Check current song counts');
    process.exit(1);
  }

  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  try {
    // Dynamic import for ES modules
    const { createGoogleSheetsService } = await import('../src/lib/googleSheets.js');
    
    const service = createGoogleSheetsService();
    await service.initialize();
    
    const jsonFilePath = path.join(process.cwd(), 'src/data/songs.json');

    switch (command) {
      case 'setup':
        console.log('Setting up Google Sheets headers...');
        await service.createSongsSheet();
        console.log('✅ Google Sheets headers created successfully!');
        break;

      case 'to-sheets':
        console.log('Syncing from JSON to Google Sheets...');
        await service.syncFromJsonToSheet(jsonFilePath);
        console.log('✅ Successfully synced from JSON to Google Sheets!');
        break;

      case 'to-json':
        console.log('Syncing from Google Sheets to JSON...');
        await service.syncFromSheetToJson(jsonFilePath);
        console.log('✅ Successfully synced from Google Sheets to JSON!');
        break;

      case 'status':
        console.log('Checking song counts...');
        
        // Check JSON file
        const jsonData = await fs.readFile(jsonFilePath, 'utf-8');
        const jsonSongs = JSON.parse(jsonData);
        console.log(`📄 JSON file: ${jsonSongs.length} songs`);
        
        // Check Google Sheets
        const sheetSongs = await service.getSongsFromSheet();
        console.log(`📊 Google Sheets: ${sheetSongs.length} songs`);
        
        if (jsonSongs.length === sheetSongs.length) {
          console.log('✅ Song counts match!');
        } else {
          console.log('⚠️  Song counts differ - consider syncing');
        }
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('GOOGLE_SHEETS_ID')) {
      console.log('\n💡 Make sure you have configured your .env.local file:');
      console.log('   cp .env.local.example .env.local');
      console.log('   # Then edit .env.local with your Google Sheets configuration');
    }
    
    process.exit(1);
  }
}

main();