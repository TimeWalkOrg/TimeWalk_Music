import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Types for our song data
export interface Song {
  id: number;
  title: string;
  artist: string;
  year: number;
  genre: string;
  cultural_region: string;
  historical_significance: string;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
}

export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Check for service account credentials
      const credentialsPath = path.join(process.cwd(), 'credentials.json');
      
      if (fs.existsSync(credentialsPath)) {
        // Use service account authentication
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        
        this.sheets = google.sheets({ version: 'v4', auth });
      } else {
        console.log('credentials.json not found. Please set up authentication.');
        throw new Error('Google Sheets credentials not configured');
      }
    } catch (error) {
      console.error('Error initializing Google Sheets auth:', error);
      throw error;
    }
  }

  async createSongsSheet(): Promise<void> {
    try {
      // Create headers for the sheet
      const headers = [
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

      // Clear the sheet and add headers
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1',
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A1:J1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers],
        },
      });

      console.log('Songs sheet headers created successfully');
    } catch (error) {
      console.error('Error creating songs sheet:', error);
      throw error;
    }
  }

  async uploadSongsToSheet(songs: Song[]): Promise<void> {
    try {
      // Convert songs to sheet format
      const values = songs.map(song => [
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
      ]);

      // Upload all songs starting from row 2 (after headers)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Sheet1!A2:J${values.length + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: values,
        },
      });

      console.log(`Successfully uploaded ${songs.length} songs to Google Sheets`);
    } catch (error) {
      console.error('Error uploading songs to sheet:', error);
      throw error;
    }
  }

  async downloadSongsFromSheet(): Promise<Song[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A2:J1000', // Get data starting from row 2, up to 1000 rows
      });

      const rows = response.data.values || [];
      
      const songs: Song[] = rows
        .filter((row: any[]) => row[0]) // Filter out empty rows
        .map((row: any[]) => ({
          id: parseInt(row[0]) || 0,
          title: row[1] || '',
          artist: row[2] || '',
          year: parseInt(row[3]) || 0,
          genre: row[4] || '',
          cultural_region: row[5] || '',
          historical_significance: row[6] || '',
          spotify_url: row[7] || undefined,
          youtube_url: row[8] || undefined,
          apple_music_url: row[9] || undefined,
        }));

      console.log(`Successfully downloaded ${songs.length} songs from Google Sheets`);
      return songs;
    } catch (error) {
      console.error('Error downloading songs from sheet:', error);
      throw error;
    }
  }

  async syncJsonToSheet(jsonFilePath: string): Promise<void> {
    try {
      const songsData = fs.readFileSync(jsonFilePath, 'utf8');
      const songs: Song[] = JSON.parse(songsData);
      
      await this.createSongsSheet();
      await this.uploadSongsToSheet(songs);
      
      console.log('Successfully synced JSON data to Google Sheets');
    } catch (error) {
      console.error('Error syncing JSON to sheet:', error);
      throw error;
    }
  }

  async syncSheetToJson(jsonFilePath: string): Promise<void> {
    try {
      const songs = await this.downloadSongsFromSheet();
      
      // Create backup of existing file
      if (fs.existsSync(jsonFilePath)) {
        const backupPath = jsonFilePath.replace('.json', `.backup.${Date.now()}.json`);
        fs.copyFileSync(jsonFilePath, backupPath);
        console.log(`Backup created: ${backupPath}`);
      }
      
      // Write updated data
      fs.writeFileSync(jsonFilePath, JSON.stringify(songs, null, 2));
      
      console.log('Successfully synced Google Sheets data to JSON');
    } catch (error) {
      console.error('Error syncing sheet to JSON:', error);
      throw error;
    }
  }
}