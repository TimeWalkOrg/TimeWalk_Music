const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

// Configuration
const SPREADSHEET_ID = '1c88b1aT_Iufmc-tztfPMPFZeUVQ8J2BTXnLbAPnWkKA';
const RANGE = 'Sheet1!A:J';

// Headers for the Google Sheet
const HEADERS = [
  'ID',
  'Title',
  'Artist',
  'Year',
  'Genre',
  'Cultural Region',
  'Historical Significance',
  'Spotify URL',
  'YouTube URL',
  'Apple Music URL'
];

// Convert song object to row array
function songToRow(song) {
  return [
    song.id,
    song.title,
    song.artist,
    song.year,
    song.genre,
    song.cultural_region,
    song.historical_significance,
    song.spotify_url || '',
    song.youtube_url || '',
    song.apple_music_url || ''
  ];
}

async function syncToSheets() {
  try {
    console.log('Starting sync to Google Sheets...');
    
    // Read songs from JSON file
    const songsPath = path.join(__dirname, '..', 'src', 'data', 'songs.json');
    const songsData = fs.readFileSync(songsPath, 'utf8');
    const songs = JSON.parse(songsData);
    
    console.log(`Found ${songs.length} songs in JSON file`);
    
    // Initialize Google Auth
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Prepare data with headers
    const values = [
      HEADERS,
      ...songs.map(song => songToRow(song))
    ];
    
    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    
    console.log('Cleared existing data from Google Sheets');
    
    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'RAW',
      resource: {
        values,
      },
    });
    
    console.log(`✅ Successfully synced ${songs.length} songs to Google Sheets!`);
    console.log(`🔗 View your sheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
    
  } catch (error) {
    console.error('❌ Error syncing to Google Sheets:', error.message);
    
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
syncToSheets();