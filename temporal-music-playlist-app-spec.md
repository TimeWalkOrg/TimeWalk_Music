# Temporal Music Playlist App - Technical Specification

## Project Overview

**App Name**: ChronoTunes (working title)

**Description**: A hosted web application that generates 10-song playlists based on historical year and location inputs (e.g., "1664, New Amsterdam" or "1776, New York"). The app uses temporal interpolation to create playlists weighted by proximity to historical database entries.

## Core Requirements

### Input Format
- Year and location string (e.g., "1700, New York")
- Support for historical and modern time periods
- Location-aware cultural context

### Output Format
- 10-song playlist in industry-standard format
- Compatible with Spotify, Apple Music, or similar platforms
- Include song metadata: title, artist, year, cultural context

### Initial Database
- **1660**: Early colonial/baroque period music
- **1776**: Revolutionary War era, early American folk
- **1890**: Late Victorian, early ragtime
- **1930**: Jazz Age, Great Depression era
- **1950**: Post-war swing, early rock & roll
- **2025**: Contemporary music

## Technical Architecture

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: Tailwind CSS + Shadcn/UI
- **Features**:
  - Responsive design for mobile/desktop
  - Real-time playlist generation
  - Historical context display
  - Playlist export functionality

### Backend
- **API Framework**: Next.js API Routes or Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Optional user accounts for playlist saving
- **Caching**: Redis for frequent queries

### Database Schema

```sql
-- Songs table
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  spotify_id VARCHAR(255),
  apple_music_id VARCHAR(255),
  youtube_id VARCHAR(255),
  genre VARCHAR(100),
  cultural_region VARCHAR(100),
  historical_significance TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Playlists table
CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  query_year INTEGER NOT NULL,
  query_location VARCHAR(255) NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id)
);

-- Playlist songs junction table
CREATE TABLE playlist_songs (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id),
  song_id INTEGER REFERENCES songs(id),
  position INTEGER NOT NULL,
  weight_score DECIMAL(5,2)
);
```

## Temporal Interpolation Algorithm

### Weighting Function
```javascript
function calculateSongWeight(songYear, queryYear, maxDistance = 50) {
  const distance = Math.abs(songYear - queryYear);
  if (distance > maxDistance) return 0;
  
  // Exponential decay based on temporal distance
  return Math.exp(-distance / 20);
}

function generatePlaylist(queryYear, location) {
  const songs = getSongsFromDatabase();
  const weightedSongs = songs.map(song => ({
    ...song,
    weight: calculateSongWeight(song.year, queryYear) * 
            getLocationRelevance(song, location)
  }));
  
  // Weighted random selection ensuring diversity
  return selectDiversePlaylist(weightedSongs, 10);
}
```

### Location Relevance
- Cultural region mapping (New Amsterdam → Dutch influences)
- Historical event correlation
- Geographic proximity weighting

## Music Service Integration

### API Options (Post-Spotify Restrictions)

**Primary Choice: Apple Music API**
- Comprehensive catalog access
- Playlist creation capabilities
- Better developer terms than Spotify
- $99/year developer program

**Secondary Options:**
- **TIDAL API**: High-quality audio, good for classical/jazz
- **Deezer API**: Strong European catalog
- **YouTube Music API**: Unofficial but extensive catalog
- **MusicAPI.com**: Unified API for multiple services

### Spotify API Limitations (November 2024)
⚠️ **Important**: Spotify restricted several endpoints for new applications:
- Related Artists
- Recommendations
- Audio Features
- Featured Playlists
- 30-second preview URLs

**Recommendation**: Start with Apple Music API, add Spotify support later if API access improves.

### Playlist Export Formats
```javascript
// Spotify format
{
  "name": "1700 New York Playlist",
  "description": "Historical playlist for 1700, New York",
  "tracks": {
    "uris": ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", ...]
  }
}

// Apple Music format
{
  "attributes": {
    "name": "1700 New York Playlist",
    "description": "Historical playlist for 1700, New York"
  },
  "relationships": {
    "tracks": {
      "data": [{"id": "1234567890", "type": "songs"}, ...]
    }
  }
}
```

## Hosting Platform Recommendations

