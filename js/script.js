/* ============================================================
   PSQUARE ART GALLERY — script.js  (Experiment 4 Edition)
   JavaScript + AJAX Features:
     1. Dynamic Art Display     → fetched from MySQL via api/artworks.php
     2. Dynamic Search          → AJAX search against DB
     3. Ticket Booking & Print  → booking saved to DB via api/tickets.php
   ============================================================ */

// ═══════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════
const API = {
  artworks: 'api/artworks.php',
  tickets: 'api/tickets.php',
  contact: 'api/contact.php',
  auth: 'api/auth.php'
};

// ═══════════════════════════════════════════════════════
// FEATURE 1 — DYNAMIC ART DISPLAY (AJAX from DB)
// ═══════════════════════════════════════════════════════

let allArtworks = [];

/**
 * Build one gallery card HTML string.
 */
function createGalleryCard(art) {
  const detailUrl = `art-details.html?id=${art.id}`;
  return `
    <div class="art-card"
         data-title="${art.title.toLowerCase()}"
         data-artist="${art.artist.toLowerCase()}"
         data-year="${art.year || ''}"
         data-medium="${(art.medium || '').toLowerCase()}"
         data-category="${art.category || ''}">
      <a href="${detailUrl}" class="art-card-link">
        <div class="art-card-img-wrap">
          <img src="${art.image_path}" alt="${art.title}" loading="lazy"
               onerror="this.src='images/paintings/mona.jpg'">
        </div>
        <div class="art-card-info">
          <h3>${art.title}</h3>
          <p class="artist-name">${art.artist}</p>
          <p class="art-year">${art.year || ''}</p>
        </div>
      </a>
      <div class="art-card-actions">
        <button class="btn-small btn-view"
          onclick="window.location='${detailUrl}'">View Details</button>
        <button class="btn-small btn-cart"
          onclick="addToCart('${art.id}','db','${art.title.replace(/'/g, "\\'")}','${art.image_path}')">
          🛒 Cart
        </button>
      </div>
    </div>`;
}

/**
 * Render gallery cards into #galleryGrid.
 */
function renderGallery(artworks) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  if (artworks.length === 0) {
    grid.innerHTML = '<p class="no-results">No artworks found.</p>';
    return;
  }
  grid.innerHTML = artworks.map(createGalleryCard).join('');
  const countEl = document.getElementById('resultCount');
  if (countEl) countEl.textContent = artworks.length + ' artworks';
}

/**
 * AJAX call to fetch all artworks from MySQL via api/artworks.php
 */
function loadGalleryFromDB() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-indicator">Loading collection<span class="loading-dots"></span></div>';

  fetch(API.artworks)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        allArtworks = data.artworks;
        renderGallery(allArtworks);
      } else {
        grid.innerHTML = '<p class="no-results">Could not load artworks from database.</p>';
      }
    })
    .catch(err => {
      console.error('Gallery load error:', err);
      grid.innerHTML = `<p class="no-results">
        ⚠ Database not reachable.<br>
        Make sure XAMPP is running and you have imported psquare_db.sql
      </p>`;
    });
}

// ═══════════════════════════════════════════════════════
// FEATURE 2 — DYNAMIC SEARCH (AJAX to DB)
// ═══════════════════════════════════════════════════════

let searchTimer = null;

/**
 * On every keystroke, send AJAX request to api/artworks.php?search=...
 * Also applies local category/year dropdown filters on the returned results.
 */
function searchArt() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const query = (document.getElementById('searchInput')?.value || '').trim();
    const catFilter = document.getElementById('categoryFilter')?.value || 'all';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';

    const url = query
      ? `${API.artworks}?search=${encodeURIComponent(query)}`
      : API.artworks;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;
        let results = data.artworks;

        // Apply category dropdown filter locally
        if (catFilter !== 'all') {
          results = results.filter(a => a.category === catFilter);
        }

        // Apply year range filter locally
        if (yearFilter !== 'all') {
          results = results.filter(a => {
            const y = parseInt(a.year) || 0;
            if (yearFilter === 'before1700') return y < 1700;
            if (yearFilter === '1700to1900') return y >= 1700 && y <= 1900;
            if (yearFilter === 'after1900') return y > 1900;
            return true;
          });
        }

        renderGallery(results);
      })
      .catch(err => console.error('Search error:', err));
  }, 250);
}

