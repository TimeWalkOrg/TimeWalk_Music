const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        let value = valueParts.join('=');
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        process.env[key.trim()] = value;
      }
    });
    console.log('✅ Loaded environment variables from .env.local');
  } else {
    console.log('⚠️  .env.local file not found');
  }
}

// Load env variables before proceeding
loadEnvFile();

// Configuration
const SPREADSHEET_ID = '1c88b1aT_Iufmc-tztfPMPFZeUVQ8J2BTXnLbAPnWkKA';
const RANGE = 'Sheet1!A:J';

// Convert row array to song object
function rowToSong(row) {
  return {
    id: Number(row[0]) || 0,
    title: String(row[1] || ''),
    artist: String(row[2] || ''),
    year: Number(row[3]) || 0,
    genre: String(row[4] || ''),
    cultural_region: String(row[5] || ''),
    historical_significance: String(row[6] || ''),
    ...(row[7] && row[7].trim() ? { spotify_url: String(row[7]) } : {}),
    ...(row[8] && row[8].trim() ? { youtube_url: String(row[8]) } : {}),
    ...(row[9] && row[9].trim() ? { apple_music_url: String(row[9]) } : {})
  };
}

async function syncFromSheets() {
  try {
    console.log('Starting sync from Google Sheets...');
    
    // Initialize Google Auth
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      console.log('No data found in Google Sheets (or only headers)');
      return;
    }
    
    console.log(`Found ${rows.length - 1} songs in Google Sheets`);
    
    // Convert rows to songs (skip header row)
    const songs = rows.slice(1)
      .filter(row => row[0] && row[1]) // Filter out empty rows
      .map(row => rowToSong(row));
    
    // Sort by ID for consistent ordering
    songs.sort((a, b) => a.id - b.id);
    
    // Create backup of existing file
    const songsPath = path.join(__dirname, '..', 'src', 'data', 'songs.json');
    const backupPath = path.join(__dirname, '..', 'src', 'data', `songs.backup.${Date.now()}.json`);
    
    if (fs.existsSync(songsPath)) {
      fs.copyFileSync(songsPath, backupPath);
      console.log(`Created backup: ${path.basename(backupPath)}`);
    }
    
    // Write songs to JSON file
    fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2));
    
    console.log(`✅ Successfully synced ${songs.length} songs from Google Sheets to JSON file!`);
    console.log(`📁 Updated: ${songsPath}`);
    
    // Validate the sync
    console.log('\n📊 Sync Summary:');
    console.log(`- Total songs: ${songs.length}`);
    console.log(`- Songs with Spotify URLs: ${songs.filter(s => s.spotify_url).length}`);
    console.log(`- Songs with YouTube URLs: ${songs.filter(s => s.youtube_url).length}`);
    console.log(`- Songs with Apple Music URLs: ${songs.filter(s => s.apple_music_url).length}`);
    
    // Show any potential issues
    const duplicateIds = songs.filter((song, index, arr) => 
      arr.findIndex(s => s.id === song.id) !== index
    );
    
    if (duplicateIds.length > 0) {
      console.log(`\n⚠️  Warning: Found ${duplicateIds.length} duplicate IDs`);
      duplicateIds.forEach(song => {
        console.log(`  - ID ${song.id}: "${song.title}" by ${song.artist}`);
      });
    }
    
    const missingSongs = songs.filter(song => !song.title || !song.artist);
    if (missingSongs.length > 0) {
      console.log(`\n⚠️  Warning: Found ${missingSongs.length} songs with missing title/artist`);
    }
    
  } catch (error) {
    console.error('❌ Error syncing from Google Sheets:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n📋 Authentication Setup Required:');
      console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
      console.log('2. Create a new project or select an existing one');
      console.log('3. Enable the Google Sheets API');
      console.log('4. Create a Service Account and download the JSON key file');
      console.log('5. Share your Google Sheet with the service account email');
      console.log('6. Set the GOOGLE_SERVICE_ACCOUNT_KEY environment variable or file path');
    }
    
    process.exit(1);
  }
}

// Run the sync
syncFromSheets();