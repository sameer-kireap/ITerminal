// iTerminal Client Engine — Real-Time Streaming & Provenance Inspector

class TerminalApp {
  constructor() {
    this.events = [];
    this.selectedEvent = null;
    this.activeTicker = '';
    this.searchQuery = '';
    this.totalIngested = 0;
    this.totalDuplicates = 0;
    this.ws = null;

    this.initElements();
    this.initClock();
    this.initWebSocket();
    this.bindEvents();
    this.fetchInitialArticles();
  }

  initElements() {
    this.streamContainer = document.getElementById('event-stream-container');
    this.emptyState = document.getElementById('stream-empty');
    this.totalEventsEl = document.getElementById('metric-total-events');
    this.dedupRatioEl = document.getElementById('metric-dedup-ratio');
    this.wsStatusEl = document.getElementById('ws-status-text');
    this.drawerContent = document.getElementById('drawer-content');
    this.searchInput = document.getElementById('feed-search-input');
    this.tickerChips = document.querySelectorAll('.ticker-chip');
  }

  initClock() {
    const clockEl = document.getElementById('utc-clock');
    const update = () => {
      const now = new Date();
      clockEl.textContent = now.toISOString().slice(11, 19);
    };
    update();
    setInterval(update, 1000);
  }

  initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-feed`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.wsStatusEl.textContent = 'FEED ACTIVE';
        this.wsStatusEl.parentElement.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          this.handleIncomingLiveEvent(raw);
        } catch (e) {
          console.error('Failed to parse WS payload', e);
        }
      };

      this.ws.onclose = () => {
        this.wsStatusEl.textContent = 'RECONNECTING';
        this.wsStatusEl.parentElement.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        setTimeout(() => this.initWebSocket(), 3000);
      };
    } catch (err) {
      console.warn('WebSocket init deferred', err);
    }
  }

  bindEvents() {
    // Simulator triggers
    document.getElementById('btn-sim-nvda')?.addEventListener('click', () => this.triggerSimulation('nvda-beat'));
    document.getElementById('btn-sim-reuters')?.addEventListener('click', () => this.triggerSimulation('reuters-syndicate'));
    document.getElementById('btn-sim-apple')?.addEventListener('click', () => this.triggerSimulation('apple-ai-partnership'));
    document.getElementById('btn-sim-tesla')?.addEventListener('click', () => this.triggerSimulation('tesla-fcf'));

    // Ticker chips
    this.tickerChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        this.tickerChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeTicker = chip.dataset.ticker || '';
        this.renderStream();
      });
    });

    // Reset filters
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      this.tickerChips.forEach((c) => c.classList.remove('active'));
      document.querySelector('.ticker-chip[data-ticker=""]')?.classList.add('active');
      this.activeTicker = '';
      this.searchInput.value = '';
      this.searchQuery = '';
      this.renderStream();
    });

    // Search filter
    this.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderStream();
    });

    // Refresh feed
    document.getElementById('btn-refresh-feed')?.addEventListener('click', () => this.fetchInitialArticles());

    // Close drawer
    document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
      this.selectedEvent = null;
      this.renderDrawer();
      document.querySelectorAll('.event-card').forEach((c) => c.classList.remove('selected'));
    });
  }

  async triggerSimulation(scenario) {
    try {
      const res = await fetch(`/api/v1/ingestion/simulate/${scenario}`, { method: 'POST' });
      const data = await res.json();
      this.totalIngested += 1;
      if (data.status === 'duplicate') {
        this.totalDuplicates += 1;
      }
      this.updateMetrics();

      // If duplicate, append visual notification directly
      if (data.status === 'duplicate') {
        this.addNotificationCard(data);
      }
    } catch (err) {
      console.error('Simulation request failed', err);
    }
  }

  async fetchInitialArticles() {
    try {
      const res = await fetch('/api/v1/articles?limit=50');
      if (res.ok) {
        const items = await res.json();
        this.events = items.map((it) => ({
          id: it.id,
          source: it.source,
          source_id: it.source_id,
          title: it.title,
          body: it.body,
          url: it.url,
          published_at: it.published_at,
          ingested_at: it.ingested_at,
          event_type: it.event_type,
          reliability: it.source_reliability,
          status: 'detected',
          entities: it.entities || [],
          content_hash: it.content_hash,
          is_duplicate: false,
        }));
        this.totalIngested = this.events.length;
        this.updateMetrics();
        this.renderStream();
      }
    } catch (err) {
      console.warn('Initial articles fetch', err);
    }
  }

  handleIncomingLiveEvent(event) {
    this.totalIngested += 1;
    this.events.unshift(event);
    this.updateMetrics();
    this.renderStream();
  }

  addNotificationCard(data) {
    const card = document.createElement('div');
    card.className = 'event-card duplicate';
    card.innerHTML = `
      <div class="event-meta-line">
        <div class="meta-badges">
          <span class="badge badge-status duplicate">DEDUPLICATED</span>
          <span class="badge badge-source">${data.deduplication?.duplicate_type?.toUpperCase() || 'DUPLICATE'}</span>
        </div>
        <span class="event-timing font-mono">SIMILARITY: ${(data.deduplication?.similarity_score * 100).toFixed(1)}%</span>
      </div>
      <div class="event-title">Syndicated Story Suppressed (${data.content_hash.slice(0, 12)}...)</div>
      <div class="event-snippet">Content matched existing cluster ${data.deduplication?.matched_event_id ? `(#${data.deduplication.matched_event_id.slice(0, 8)})` : 'exact hash'}. Prevented compute wastage.</div>
    `;
    this.streamContainer.insertBefore(card, this.streamContainer.firstChild);
  }

  updateMetrics() {
    this.totalEventsEl.textContent = this.totalIngested;
    const ratio = this.totalIngested > 0 ? ((this.totalDuplicates / this.totalIngested) * 100).toFixed(1) : '0.0';
    this.dedupRatioEl.textContent = `${ratio}%`;
  }

  renderStream() {
    const filtered = this.events.filter((ev) => {
      // Ticker filter
      if (this.activeTicker) {
        const hasTicker = ev.entities && ev.entities.some((ent) => ent.ticker === this.activeTicker);
        if (!hasTicker && !ev.title.includes(this.activeTicker)) return false;
      }
      // Search query
      if (this.searchQuery) {
        const text = `${ev.title} ${ev.body} ${ev.source}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      this.emptyState.style.display = 'flex';
      this.streamContainer.querySelectorAll('.event-card').forEach((c) => c.remove());
      return;
    }

    this.emptyState.style.display = 'none';
    this.streamContainer.querySelectorAll('.event-card').forEach((c) => c.remove());

    filtered.forEach((ev) => {
      const card = document.createElement('div');
      card.className = `event-card ${ev.is_duplicate ? 'duplicate' : 'unique'} ${this.selectedEvent?.id === ev.id ? 'selected' : ''}`;

      const publishedTime = ev.published_at ? new Date(ev.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'JUST NOW';
      const isSec = ev.source.toLowerCase().includes('sec');

      card.innerHTML = `
        <div class="event-meta-line">
          <div class="meta-badges">
            <span class="badge badge-source ${isSec ? 'sec' : ''}">${ev.source}</span>
            <span class="badge badge-event">${ev.event_type}</span>
            <span class="badge badge-status ${ev.status}">${ev.status}</span>
          </div>
          <span class="event-timing font-mono">${publishedTime}</span>
        </div>
        <div class="event-title">${ev.title}</div>
        <div class="event-snippet">${ev.body}</div>
        <div class="event-footer">
          <div class="entity-tags">
            ${(ev.entities || []).map((ent) => `<span class="entity-tag">${ent.ticker || ent.name}</span>`).join('')}
          </div>
          <span class="hash-preview font-mono">${ev.content_hash ? ev.content_hash.slice(0, 10) + '...' : ''}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.event-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedEvent = ev;
        this.renderDrawer();
      });

      this.streamContainer.appendChild(card);
    });
  }

  renderDrawer() {
    if (!this.selectedEvent) {
      this.drawerContent.innerHTML = `
        <div class="drawer-empty-state">
          <p>Select an event from the intelligence stream to inspect its cryptographic content hash, resolved entities, and provenance metadata.</p>
        </div>
      `;
      return;
    }

    const ev = this.selectedEvent;
    this.drawerContent.innerHTML = `
      <div class="audit-block">
        <span class="audit-label">EVENT ID</span>
        <span class="audit-value">${ev.id}</span>
      </div>

      <div class="audit-block">
        <span class="audit-label">TITLE</span>
        <strong style="color: var(--text-primary); font-size: 13px;">${ev.title}</strong>
      </div>

      <div class="audit-block">
        <span class="audit-label">PRIMARY PROVENANCE</span>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div><span style="color: var(--text-muted);">Source:</span> <strong>${ev.source}</strong></div>
          <div><span style="color: var(--text-muted);">Reliability:</span> <strong style="color: var(--amber);">${ev.reliability.toUpperCase()}</strong></div>
          <div><span style="color: var(--text-muted);">Published:</span> <span class="font-mono">${ev.published_at || 'N/A'}</span></div>
          <div><span style="color: var(--text-muted);">Ingested:</span> <span class="font-mono">${ev.ingested_at || 'N/A'}</span></div>
        </div>
      </div>

      <div class="audit-block">
        <span class="audit-label">RESOLVED ENTITIES (NER)</span>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${(ev.entities || []).length > 0
            ? ev.entities.map((ent) => `
                <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 3px 6px; background: rgba(6, 182, 212, 0.08); border-radius: 3px;">
                  <strong style="color: var(--cyan);">${ent.name} (${ent.ticker || 'N/A'})</strong>
                  <span class="font-mono" style="color: var(--text-muted);">CIK: ${ent.cik || 'N/A'}</span>
                </div>
              `).join('')
            : '<span style="color: var(--text-muted);">No corporate entities matched.</span>'
          }
        </div>
      </div>

      <div class="audit-block">
        <span class="audit-label">CRYPTOGRAPHIC CONTENT HASH (SHA-256)</span>
        <span class="audit-value text-cyan">${ev.content_hash}</span>
      </div>

      ${ev.url ? `
        <div class="audit-block">
          <span class="audit-label">SOURCE URL</span>
          <a href="${ev.url}" target="_blank" rel="noopener" style="color: var(--cyan); font-size: 11px; word-break: break-all;">${ev.url}</a>
        </div>
      ` : ''}

      <div class="audit-block">
        <span class="audit-label">CANONICAL BODY TEXT</span>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">${ev.body}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new TerminalApp();
});