### Tier 1: Beginner-Friendly (Managed)

**Vercel** - $20/month pro plan
- ✅ Native Next.js optimization
- ✅ Automatic deployments
- ✅ Edge functions for API routes
- ❌ Expensive at scale
- ❌ Vendor lock-in

**Railway** - $5-20/month
- ✅ Great developer experience
- ✅ Built-in PostgreSQL
- ✅ Docker-based deployment
- ✅ Multi-region support
- ❌ Less Next.js-specific optimization

### Tier 2: Cost-Effective (Balanced)

**Cloudflare Pages + Workers** - $5-10/month
- ✅ Excellent performance
- ✅ Global edge network
- ✅ Competitive pricing
- ❌ Learning curve for Workers
- ❌ Some Node.js compatibility issues

**Netlify** - $19/month pro plan
- ✅ Excellent CI/CD
- ✅ Preview deployments
- ✅ Form handling
- ❌ More expensive than alternatives

### Tier 3: Self-Hosted (Advanced)

**Hetzner VPS + Coolify** - $20-50/month
- ✅ Full control and best price/performance
- ✅ 64GB RAM, 16 core CPU for $50/month
- ✅ Coolify simplifies deployment
- ❌ Requires server management skills
- ❌ No managed database

**Recommended Stack**: Railway for MVP, migrate to Hetzner + Coolify for scale

## Implementation Timeline

### Phase 1: MVP (4-6 weeks)
- [ ] Basic Next.js app with temporal interpolation
- [ ] PostgreSQL database with seed data
- [ ] Apple Music API integration
- [ ] Railway deployment
- [ ] Core playlist generation algorithm

### Phase 2: Enhancement (4-6 weeks)
- [ ] User authentication and playlist saving
- [ ] Advanced location-based weighting
- [ ] Multiple music service support
- [ ] Historical context display
- [ ] Performance optimization

### Phase 3: Scale & Polish (4-6 weeks)
- [ ] Migration to cost-effective hosting
- [ ] Advanced caching strategies
- [ ] Music recommendation improvements
- [ ] Social sharing features
- [ ] Analytics and monitoring

## Cost Analysis

### Development Costs
- **Apple Music Developer Account**: $99/year
- **Domain**: $15/year
- **Hosting (Railway MVP)**: $20/month
- **Database**: Included with Railway
- **Total Year 1**: ~$355

### Scaling Costs (1000+ users)
- **Hosting (Hetzner + Coolify)**: $50/month
- **Database (Managed PostgreSQL)**: $25/month
- **CDN (Cloudflare)**: $20/month
- **Total Monthly**: ~$95 ($1,140/year)

## Risk Factors & Mitigation

### Technical Risks
1. **Music API Rate Limits**
   - *Mitigation*: Implement caching, multiple API fallbacks
   
2. **Copyright/Licensing Issues**
   - *Mitigation*: Use official APIs only, respect ToS
   
3. **Historical Data Accuracy**
   - *Mitigation*: Work with music historians, cite sources

### Business Risks
1. **API Policy Changes** (like recent Spotify restrictions)
   - *Mitigation*: Multi-platform support, own data where possible
   
2. **Hosting Costs at Scale**
   - *Mitigation*: Efficient caching, self-hosting option

## Success Metrics

### Technical KPIs
- Playlist generation time < 2 seconds
- 99.9% uptime
- Database query optimization (< 100ms)

### User Experience KPIs  
- User retention rate > 60%
- Average session duration > 5 minutes
- Playlist export success rate > 95%

## Conclusion

ChronoTunes represents an innovative approach to music discovery through historical context. The recommended technology stack balances ease of development with cost efficiency:

- **Start**: Next.js + Railway + Apple Music API
- **Scale**: Migrate to Hetzner VPS with Coolify
- **Expand**: Add multiple music service support

The temporal interpolation algorithm provides a unique value proposition while remaining technically feasible. With careful attention to music API policies and cost management, this app can provide a compelling user experience for history and music enthusiasts.

**Next Steps**: 
1. Validate concept with music history experts
2. Prototype core algorithm with sample data  
3. Apply for Apple Music API access
4. Begin MVP development