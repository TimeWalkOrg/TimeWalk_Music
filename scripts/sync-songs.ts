#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { 
  writeSongsToSheets, 
  readSongsFromSheets, 
  createNewSpreadsheet,
  testSheetsConnection 
} from '../src/lib/googleSheets';
import { Song } from '../src/lib/playlistGenerator';

// Load environment variables
config();

// Path to the local songs.json file
const SONGS_JSON_PATH = path.join(__dirname, '../src/data/songs.json');

async function loadLocalSongs(): Promise<Song[]> {
  try {
    const data = fs.readFileSync(SONGS_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading local songs.json:', error);
    throw error;
  }
}

async function saveLocalSongs(songs: Song[]): Promise<void> {
  try {
    const data = JSON.stringify(songs, null, 2);
    fs.writeFileSync(SONGS_JSON_PATH, data, 'utf8');
    console.log(`Successfully saved ${songs.length} songs to local songs.json`);
  } catch (error) {
    console.error('Error saving local songs.json:', error);
    throw error;
  }
}

async function uploadToSheets(): Promise<void> {
  console.log('📤 Uploading local songs.json to Google Sheets...\n');
  
  try {
    // Test connection first
    const connected = await testSheetsConnection();
    if (!connected) {
      throw new Error('Failed to connect to Google Sheets');
    }

    // Load local songs
    const songs = await loadLocalSongs();
    console.log(`📁 Loaded ${songs.length} songs from local file`);

    // Upload to Google Sheets
    await writeSongsToSheets(songs);
    console.log(`✅ Successfully uploaded ${songs.length} songs to Google Sheets`);
    
    // Print spreadsheet URL
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (spreadsheetId) {
      console.log(`🔗 View spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    }
  } catch (error) {
    console.error('❌ Error uploading to Google Sheets:', error);
    throw error;
  }
}

async function downloadFromSheets(): Promise<void> {
  console.log('📥 Downloading songs from Google Sheets to local file...\n');
  
  try {
    // Test connection first
    const connected = await testSheetsConnection();
    if (!connected) {
      throw new Error('Failed to connect to Google Sheets');
    }

    // Download from Google Sheets
    const songs = await readSongsFromSheets();
    console.log(`📊 Downloaded ${songs.length} songs from Google Sheets`);

    // Save to local file
    await saveLocalSongs(songs);
    console.log(`✅ Successfully updated local songs.json with ${songs.length} songs`);
  } catch (error) {
    console.error('❌ Error downloading from Google Sheets:', error);
    throw error;
  }
}

async function createSpreadsheet(): Promise<void> {
  console.log('🆕 Creating new Google Spreadsheet...\n');
  
  try {
    const spreadsheetId = await createNewSpreadsheet('ChronoTunes Song Database');
    console.log(`✅ Created new spreadsheet with ID: ${spreadsheetId}`);
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    console.log('\n📝 Next steps:');
    console.log('1. Add this spreadsheet ID to your .env file:');
    console.log(`   GOOGLE_SHEETS_ID=${spreadsheetId}`);
    console.log('2. Share the spreadsheet with your service account email');
    console.log('3. Run: npm run sync:upload');
  } catch (error) {
    console.error('❌ Error creating spreadsheet:', error);
    throw error;
  }
}

async function compareData(): Promise<void> {
  console.log('🔍 Comparing local and Google Sheets data...\n');
  
  try {
    // Test connection first
    const connected = await testSheetsConnection();
    if (!connected) {
      throw new Error('Failed to connect to Google Sheets');
    }

    // Load both datasets
    const localSongs = await loadLocalSongs();
    const sheetsSongs = await readSongsFromSheets();
    
    console.log(`📁 Local songs: ${localSongs.length}`);
    console.log(`📊 Sheets songs: ${sheetsSongs.length}`);
    
    if (localSongs.length !== sheetsSongs.length) {
      console.log(`⚠️  Count mismatch: ${Math.abs(localSongs.length - sheetsSongs.length)} difference`);
    }
    
    // Find differences
    const localIds = new Set(localSongs.map(s => s.id));
    const sheetsIds = new Set(sheetsSongs.map(s => s.id));
    
    const onlyInLocal = localSongs.filter(s => !sheetsIds.has(s.id));
    const onlyInSheets = sheetsSongs.filter(s => !localIds.has(s.id));
    
    if (onlyInLocal.length > 0) {
      console.log(`📁 Only in local (${onlyInLocal.length}):`);
      onlyInLocal.forEach(s => console.log(`  - ${s.title} by ${s.artist}`));
    }
    
    if (onlyInSheets.length > 0) {
      console.log(`📊 Only in sheets (${onlyInSheets.length}):`);
      onlyInSheets.forEach(s => console.log(`  - ${s.title} by ${s.artist}`));
    }
    
    if (onlyInLocal.length === 0 && onlyInSheets.length === 0) {
      console.log('✅ Data is in sync!');
    }
  } catch (error) {
    console.error('❌ Error comparing data:', error);
    throw error;
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'upload':
      await uploadToSheets();
      break;
    case 'download':
      await downloadFromSheets();
      break;
    case 'create':
      await createSpreadsheet();
      break;
    case 'compare':
      await compareData();
      break;
    case 'test':
      await testSheetsConnection();
      break;
    default:
      console.log('ChronoTunes Song Database Sync Tool\n');
      console.log('Usage: npm run sync:<command>');
      console.log('\nCommands:');
      console.log('  upload   - Upload local songs.json to Google Sheets');
      console.log('  download - Download songs from Google Sheets to local file');
      console.log('  create   - Create a new Google Spreadsheet');
      console.log('  compare  - Compare local and Google Sheets data');
      console.log('  test     - Test Google Sheets connection');
      console.log('\nExamples:');
      console.log('  npm run sync:upload');
      console.log('  npm run sync:download');
      console.log('  npm run sync:create');
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

export { uploadToSheets, downloadFromSheets, createSpreadsheet, compareData };