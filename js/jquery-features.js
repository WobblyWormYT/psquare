/* ============================================================
   PSQUARE ART GALLERY — jquery-features.js  (Experiment 4)
   jQuery + AJAX Features:
     4. Shopping Cart
     5. Artwork Rating & Reviews
     6. Artist Profiles (AIC)
     7. Contact / Enquiry Form  → AJAX POST to api/contact.php
     8. User Login & Register  → AJAX POST to api/auth.php
   ============================================================ */

$(function () {

  // ═══════════════════════════════════════════════════════
  // FEATURE 4: SHOPPING CART (jQuery + localStorage)
  // ═══════════════════════════════════════════════════════
  const PRINT_PRICE = 299;
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('psquareCart') || '{}'); } catch(_) {}

  function saveCart()  { try { localStorage.setItem('psquareCart', JSON.stringify(cart)); } catch(_){} }
  function cartCount() { return Object.values(cart).reduce((s,i) => s + i.quantity, 0); }

  function refreshBadge() {
    const n = cartCount();
    $('.cart-badge').text(n);
    n > 0 ? $('.cart-badge').css('display','flex') : $('.cart-badge').hide();
  }

  window.addToCart = function(id, source, title, image) {
    if (cart[id]) { cart[id].quantity++; }
    else { cart[id] = { id, source, title, image, quantity: 1, price: PRINT_PRICE }; }
    saveCart(); refreshBadge();
    toast(`"${title}" added to cart 🛒`);
  };

  refreshBadge();

  // ── Cart page rendering ──────────────────────────────
  function renderCartPage() {
    const $items = $('#cartItems');
    if (!$items.length) return;
    const items = Object.values(cart);
    if (items.length === 0) {
      $items.html(`<div class="empty-cart">
        <p>🖼 Your cart is empty</p>
        <a href="gallery.html" class="btn">Browse Gallery</a>
      </div>`);
      $('#cartTotal').text('₹0');
      $('#checkoutBtn').prop('disabled', true).css('opacity', 0.5);
      return;
    }
    $('#checkoutBtn').prop('disabled', false).css('opacity', 1);
    let total = 0;
    $items.empty();
    items.forEach(item => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      const $el = $(`
        <div class="cart-item" id="ci-${item.id}">
          <img src="${item.image}" class="cart-item-img" alt="${item.title}"
               onerror="this.src='images/paintings/mona.jpg'">
          <div class="cart-item-info">
            <h3>${item.title}</h3>
            <p>Fine Art Print (A3 / 300 dpi) — ₹${item.price} each</p>
            <div class="cart-qty">
              <button class="qty-btn" data-id="${item.id}" data-delta="-1">−</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
            </div>
          </div>
          <div class="cart-item-right">
            <p class="cart-item-price">₹${subtotal}</p>
            <button class="btn-remove" data-id="${item.id}">✕ Remove</button>
          </div>
        </div>`).hide();
      $items.append($el.fadeIn(300));
    });
    $('#cartTotal').text('₹' + total);
    $('#cartCount').text(items.length + ' item' + (items.length > 1 ? 's' : ''));
  }

  $(document).on('click', '.qty-btn', function() {
    const id    = $(this).data('id');
    const delta = parseInt($(this).data('delta'));
    if (!cart[id]) return;
    cart[id].quantity = Math.max(1, cart[id].quantity + delta);
    saveCart(); refreshBadge(); renderCartPage();
  });

  $(document).on('click', '.btn-remove', function() {
    const id = $(this).data('id');
    $(`#ci-${id}`).fadeOut(300, function() {
      delete cart[id]; saveCart(); refreshBadge(); renderCartPage();
    });
  });

  window.checkoutCart = function() {
    if (!Object.keys(cart).length) { toast('Your cart is empty!'); return; }
    const total = Object.values(cart).reduce((s,i) => s + i.price * i.quantity, 0);
    alert(`Thank you for your order!\n\nTotal: ₹${total}\n\nYour fine art prints will be dispatched within 5-7 business days.`);
    cart = {}; saveCart(); refreshBadge(); renderCartPage();
  };

  renderCartPage();

  $(document).on('click', '#addToCartBtn', function() {
    addToCart(
      $(this).attr('data-id'),
      $(this).attr('data-source') || 'db',
      $(this).attr('data-title'),
      $(this).attr('data-image')
    );
  });


  // ═══════════════════════════════════════════════════════
  // FEATURE 5: ARTWORK RATINGS & REVIEWS (jQuery)
  // ═══════════════════════════════════════════════════════
  let reviews = {};
  try { reviews = JSON.parse(localStorage.getItem('psquareReviews') || '{}'); } catch(_) {}
  function saveReviews() { try { localStorage.setItem('psquareReviews', JSON.stringify(reviews)); } catch(_){} }

  function artKey() {
    const p = new URLSearchParams(window.location.search);
    return 'art-' + (p.get('id') || 'unknown');
  }

  function starsHtml(r) { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }

  function drawInteractiveStars($c, current = 0) {
    $c.empty();
    for (let i = 1; i <= 5; i++) {
      $('<span class="interactive-star">').text(i <= current ? '★' : '☆').data('val', i).appendTo($c);
    }
  }

  function renderReviews() {
    const $list = $('#reviewsList');
    if (!$list.length) return;
    const key  = artKey();
    const list = reviews[key] || [];
    const avg  = list.length ? list.reduce((s,r) => s + r.rating, 0) / list.length : 0;

    $('#avgRating').text(list.length ? avg.toFixed(1) + ' / 5' : 'No ratings yet');
    $('#avgStars').text(list.length ? starsHtml(avg) : '☆☆☆☆☆');
    $('#reviewCount').text(`(${list.length} review${list.length !== 1 ? 's' : ''})`);

    if (!list.length) { $list.html('<p class="no-reviews">Be the first to review this artwork!</p>'); return; }
    $list.empty();
    [...list].reverse().forEach(r => {
      const $card = $(`
        <div class="review-card">
          <div class="review-header">
            <span class="review-stars">${starsHtml(r.rating)}</span>
            <span class="review-author">${$('<div>').text(r.name).html()}</span>
            <span class="review-date">${r.date}</span>
          </div>
          <p class="review-text">${$('<div>').text(r.text).html()}</p>
        </div>`).hide();
      $list.append($card);
      $card.fadeIn(250);
    });
  }

  let pickedRating = 0;
  $(document).on('mouseenter', '.interactive-star', function() {
    const h = $(this).data('val');
    $(this).closest('.stars-input').find('.interactive-star').each((i,el) => $(el).text(i < h ? '★' : '☆'));
  });
  $(document).on('mouseleave', '.stars-input', function() { drawInteractiveStars($(this), pickedRating); });
  $(document).on('click', '.interactive-star', function() {
    pickedRating = $(this).data('val');
    drawInteractiveStars($(this).closest('.stars-input'), pickedRating);
    $('#selectedRating').val(pickedRating);
  });

  $('#submitReview').on('click', function() {
    const name   = $('#reviewName').val().trim();
    const text   = $('#reviewText').val().trim();
    const rating = parseInt($('#selectedRating').val() || 0);
    if (!name)   { toast('Please enter your name.');          return; }
    if (!rating) { toast('Please select a star rating.');     return; }
    if (!text)   { toast('Please write your review.');        return; }

    const key = artKey();
    if (!reviews[key]) reviews[key] = [];
    reviews[key].push({ name, rating, text, date: new Date().toLocaleDateString('en-IN') });
    saveReviews();
    $('#reviewName, #reviewText').val('');
    pickedRating = 0; drawInteractiveStars($('.stars-input'), 0); $('#selectedRating').val(0);
    renderReviews();
    toast('Review submitted — thank you!');
  });

  if ($('#reviewsList').length) { renderReviews(); drawInteractiveStars($('.stars-input'), 0); }


  // ═══════════════════════════════════════════════════════
  // FEATURE 6: ARTIST PROFILES (jQuery $.ajax → AIC)
  // ═══════════════════════════════════════════════════════
  const AIC_SEARCH  = 'https://api.artic.edu/api/v1/artworks/search';
  const AIC_IMG     = id => `https://www.artic.edu/iiif/2/${id}/full/400,/0/default.jpg`;
  const FEATURED    = ['Claude Monet','Vincent van Gogh','Rembrandt van Rijn',
                       'Pablo Picasso','Leonardo da Vinci','Johannes Vermeer',
                       'Edgar Degas','Paul Gauguin'];

  function buildChips() {
    const $c = $('#featuredArtists');
    if (!$c.length) return;
    $c.empty();
    FEATURED.forEach(name => $('<div class="artist-chip">').text(name).data('name', name).appendTo($c));
  }
  buildChips();

  function loadArtistWorks(artistName) {
    const $container = $('#artistWorks');
    if (!$container.length) return;
    $container.html('<div class="loading-spinner">Searching collection<span class="loading-dots"></span></div>');

    $.ajax({
      url    : AIC_SEARCH,
      method : 'GET',
      data   : { q: artistName, limit: 8, fields: 'id,title,date_display,image_id,medium_display,artist_display' },
      success(data) {
        const works = (data.data || []).filter(a => a.image_id);
        if (!works.length) {
          $container.html('<p class="no-results" style="padding:40px">No works found for this artist.</p>'); return;
        }
        if (works[0].artist_display) {
          $('#artistProfile .profile-artist-name').text(works[0].artist_display.split('\n')[0]);
        }
        $container.empty();
        works.forEach((a, i) => {
          const $card = $(`
            <div class="artist-work-card">
              <img src="${AIC_IMG(a.image_id)}" alt="${a.title}" loading="lazy">
              <h4>${a.title}</h4>
              <p>${a.date_display || ''}</p>
              <p class="medium">${(a.medium_display || '').slice(0, 60)}…</p>
            </div>`).hide();
          $container.append($card);
          $card.delay(i * 80).fadeIn(400);
        });
      },
      error() {
        $container.html('<p class="no-results" style="padding:40px">Could not connect to AIC collection.</p>');
      }
    });
  }

  $(document).on('click', '.artist-chip', function() {
    const name = $(this).data('name');
    $('.artist-chip').removeClass('active'); $(this).addClass('active');
    $('#artistSearchInput').val(name);
    $('#artistProfile').show();
    $('#artistProfile .profile-artist-name').text(name);
    loadArtistWorks(name);
  });

  $('#searchArtistBtn').on('click', function() {
    const q = $('#artistSearchInput').val().trim();
    if (!q) { toast('Please enter an artist name.'); return; }
    $('.artist-chip').removeClass('active');
    $('#artistProfile').show();
    $('#artistProfile .profile-artist-name').text(q);
    loadArtistWorks(q);
  });

  $('#artistSearchInput').on('keypress', e => { if (e.key === 'Enter') $('#searchArtistBtn').trigger('click'); });

  if ($('#artistWorks').length) {
    const def = 'Claude Monet';
    $('#artistSearchInput').val(def);
    $('#artistProfile').show().find('.profile-artist-name').text(def);
    loadArtistWorks(def);
    $('.artist-chip').filter(function(){ return $(this).data('name') === def; }).addClass('active');
  }


  // ═══════════════════════════════════════════════════════
  // FEATURE 7: CONTACT / ENQUIRY FORM (jQuery AJAX)
  // ═══════════════════════════════════════════════════════
  $('#contactForm').on('submit', function(e) {
    e.preventDefault();

    const formData = {
      name   : $('#contactName').val().trim(),
      email  : $('#contactEmail').val().trim(),
      subject: $('#contactSubject').val().trim(),
      message: $('#contactMessage').val().trim()
    };

    if (!formData.name || !formData.email || !formData.message) {
      toast('Please fill in all required fields.'); return;
    }

    const $btn = $('#contactSubmitBtn');
    $btn.prop('disabled', true).text('Sending…');

    $.ajax({
      url        : 'api/contact.php',
      method     : 'POST',
      contentType: 'application/json',
      data       : JSON.stringify(formData),
      success(res) {
        $btn.prop('disabled', false).text('Send Message');
        if (res.success) {
          toast('✅ ' + res.message);
          $('#contactForm')[0].reset();
        } else {
          toast('❌ ' + res.message);
        }
      },
      error() {
        $btn.prop('disabled', false).text('Send Message');
        toast('⚠ Could not reach the server. Is XAMPP running?');
      }
    });
  });


  // ═══════════════════════════════════════════════════════
  // FEATURE 8: USER LOGIN & REGISTRATION (jQuery AJAX)
  // ═══════════════════════════════════════════════════════

  // Check session on every page load → update navbar
  $.ajax({
    url    : 'api/auth.php?action=check',
    method : 'POST',
    success(res) {
      if (res.logged_in) {
        updateNavForLoggedIn(res.user_name);
      }
    }
  });

  function updateNavForLoggedIn(name) {
    const $link = $('.nav-auth-link');
    if ($link.length) {
      $link.html(`👤 ${name} &nbsp;<span class="logout-btn" style="cursor:pointer;color:var(--gold-dark);font-size:12px;">[Logout]</span>`);
    }
    
    // If we are on the auth.html page, switch to Dashboard view
    if ($('#accountPanel').length) {
      $('.auth-tabs').hide();
      $('#loginPanel').hide();
      $('#registerPanel').hide();
      $('#accountPanel').fadeIn(300);
      $('#accountName').text(name);
      loadBookingHistory();
    }
  }

  function loadBookingHistory() {
    $.ajax({
      url: 'api/tickets.php?action=history',
      method: 'GET',
      success(res) {
        const $hist = $('#bookingHistory');
        if (!res.success) {
          $hist.html('<p class="no-results">Could not load booking history.</p>');
          return;
        }
        if (!res.bookings || res.bookings.length === 0) {
          $hist.html('<p style="text-align:center;color:var(--text-muted);font-size:15px;padding:20px;">You have no bookings yet.</p>');
          return;
        }
        
        $hist.empty();
        res.bookings.forEach(b => {
          const dt = new Date(b.visit_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
          const $card = $(`
            <div style="border:1px solid var(--border-gold); padding:15px; margin-bottom:15px; border-radius:4px; background:var(--bg-dark);">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <strong style="color:var(--gold);font-size:16px;">${b.ticket_id}</strong>
                <span style="color:var(--text-muted);font-size:14px;">Visit: ${dt}</span>
              </div>
              <div style="font-size:14px;color:#ddd;line-height:1.6;">
                <div>Name: ${b.visitor_name}</div>
                <div>Amount: ₹${b.total_amount}</div>
                <div style="color:var(--text-muted);font-size:12px;margin-top:6px;">Booked on: ${b.booked_at}</div>
              </div>
            </div>
          `);
          $hist.append($card);
        });
      },
      error() {
        $('#bookingHistory').html('<p class="no-results">Error connecting to server.</p>');
      }
    });
  }

  $(document).on('click', '.logout-btn', function() {
    $.post('api/auth.php?action=logout', function(res) {
      if (res.success) { toast('Logged out.'); setTimeout(() => location.reload(), 800); }
    });
  });

  // ── Registration Form ─────────────────────────────────
  $('#registerForm').on('submit', function(e) {
    e.preventDefault();
    const data = {
      full_name: $('#regName').val().trim(),
      email    : $('#regEmail').val().trim(),
      password : $('#regPassword').val(),
      confirm  : $('#regConfirm').val()
    };
    const $btn = $('#registerBtn');
    $btn.prop('disabled', true).text('Creating Account…');

    $.ajax({
      url        : 'api/auth.php?action=register',
      method     : 'POST',
      contentType: 'application/json',
      data       : JSON.stringify(data),
      success(res) {
        $btn.prop('disabled', false).text('Create Account');
        if (res.success) {
          toast('✅ ' + res.message);
          $('#registerForm')[0].reset();
          setTimeout(() => window.location.href = 'index.html', 1200);
        } else {
          toast('❌ ' + res.message);
        }
      },
      error() {
        $btn.prop('disabled', false).text('Create Account');
        toast('⚠ Server not reachable. Is XAMPP running?');
      }
    });
  });

  // ── Login Form ────────────────────────────────────────
  $('#loginForm').on('submit', function(e) {
    e.preventDefault();
    const data = {
      email   : $('#loginEmail').val().trim(),
      password: $('#loginPassword').val()
    };
    const $btn = $('#loginBtn');
    $btn.prop('disabled', true).text('Logging in…');

    $.ajax({
      url        : 'api/auth.php?action=login',
      method     : 'POST',
      contentType: 'application/json',
      data       : JSON.stringify(data),
      success(res) {
        $btn.prop('disabled', false).text('Login');
        if (res.success) {
          toast('✅ ' + res.message);
          setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
          toast('❌ ' + res.message);
        }
      },
      error() {
        $btn.prop('disabled', false).text('Login');
        toast('⚠ Server not reachable. Is XAMPP running?');
      }
    });
  });

  // Toggle between login & register tabs
  $(document).on('click', '#showRegister', function(e) {
    e.preventDefault();
    $('#loginPanel').hide(); $('#registerPanel').fadeIn(300);
  });
  $(document).on('click', '#showLogin', function(e) {
    e.preventDefault();
    $('#registerPanel').hide(); $('#loginPanel').fadeIn(300);
  });


  // ═══════════════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════════════
  function toast(msg) {
    const $t = $('<div class="toast-notification">').text(msg).appendTo('body');
    setTimeout(() => $t.addClass('toast-show'), 10);
    setTimeout(() => { $t.removeClass('toast-show'); setTimeout(() => $t.remove(), 350); }, 2800);
  }
  window.showToastMsg = toast;

}); // end $()
