# Historical Music Playlist App - Specification

## Overview
A web application that generates historically-appropriate 10-song playlists based on user-provided year and location inputs. The app uses temporal interpolation to create playlists for any year by weighting songs from the nearest available database entries.

## Core Features

### Input
- **Year**: Any year (e.g., 1664, 1700, 1776, 1890, 1930, 1950, 2025)
- **Location**: City/region name (e.g., "New Amsterdam", "New York", "Boston")
- **Input Format**: Single string like "1664, New Amsterdam" or separate fields

### Output
- **10-song playlist** in industry-standard format
- **Playlist formats supported**:
  - Spotify playlist URL/format
  - Apple Music playlist format
  - JSON with track metadata (artist, title, year, duration)
  - M3U playlist file

### Core Algorithm
- **Temporal Interpolation**: Weight songs by proximity to target year
- **Geographic Consideration**: Factor in location-appropriate musical styles
- **Weighting Formula**: Inverse distance weighting from available database years

## Technical Architecture

### Database Schema
```sql
-- Songs table
songs (
  id: UUID PRIMARY KEY,
  title: VARCHAR(255),
  artist: VARCHAR(255),
  year: INTEGER,
  genre: VARCHAR(100),
  region: VARCHAR(100),
  spotify_id: VARCHAR(50),
  apple_music_id: VARCHAR(50),
  duration_ms: INTEGER,
  historical_accuracy: FLOAT -- 0-1 score
)

-- Playlists table (for caching/history)
playlists (
  id: UUID PRIMARY KEY,
  query_year: INTEGER,
  query_location: VARCHAR(255),
  songs: JSON, -- Array of song IDs
  created_at: TIMESTAMP,
  playlist_url: VARCHAR(500)
)
```

### Initial Database Content
- **1660**: Early colonial/baroque music
- **1776**: Revolutionary War era songs, folk music
- **1890**: Popular songs of the Gilded Age, early recorded music
- **1930**: Jazz Age, early radio hits, Depression-era music
- **1950**: Post-war popular music, early rock & roll
- **2025**: Contemporary music (for future queries)

Each year should have 20-30 songs to allow for variety in generated playlists.

## API Endpoints

### Core Endpoints
```
POST /api/playlist/generate
Body: {
  "year": 1700,
  "location": "New York",
  "format": "spotify" // optional: spotify, apple, json, m3u
}
Response: {
  "playlist": [...],
  "playlist_url": "https://open.spotify.com/playlist/...",
  "interpolation_info": {
    "source_years": [1660, 1776],
    "weights": [0.7, 0.3]
  }
}

GET /api/songs/years
Response: [1660, 1776, 1890, 1930, 1950, 2025]

GET /api/playlist/history/{playlist_id}
Response: { playlist details }
```

### Music Platform Integration
- **Spotify Web API**: Create playlists, search tracks
- **Apple Music API**: Alternative playlist creation
- **Fallback**: Generate JSON/M3U for manual import

## Frontend Requirements

### User Interface
- **Simple form**: Year input (number), Location input (text)
- **Generate button**: Triggers playlist creation
- **Results display**: 
  - Song list with artist, title, year
  - Playlist platform links
  - Download options (JSON, M3U)
- **Historical context**: Brief explanation of musical era
- **Interpolation visualization**: Show which database years influenced the result

### User Experience
- **Response time**: < 3 seconds for playlist generation
- **Mobile responsive**: Works on all device sizes
- **Accessibility**: WCAG 2.1 AA compliant
- **Progressive enhancement**: Works without JavaScript for basic functionality

## Interpolation Algorithm

### Weighting Formula
```python
def calculate_weights(target_year, available_years):
    weights = {}
    for year in available_years:
        distance = abs(target_year - year)
        # Inverse distance weighting with minimum weight
        weight = max(1 / (distance + 1), 0.1)
        weights[year] = weight
    
    # Normalize weights to sum to 1
    total = sum(weights.values())
    return {year: w/total for year, w in weights.items()}

def generate_playlist(target_year, location, song_count=10):
    weights = calculate_weights(target_year, database_years)
    songs = []
    
    for year, weight in weights.items():
        song_count_from_year = int(song_count * weight)
        year_songs = get_songs_by_year_location(year, location)
        songs.extend(random.sample(year_songs, song_count_from_year))
    
    # Fill remaining slots if needed
    while len(songs) < song_count:
        songs.append(random.choice(all_appropriate_songs))
    
    return songs[:song_count]
```

## Platform Recommendations

### Recommended Stack

#### Option 1: Modern Web Stack (Recommended)
- **Frontend**: React/Next.js with TypeScript
- **Backend**: Node.js with Express or Python with FastAPI
- **Database**: PostgreSQL with JSON columns for flexibility
- **Hosting**: Vercel (frontend) + Railway/Render (backend + database)
- **Authentication**: Optional - Auth0 or Clerk for user accounts
- **Music APIs**: Spotify Web API, Apple Music API

#### Option 2: Full-Stack Frameworks
- **Framework**: SvelteKit or Nuxt.js
- **Database**: Supabase (PostgreSQL + auth + real-time)
- **Hosting**: Netlify or Vercel
- **Advantages**: Faster development, built-in auth, real-time updates

#### Option 3: Serverless (For MVP)
- **Functions**: Vercel Functions or Netlify Functions
- **Database**: Airtable or Google Sheets (for rapid prototyping)
- **Frontend**: Static site with vanilla JS or lightweight framework
- **Advantages**: Minimal infrastructure, fast deployment

### Development Phases

#### Phase 1: MVP (2-3 weeks)
- Basic web form for year/location input
- Hardcoded song database (JSON file)
- Simple interpolation algorithm
- JSON playlist output
- Deploy to Vercel/Netlify

#### Phase 2: Enhanced (4-6 weeks)
- PostgreSQL database with proper schema
- Spotify API integration
- Improved UI with playlist visualization
- User accounts and playlist history
- Mobile optimization

#### Phase 3: Production (6-8 weeks)
- Apple Music integration
- Advanced interpolation considering location/genre
- Administrative interface for adding songs
- Analytics and usage tracking
- Performance optimization

## Cost Estimates

### Monthly Operating Costs (MVP)
- **Hosting**: $0-20 (Vercel/Netlify free tier)
- **Database**: $0-15 (Railway/Supabase free tier)
- **Spotify API**: Free (up to reasonable usage)
- **Domain**: $10-15/year
- **Total**: ~$0-35/month

### Scaling Costs (1000+ users/month)
- **Hosting**: $50-100
- **Database**: $25-50
- **CDN**: $10-25
- **Monitoring**: $20-40
- **Total**: ~$105-215/month

## Risk Considerations

### Technical Risks
- **Music API rate limits**: Implement caching and rate limiting
- **Song availability**: Not all historical music on Spotify
- **Interpolation accuracy**: May need manual curation for edge cases

### Legal/Business Risks
- **Music licensing**: Using preview URLs only, directing to platforms
- **Data accuracy**: Disclaimer about historical approximations
- **Platform dependency**: Multiple music service integrations

## Success Metrics
- **User engagement**: Playlist generation rate
- **Accuracy**: User satisfaction with historical appropriateness
- **Platform adoption**: Successful playlist creation on Spotify/Apple Music
- **Retention**: Return usage patterns

## Next Steps
1. **Validate concept**: Create simple prototype with hardcoded data
2. **Research music database**: Compile initial song collections for each era
3. **Set up development environment**: Choose tech stack and initialize project
4. **Implement MVP**: Basic functionality with one output format
5. **User testing**: Gather feedback on historical accuracy and usability