const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

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
        
        // Remove outer quotes if present (handles both single and double quotes)
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Additional cleanup for nested quotes that might remain
        if (key.trim() === 'GOOGLE_SERVICE_ACCOUNT_KEY') {
          // Ensure it starts with { and ends with }
          value = value.trim();
          if (!value.startsWith('{')) {
            // Find the first { and last }
            const startIndex = value.indexOf('{');
            const endIndex = value.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1) {
              value = value.substring(startIndex, endIndex + 1);
            }
          }
        }
        
        process.env[key.trim()] = value;
      }
    });
    console.log('✅ Loaded environment variables from .env.local');
    
    // Debug: Check if the JSON key is loaded correctly
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const keyPreview = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.substring(0, 50) + '...';
      console.log(`📋 GOOGLE_SERVICE_ACCOUNT_KEY loaded (preview): ${keyPreview}`);
      
      // Test JSON parsing
      try {
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log('✅ JSON parsing test successful');
      } catch (e) {
        console.log(`❌ JSON parsing test failed: ${e.message}`);
        console.log('First 100 chars of key:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY.substring(0, 100));
      }
    }
  } else {
    console.log('⚠️  .env.local file not found');
  }
}

// Load env variables before proceeding
loadEnvFile();

// Configuration
const SPREADSHEET_ID = '1c88b1aT_Iufmc-tztfPMPFZeUVQ8J2BTXnLbAPnWkKA';

async function testConnection() {
  try {
    console.log('🔍 Testing Google Sheets connection...');
    
    // Initialize Google Auth
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test reading sheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    console.log('✅ Connection successful!');
    console.log(`📊 Sheet title: "${metadata.data.properties.title}"`);
    console.log(`🔗 Sheet URL: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
    
    // Test reading data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:J1',
    });
    
    if (response.data.values && response.data.values.length > 0) {
      console.log(`📋 Found data in sheet. First row: ${response.data.values[0].join(', ')}`);
    } else {
      console.log('📋 Sheet appears to be empty (ready for initial sync)');
    }
    
    console.log('\n🎉 Google Sheets integration is ready to use!');
    console.log('Next steps:');
    console.log('1. Run: npm run sync-to-sheets (to push your current data)');
    console.log('2. Edit your Google Sheet');
    console.log('3. Run: npm run sync-from-sheets (to pull changes back)');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication') || error.message.includes('credentials')) {
      console.log('\n📋 Authentication Setup Required:');
      console.log('1. Follow the setup guide in GOOGLE_SHEETS_SETUP.md');
      console.log('2. Make sure your .env.local file is configured');
      console.log('3. Verify the service account has access to your Google Sheet');
    } else if (error.message.includes('permission') || error.message.includes('access')) {
      console.log('\n📋 Permission Issue:');
      console.log('1. Make sure you shared your Google Sheet with the service account email');
      console.log('2. Give the service account "Editor" permissions');
      console.log('3. Check that the sheet ID is correct');
    } else {
      console.log('\n📋 For troubleshooting help, see GOOGLE_SHEETS_SETUP.md');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();