// ═══════════════════════════════════════════════════════
// FEATURE 3 — TICKET BOOKING + SAVE TO DB + PRINT
// ═══════════════════════════════════════════════════════

const PRICES = { adult: 150, student: 80, child: 50, senior: 60 };

function calculateTotal() {
  const qty = (id) => Math.max(0, parseInt(document.getElementById(id)?.value || 0));
  const adult = qty('adultQty');
  const student = qty('studentQty');
  const child = qty('childQty');
  const senior = qty('seniorQty');
  const total = adult * PRICES.adult + student * PRICES.student +
    child * PRICES.child + senior * PRICES.senior;

  const el = document.getElementById('totalPrice');
  if (el) {
    el.textContent = total;
    el.parentElement.classList.remove('price-updated');
    void el.parentElement.offsetWidth;
    el.parentElement.classList.add('price-updated');
  }
  return { adult, student, child, senior, total };
}

/**
 * Validate form → save booking to DB via AJAX → show ticket modal.
 */
function bookTickets() {
  const name = document.getElementById('visitorName')?.value.trim();
  const date = document.getElementById('visitDate')?.value;
  const email = document.getElementById('visitorEmail')?.value.trim();

  if (!name) { showToastMsg('Please enter your name.'); return; }
  if (!date) { showToastMsg('Please select a visit date.'); return; }
  if (!email) { showToastMsg('Please enter your email address.'); return; }

  const { adult, student, child, senior, total } = calculateTotal();
  if (adult + student + child + senior === 0) {
    showToastMsg('Please select at least one ticket.'); return;
  }

  const ticketId = 'PSQ-' + Date.now().toString(36).toUpperCase();
  const bookingData = {
    ticket_id: ticketId,
    visitor_name: name,
    email: email,
    visit_date: date,
    adult_qty: adult,
    student_qty: student,
    child_qty: child,
    senior_qty: senior,
    total_amount: total
  };

  // Disable button while saving
  const btn = document.getElementById('bookBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  // AJAX: save booking to DB
  fetch(API.tickets, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
    .then(res => res.json())
    .then(data => {
      if (btn) { btn.disabled = false; btn.textContent = 'Confirm Booking & Generate Ticket'; }
      if (data.success) {
        showToastMsg('✅ Booking saved to database!');
        showTicketModal({
          ticketId, name, date, email, adult, student, child, senior, total,
          bookedAt: new Date().toLocaleString('en-IN')
        });
      } else {
        showToastMsg(data.message);
      }
    })
    .catch(err => {
      if (btn) { btn.disabled = false; btn.textContent = 'Confirm Booking & Generate Ticket'; }
      console.error('Ticket save error:', err);
      showToastMsg('⚠ Could not connect to server to verify booking.');
    });
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function showTicketModal(data) {
  const modal = document.getElementById('ticketModal');
  const content = document.getElementById('ticketContent');
  if (!modal || !content) return;

  let rows = '';
  if (data.adult > 0) rows += `<tr><td>Adult × ${data.adult}</td><td>₹${data.adult * PRICES.adult}</td></tr>`;
  if (data.student > 0) rows += `<tr><td>Student × ${data.student}</td><td>₹${data.student * PRICES.student}</td></tr>`;
  if (data.child > 0) rows += `<tr><td>Child × ${data.child}</td><td>₹${data.child * PRICES.child}</td></tr>`;
  if (data.senior > 0) rows += `<tr><td>Senior × ${data.senior}</td><td>₹${data.senior * PRICES.senior}</td></tr>`;

  content.innerHTML = `
    <div class="ticket">
      <div class="ticket-header">
        <h2>🏛 PSquare Art Gallery</h2>
        <p>Panjim, Goa &nbsp;|&nbsp; psquaregallery@gmail.com &nbsp;|&nbsp; +91 98765 43210</p>
      </div>
      <div class="ticket-divider">✦ &nbsp; ADMISSION TICKET &nbsp; ✦</div>
      <div class="ticket-field"><span>Ticket ID</span><strong>${data.ticketId}</strong></div>
      <div class="ticket-field"><span>Visitor Name</span><strong>${data.name}</strong></div>
      <div class="ticket-field"><span>Visit Date</span><strong>${fmtDate(data.date)}</strong></div>
      <div class="ticket-field"><span>Email</span><strong>${data.email}</strong></div>
      <table class="ticket-table">
        <thead><tr><th>Ticket Type</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td><strong>Grand Total</strong></td><td><strong>₹${data.total}</strong></td></tr></tfoot>
      </table>
      <div class="ticket-footer">
        <p>Booked on: ${data.bookedAt}</p>
        <p>Please carry this ticket on your visit. Valid only on the selected date.</p>
        <p>Gallery hours: 09:00 AM – 5:00 PM (All days)</p>
        <div class="ticket-barcode">||| |||| | ||| |||| || ||| &nbsp; ${data.ticketId} &nbsp; ||| || |||| | ||| ||||</div>
      </div>
    </div>`;

  modal.style.display = 'flex';
}

function printTicket() {
  const content = document.getElementById('ticketContent');
  if (!content) return;
  const win = window.open('', '_blank', 'width=680,height=720');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>PSquare Art Gallery — Ticket</title>
    <style>
      body{font-family:'Times New Roman',serif;background:#fff;color:#1a1a1a;margin:0;padding:24px}
      .ticket{border:3px double #8B1A1A;max-width:580px;margin:0 auto;padding:28px 36px}
      .ticket-header{text-align:center;padding-bottom:16px;border-bottom:2px solid #8B1A1A;margin-bottom:14px}
      .ticket-header h2{font-size:26px;color:#8B1A1A;margin-bottom:4px}
      .ticket-header p{font-size:12px;color:#666}
      .ticket-divider{text-align:center;color:#C9A84C;letter-spacing:6px;font-size:13px;margin:14px 0}
      .ticket-field{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dotted #ddd;font-size:14px}
      .ticket-field span{color:#888;font-size:12px}
      .ticket-table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}
      .ticket-table th{background:#8B1A1A;color:#fff;padding:9px 12px;text-align:left}
      .ticket-table td{padding:8px 12px;border-bottom:1px solid #eee}
      .ticket-table tfoot td{font-weight:bold;background:#f5f0e8;font-size:15px}
      .ticket-footer{margin-top:16px;text-align:center;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:12px}
      .ticket-barcode{font-family:monospace;font-size:9px;margin-top:10px;letter-spacing:1px;color:#bbb}
    </style></head><body>${content.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
}

function closeTicketModal() {
  const modal = document.getElementById('ticketModal');
  if (modal) modal.style.display = 'none';
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'ticketModal') closeTicketModal();
});

// ═══════════════════════════════════════════════════════
// ART DETAILS — Load single artwork from DB via AJAX
// ═══════════════════════════════════════════════════════
async function loadArtDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  try {
    const res = await fetch(`${API.artworks}?id=${id}`);
    const data = await res.json();
    if (!data.success) return;
    const a = data.artwork;

    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val || '—'; };
    const img = document.getElementById('artImage');
    if (img) img.src = a.image_path || '';

    set('artTitle', a.title);
    set('artArtist', a.artist);
    set('artYear', a.year);
    set('artMedium', a.medium);
    set('artOrigin', a.origin);
    set('artDesc', a.description);

    const cartBtn = document.getElementById('addToCartBtn');
    if (cartBtn) {
      cartBtn.setAttribute('data-id', a.id);
      cartBtn.setAttribute('data-source', 'db');
      cartBtn.setAttribute('data-title', a.title);
      cartBtn.setAttribute('data-image', a.image_path);
    }
  } catch (err) {
    console.error('Art details load error:', err);
  }
}

// ═══════════════════════════════════════════════════════
// TOAST HELPER
// ═══════════════════════════════════════════════════════
function showToastMsg(msg) {
  const t = document.createElement('div');
  t.className = 'toast-notification';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast-show'));
  setTimeout(() => {
    t.classList.remove('toast-show');
    setTimeout(() => t.remove(), 350);
  }, 2800);
}

// ═══════════════════════════════════════════════════════
// PAGE INIT
// ═══════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {

  // Gallery Page
  if (document.getElementById('galleryGrid')) {
    loadGalleryFromDB();
  }

  // Art Details Page
  if (document.getElementById('artTitle')) {
    loadArtDetails();
  }

  // Ticket Page: live total on qty change
  ['adultQty', 'studentQty', 'childQty', 'seniorQty'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calculateTotal);
  });

  // Set min date to today on ticket page
  const dateInput = document.getElementById('visitDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
});
