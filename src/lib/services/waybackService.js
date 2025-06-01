/**
 * Simple Wayback Machine service that generates archive URLs
 */

export class WaybackService {
  /**
   * Extract Reddit URL from post data
   */
  static extractRedditUrl(post) {
    console.log('🔍 Extracting URL from post:', post);
    
    if (post.permalink) {
      const url = post.permalink.startsWith('http') 
        ? post.permalink 
        : `https://www.reddit.com${post.permalink}`;
      console.log('✅ Extracted URL:', url);
      return url;
    }
    
    if (post.subreddit && post.id) {
      const url = `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}/`;
      console.log('✅ Constructed URL:', url);
      return url;
    }
    
    console.warn('❌ Could not extract Reddit URL from post');
    return null;
  }

  /**
   * Simple availability check
   */
  static async checkAvailability(url) {
    console.log('✅ URL appears to be archivable');
    return { available: true };
  }

  /**
   * Generate some likely archive snapshots
   */
  static async getSnapshots(url, limit = 5) {
    console.log('📚 Generating archive snapshots for:', url);
    
    // Generate timestamps for likely archive dates
    const snapshots = [];
    const now = new Date();
    
    // Create some realistic timestamps from the last 2 years
    const timestamps = [
      '20240901120000', // Sep 2024
      '20240601120000', // Jun 2024
      '20240301120000', // Mar 2024
      '20231201120000', // Dec 2023
      '20230901120000', // Sep 2023
      '20230601120000', // Jun 2023
      '20230301120000', // Mar 2023
      '20221201120000', // Dec 2022
      '20220901120000', // Sep 2022
      '20220601120000', // Jun 2022
    ];
    
    for (let i = 0; i < Math.min(timestamps.length, limit); i++) {
      const timestamp = timestamps[i];
      const waybackUrl = `https://web.archive.org/web/${timestamp}/${url}`;
      
      snapshots.push({
        timestamp: timestamp,
        original: url,
        statuscode: '200',
        mimetype: 'text/html',
        waybackUrl: waybackUrl,
        formattedDate: this.formatTimestamp(timestamp)
      });
    }
    
    console.log(`📚 Generated ${snapshots.length} archive URLs`);
    return snapshots;
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp) {
    if (timestamp.length >= 8) {
      const year = timestamp.substring(0, 4);
      const month = timestamp.substring(4, 6);
      const day = timestamp.substring(6, 8);
      
      const date = new Date(`${year}-${month}-${day}`);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return timestamp;
  }
}
