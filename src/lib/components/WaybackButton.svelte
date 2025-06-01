<script>
  import { WaybackService } from '../services/waybackService.js';
  import { createEventDispatcher } from 'svelte';
  
  export let post;
  export let size = 'small';
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = null;
  
  $: redditUrl = WaybackService.extractRedditUrl(post);
  $: disabled = !redditUrl || loading;

  async function openMostRecentArchive() {
    if (!redditUrl || loading) return;
    
    loading = true;
    error = null;
    
    try {
      // Get the most recent archive timestamp
      const snapshots = await WaybackService.getSnapshots(redditUrl, 1);
      
      if (snapshots.length > 0) {
        const mostRecent = snapshots[0];
        console.log('🚀 Opening most recent archive:', mostRecent.waybackUrl);
        
        // Open the archive in a new tab
        window.open(mostRecent.waybackUrl, '_blank', 'noopener,noreferrer');
        
        dispatch('archiveOpened', { snapshot: mostRecent });
      } else {
        error = 'No archived versions found';
        setTimeout(() => error = null, 3000);
      }
      
    } catch (err) {
      error = 'Failed to find archive';
      console.error('Wayback error:', err);
      setTimeout(() => error = null, 3000);
      dispatch('archiveError', { error: err.message });
    } finally {
      loading = false;
    }
  }
</script>

<div class="wayback-container">
  <button 
    class="wayback-btn"
    class:loading
    class:disabled
    class:size-medium={size === 'medium'}
    {disabled}
    on:click={openMostRecentArchive}
    title={redditUrl ? 'View archived version on Internet Archive' : 'No Reddit URL available'}
  >
    {#if loading}
      <span class="spinner" aria-hidden="true"></span>
      <span class="sr-only">Finding archive...</span>
    {:else}
      <span class="icon" aria-hidden="true">📚</span>
    {/if}
    <span class="label">
      {loading ? 'Loading...' : 'View Archive'}
    </span>
  </button>

  {#if error}
    <div class="error-tooltip" role="tooltip">
      {error}
    </div>
  {/if}
</div>

<style>
  .wayback-container {
    position: relative;
    display: inline-block;
  }

  .wayback-btn {
    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;
    min-width: 85px;
    justify-content: center;
  }

  .wayback-btn.size-medium {
    padding: 6px 12px;
    font-size: 12px;
    min-width: 100px;
  }

  .wayback-btn:hover:not(.disabled):not(.loading) {
    background: linear-gradient(135deg, #357abd 0%, #2a5d8f 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .wayback-btn:active:not(.disabled):not(.loading) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  .wayback-btn.disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .wayback-btn.loading {
    background: #666;
    cursor: wait;
  }

  .icon {
    font-size: 12px;
  }

  .label {
    font-weight: 500;
  }

  .spinner {
    width: 10px;
    height: 10px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-tooltip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #dc3545;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
    z-index: 10;
    margin-top: 4px;
    pointer-events: none;
  }

  .error-tooltip::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid #dc3545;
  }
</style>
