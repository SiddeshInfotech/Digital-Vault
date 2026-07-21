// Digital Document Vault - Client Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let theme = localStorage.getItem('vault_theme') || 'light';
  let currentUser = null;
  let activeTab = 'Dashboard';
  let documentsList = [];
  let categoriesList = ['All', 'Proposals', 'Meetings', 'Finance', 'Presentations', 'Contracts', 'Others'];
  let selectedCategoryFilter = 'All';
  let searchQuery = '';
  let activePreviewDoc = null;
  let activeShareDoc = null;
  let selectedUpgradePlan = 'Pro Vault';

  // FAQs Data
  const faqs = [
    { question: 'How secure is my data in the Digital Document Vault?', answer: 'We employ AES-256 end-to-end zero-knowledge encryption. Your files are encrypted prior to database indexing, ensuring only you hold decodable access.' },
    { question: 'What file size limit applies to uploads?', answer: 'Free accounts allow files up to 50 MB per file, while Pro and Enterprise plans accommodate up to 5 GB files with unlimited total capacity.' },
    { question: 'How does document sharing work?', answer: 'Sharing generates encrypted tokenized links sent to recipient email addresses, allowing zero-knowledge view permissions without compromising your vault security.' },
    { question: 'What happens when I delete a document?', answer: 'Deleted items are safely placed in your Trash bin where they can be restored at any time, or permanently deleted to free up storage quota.' }
  ];

  // Initialize Theme
  function applyTheme(newTheme) {
    theme = newTheme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vault_theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', theme === 'light' ? 'moon' : 'sun');
      if (window.lucide) lucide.createIcons();
    }
  }
  applyTheme(theme);

  document.getElementById('global-theme-toggle')?.addEventListener('click', () => {
    applyTheme(theme === 'light' ? 'dark' : 'light');
  });

  // Render Icons
  function refreshIcons() {
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 20);
    }
  }
  refreshIcons();

  // Navigation View Switching
  function showView(viewId) {
    const views = ['auth-container', 'view-forgot', 'view-loader', 'view-dashboard'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    if (viewId === 'auth') {
      document.getElementById('auth-container').classList.remove('hidden');
      document.getElementById('view-login').classList.remove('hidden');
      document.getElementById('view-register').classList.add('hidden');
    } else if (viewId === 'register') {
      document.getElementById('auth-container').classList.remove('hidden');
      document.getElementById('view-login').classList.add('hidden');
      document.getElementById('view-register').classList.remove('hidden');
    } else if (viewId === 'forgot') {
      document.getElementById('view-forgot').classList.remove('hidden');
    } else if (viewId === 'loader') {
      document.getElementById('view-loader').classList.remove('hidden');
      runVaultLoader();
    } else if (viewId === 'dashboard') {
      document.getElementById('view-dashboard').classList.remove('hidden');
      loadDashboardData();
    }
    refreshIcons();
  }

  // Vault Loader Animation
  function runVaultLoader() {
    let progress = 0;
    const ringCircle = document.getElementById('loader-ring-fill-circle');
    const progressFill = document.getElementById('loader-progress-bar-fill');
    const percentText = document.getElementById('loader-progress-percentage');
    const welcomeTitle = document.getElementById('loader-welcome-text');

    if (currentUser) {
      welcomeTitle.textContent = currentUser.isNewUser ? `Welcome, ${currentUser.fullName}!` : `Welcome back, ${currentUser.fullName}!`;
    }

    const circumference = 326.72;
    const interval = setInterval(() => {
      progress += 2;
      if (progress > 100) progress = 100;

      const offset = circumference - (progress / 100) * circumference;
      if (ringCircle) ringCircle.style.strokeDashoffset = offset;
      if (progressFill) progressFill.style.width = `${progress}%`;
      if (percentText) percentText.textContent = `${Math.round(progress)}%`;

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          showView('dashboard');
        }, 200);
      }
    }, 25);
  }

  // API Call Wrapper
  async function apiCall(endpoint, method = 'GET', payload = null) {
    try {
      const options = { method, headers: {} };
      if (payload) {
        if (payload instanceof FormData) {
          options.body = payload;
        } else {
          options.headers['Content-Type'] = 'application/json';
          options.body = JSON.stringify(payload);
        }
      }
      const response = await fetch(endpoint, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // ================= AUTH FORM HANDLERS =================
  // Password Visibility Toggles
  document.getElementById('toggle-login-password')?.addEventListener('click', () => {
    const input = document.getElementById('login-password');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('toggle-reg-password')?.addEventListener('click', () => {
    const input = document.getElementById('reg-password');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Switch Auth Sub-views
  document.getElementById('link-goto-register')?.addEventListener('click', (e) => { e.preventDefault(); showView('register'); });
  document.getElementById('link-goto-login')?.addEventListener('click', (e) => { e.preventDefault(); showView('auth'); });
  document.getElementById('link-forgot-password')?.addEventListener('click', (e) => { e.preventDefault(); showView('forgot'); });
  document.getElementById('btn-forgot-back')?.addEventListener('click', () => showView('auth'));
  document.getElementById('btn-forgot-done-back')?.addEventListener('click', () => showView('auth'));

  // Login Submit
  document.getElementById('form-login')?.addEventListener('click', async (e) => {
    if (e.target.closest('#btn-login-submit') || e.target.type === 'submit') {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      const emailErr = document.getElementById('login-email-error');
      const passErr = document.getElementById('login-password-error');

      emailErr.textContent = ''; passErr.textContent = '';
      if (!email) { emailErr.textContent = 'Email is required'; return; }
      if (!password) { passErr.textContent = 'Password is required'; return; }

      try {
        const res = await apiCall('/api/auth/login', 'POST', { email, password });
        currentUser = res.user;
        showView('loader');
      } catch (err) {
        if (err.message.toLowerCase().includes('email')) emailErr.textContent = err.message;
        else passErr.textContent = err.message;
      }
    }
  });

  // Register Submit
  document.getElementById('form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    document.getElementById('reg-name-error').textContent = '';
    document.getElementById('reg-email-error').textContent = '';
    document.getElementById('reg-phone-error').textContent = '';
    document.getElementById('reg-password-error').textContent = '';

    if (!fullName) { document.getElementById('reg-name-error').textContent = 'Full Name is required'; return; }
    if (!email) { document.getElementById('reg-email-error').textContent = 'Email is required'; return; }
    if (phone.length !== 10) { document.getElementById('reg-phone-error').textContent = 'Mobile Phone must be 10 digits'; return; }
    if (password.length < 6) { document.getElementById('reg-password-error').textContent = 'Password must be at least 6 chars'; return; }

    try {
      const res = await apiCall('/api/auth/register', 'POST', { fullName, email, phone, password });
      currentUser = res.user;
      showView('loader');
    } catch (err) {
      document.getElementById('reg-email-error').textContent = err.message;
    }
  });

  // Forgot Password Submit
  document.getElementById('form-forgot')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const errEl = document.getElementById('forgot-email-error');
    errEl.textContent = '';
    if (!email) { errEl.textContent = 'Email is required'; return; }

    try {
      await apiCall('/api/auth/forgot-password', 'POST', { email });
      document.getElementById('sent-target-email').textContent = email;
      document.getElementById('forgot-form-section').classList.add('hidden');
      document.getElementById('forgot-success-section').classList.remove('hidden');
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  // SSO Buttons Simulation
  function handleSSO(provider) {
    const name = "Komal Patil";
    const ssoEmail = provider === 'google' ? "komal.patil@gmail.com" : "komal.patil@outlook.com";
    apiCall('/api/auth/sso', 'POST', { provider, name, email: ssoEmail }).then(res => {
      currentUser = res.user;
      showView('loader');
    });
  }
  document.getElementById('btn-sso-google')?.addEventListener('click', () => handleSSO('google'));
  document.getElementById('btn-sso-microsoft')?.addEventListener('click', () => handleSSO('microsoft'));

  // ================= DASHBOARD & DATA FETCHING =================
  async function loadDashboardData() {
    try {
      const profRes = await apiCall('/api/user/profile');
      currentUser = profRes.user;
      updateHeaderProfile();

      const catRes = await apiCall('/api/categories');
      if (catRes.categories) {
        categoriesList = ['All', ...new Set(catRes.categories)];
      }
      renderCategoryPills();

      await fetchDocuments();
      renderFaqs();
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  }

  async function fetchDocuments() {
    const isTrash = activeTab === 'Trash';
    const res = await apiCall(`/api/documents?trash=${isTrash}`);
    documentsList = res.documents || [];
    renderDocuments();
    updateStorageMeter();
  }

  function updateHeaderProfile() {
    if (!currentUser) return;
    document.getElementById('header-user-name').textContent = currentUser.fullName;
    document.getElementById('header-user-plan').textContent = currentUser.planTier;
    document.getElementById('header-avatar-letter').textContent = currentUser.fullName.charAt(0).toUpperCase();

    document.getElementById('modal-user-fullname').textContent = currentUser.fullName;
    document.getElementById('modal-avatar-letter').textContent = currentUser.fullName.charAt(0).toUpperCase();
    document.getElementById('prof-input-name').value = currentUser.fullName;
    document.getElementById('prof-input-email').value = currentUser.email;
    document.getElementById('prof-input-phone').value = currentUser.phone || '';
    document.getElementById('prof-input-device').value = currentUser.device || '';
  }

  function updateStorageMeter() {
    if (!currentUser) return;
    const usedBytes = currentUser.storageUsedBytes || 0;
    const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
    
    let totalGB = 20;
    if (currentUser.planTier.includes('Pro')) totalGB = 1000;
    if (currentUser.planTier.includes('Enterprise')) totalGB = 10000;

    const usedGB = usedBytes / (1024 * 1024 * 1024);
    const percentage = Math.min(100, Math.max(0.5, (usedGB / totalGB) * 100)).toFixed(1);

    document.getElementById('storage-used-mb-text').textContent = `${usedMB} MB used`;
    document.getElementById('storage-total-gb-text').textContent = `of ${totalGB} GB`;
    document.getElementById('storage-percentage-text').textContent = `${percentage}%`;
    document.getElementById('storage-bar-fill').style.width = `${percentage}%`;
  }

  // Sidebar Tab Navigation
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      activeTab = item.getAttribute('data-tab');
      document.getElementById('current-tab-title').textContent = activeTab === 'Dashboard' ? 'All Documents' : activeTab;
      
      const supportSec = document.getElementById('support-section');
      const tableSec = document.querySelector('.documents-table-container');

      if (activeTab === 'Support') {
        supportSec.classList.remove('hidden');
        tableSec.classList.add('hidden');
      } else {
        supportSec.classList.add('hidden');
        tableSec.classList.remove('hidden');
        fetchDocuments();
      }
    });
  });

  // Search Input Handler
  document.getElementById('dashboard-search-input')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderDocuments();
  });

  // Render Category Pills
  function renderCategoryPills() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    let html = categoriesList.map(cat => `
      <button class="category-pill ${selectedCategoryFilter === cat ? 'active' : ''}" data-cat="${cat}">
        ${cat}
      </button>
    `).join('');

    html += `
      <button id="btn-open-add-cat" class="category-pill add-cat-pill">
        <i data-lucide="plus" style="width:13px; height:13px;"></i> Add Category
      </button>
    `;

    container.innerHTML = html;
    refreshIcons();

    container.querySelectorAll('.category-pill[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCategoryFilter = btn.getAttribute('data-cat');
        renderCategoryPills();
        renderDocuments();
      });
    });

    document.getElementById('btn-open-add-cat')?.addEventListener('click', () => {
      document.getElementById('modal-add-category').classList.remove('hidden');
    });
  }

  // Render Documents Table
  function renderDocuments() {
    const tbody = document.getElementById('documents-tbody');
    const emptyState = document.getElementById('empty-state-view');
    const docCountBadge = document.getElementById('doc-count-badge');

    let filtered = documentsList.filter(doc => {
      if (activeTab === 'Favorites' && !doc.isFavorite) return false;
      if (activeTab === 'Shared' && (!doc.sharedWith || doc.sharedWith.length === 0)) return false;
      if (selectedCategoryFilter !== 'All' && doc.category !== selectedCategoryFilter) return false;
      if (searchQuery) {
        return doc.name.toLowerCase().includes(searchQuery) || doc.category.toLowerCase().includes(searchQuery);
      }
      return true;
    });

    docCountBadge.textContent = `${filtered.length} files`;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    const isTrash = activeTab === 'Trash';

    tbody.innerHTML = filtered.map(doc => {
      const starIcon = doc.isFavorite ? 'star' : 'star';
      const starClass = doc.isFavorite ? 'favorite-active' : '';

      return `
        <tr>
          <td>
            <button class="btn-icon-star ${starClass}" data-action="favorite" data-id="${doc.id}">
              <i data-lucide="${starIcon}" style="${doc.isFavorite ? 'fill:#f59e0b; color:#f59e0b;' : ''}"></i>
            </button>
          </td>
          <td>
            <div class="doc-name-cell">
              <div class="doc-file-icon" style="background-color: ${doc.iconColor || '#3b82f6'}; color: white;">
                <i data-lucide="file-text"></i>
              </div>
              <span class="doc-title-text">${doc.name}</span>
            </div>
          </td>
          <td><span class="category-badge">${doc.category}</span></td>
          <td class="text-muted">${doc.date}</td>
          <td class="text-muted">${doc.size}</td>
          <td style="text-align:right;">
            <div class="table-actions-cell">
              ${isTrash ? `
                <button class="action-btn-pill btn-restore" data-action="restore" data-id="${doc.id}">
                  <i data-lucide="rotate-ccw"></i> Restore
                </button>
                <button class="action-btn-pill btn-delete-perm" data-action="perm-delete" data-id="${doc.id}">
                  <i data-lucide="trash-2"></i> Delete
                </button>
              ` : `
                <button class="action-btn-ghost" data-action="preview" data-id="${doc.id}" title="Preview">
                  <i data-lucide="eye"></i>
                </button>
                <button class="action-btn-ghost" data-action="share" data-id="${doc.id}" title="Share">
                  <i data-lucide="share-2"></i>
                </button>
                <button class="action-btn-ghost" data-action="download" data-id="${doc.id}" title="Download">
                  <i data-lucide="download"></i>
                </button>
                <button class="action-btn-ghost text-danger" data-action="trash" data-id="${doc.id}" title="Move to Trash">
                  <i data-lucide="trash-2"></i>
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    refreshIcons();
  }

  // Table Document Action Delegation
  document.getElementById('documents-tbody')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const docId = btn.getAttribute('data-id');
    const targetDoc = documentsList.find(d => d.id === docId);

    if (action === 'favorite') {
      await apiCall(`/api/documents/${docId}/favorite`, 'POST');
      fetchDocuments();
    } else if (action === 'preview' && targetDoc) {
      activePreviewDoc = targetDoc;
      document.getElementById('preview-doc-name').textContent = targetDoc.name;
      document.getElementById('preview-doc-category').textContent = targetDoc.category;
      document.getElementById('preview-doc-size').textContent = targetDoc.size;
      document.getElementById('preview-doc-date').textContent = targetDoc.date;
      document.getElementById('preview-icon-box').style.backgroundColor = targetDoc.iconColor || '#3b82f6';
      document.getElementById('modal-doc-preview').classList.remove('hidden');
      refreshIcons();
    } else if (action === 'share' && targetDoc) {
      activeShareDoc = targetDoc;
      document.getElementById('share-target-doc-name').textContent = targetDoc.name;
      document.getElementById('share-success-alert').classList.add('hidden');
      document.getElementById('modal-share-doc').classList.remove('hidden');
      refreshIcons();
    } else if (action === 'download') {
      window.open(`/api/documents/${docId}/download`, '_blank');
    } else if (action === 'trash') {
      await apiCall(`/api/documents/${docId}/trash`, 'POST');
      fetchDocuments();
    } else if (action === 'restore') {
      await apiCall(`/api/documents/${docId}/restore`, 'POST');
      fetchDocuments();
    } else if (action === 'perm-delete') {
      await apiCall(`/api/documents/${docId}/delete`, 'DELETE');
      fetchDocuments();
    }
  });

  // File Upload Handling
  document.getElementById('file-upload-input')?.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('category', selectedCategoryFilter !== 'All' ? selectedCategoryFilter : 'Others');
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      await apiCall('/api/documents/upload', 'POST', formData);
      await fetchDocuments();
      await loadDashboardData();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
    e.target.value = '';
  });

  // Share Form Submit
  document.getElementById('form-share-doc')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeShareDoc) return;
    const email = document.getElementById('share-recipient-email').value.trim();
    if (!email) return;

    try {
      await apiCall(`/api/documents/${activeShareDoc.id}/share`, 'POST', { email });
      document.getElementById('share-success-alert').classList.remove('hidden');
      setTimeout(() => {
        document.getElementById('modal-share-doc').classList.add('hidden');
      }, 1200);
    } catch (err) {
      alert(err.message);
    }
  });

  // Add Category Submit
  document.getElementById('form-add-category')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-cat-input-name').value.trim();
    if (!name) return;

    try {
      const res = await apiCall('/api/categories', 'POST', { name });
      categoriesList = ['All', ...new Set(res.categories)];
      renderCategoryPills();
      document.getElementById('modal-add-category').classList.add('hidden');
      document.getElementById('new-cat-input-name').value = '';
    } catch (err) {
      alert(err.message);
    }
  });

  // Modal Close Handlers
  document.querySelectorAll('.btn-close-preview').forEach(b => b.addEventListener('click', () => document.getElementById('modal-doc-preview').classList.add('hidden')));
  document.querySelectorAll('.btn-close-share').forEach(b => b.addEventListener('click', () => document.getElementById('modal-share-doc').classList.add('hidden')));
  document.querySelectorAll('.btn-close-add-cat').forEach(b => b.addEventListener('click', () => document.getElementById('modal-add-category').classList.add('hidden')));
  document.querySelectorAll('.btn-close-profile').forEach(b => b.addEventListener('click', () => document.getElementById('modal-user-profile').classList.add('hidden')));
  document.querySelectorAll('.btn-close-upgrade').forEach(b => b.addEventListener('click', () => document.getElementById('modal-upgrade-plan').classList.add('hidden')));

  // Download from Preview Modal
  document.getElementById('btn-preview-download')?.addEventListener('click', () => {
    if (activePreviewDoc) window.open(`/api/documents/${activePreviewDoc.id}/download`, '_blank');
  });

  // Profile Modal & Edit Mode
  document.getElementById('btn-open-user-profile')?.addEventListener('click', () => {
    updateHeaderProfile();
    document.getElementById('modal-user-profile').classList.remove('hidden');
    refreshIcons();
  });

  let isProfileEditing = false;
  document.getElementById('btn-toggle-edit-profile')?.addEventListener('click', () => {
    isProfileEditing = !isProfileEditing;
    const inputs = ['prof-input-name', 'prof-input-email', 'prof-input-phone', 'prof-input-device'];
    inputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) input.disabled = !isProfileEditing;
    });

    document.getElementById('profile-view-buttons').classList.toggle('hidden', isProfileEditing);
    document.getElementById('profile-edit-buttons').classList.toggle('hidden', !isProfileEditing);
    document.getElementById('edit-profile-btn-text').textContent = isProfileEditing ? 'Cancel' : 'Edit Profile';
  });

  document.getElementById('form-user-profile')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('prof-input-name').value.trim();
    const email = document.getElementById('prof-input-email').value.trim();
    const phone = document.getElementById('prof-input-phone').value.trim();
    const device = document.getElementById('prof-input-device').value.trim();

    try {
      const res = await apiCall('/api/user/profile', 'PUT', { fullName, email, phone, device });
      currentUser = res.user;
      updateHeaderProfile();

      document.getElementById('profile-success-msg').classList.remove('hidden');
      setTimeout(() => document.getElementById('profile-success-msg').classList.add('hidden'), 2500);

      document.getElementById('btn-toggle-edit-profile').click();
    } catch (err) {
      alert(err.message);
    }
  });

  // Profile Logout
  document.getElementById('btn-profile-logout')?.addEventListener('click', async () => {
    await apiCall('/api/auth/logout', 'POST');
    document.getElementById('modal-user-profile').classList.add('hidden');
    showView('auth');
  });

  // Upgrade Plan Modal
  document.getElementById('btn-open-upgrade-plan')?.addEventListener('click', () => {
    document.getElementById('upgrade-success-view').classList.add('hidden');
    document.getElementById('upgrade-plans-content').classList.remove('hidden');
    document.getElementById('modal-upgrade-plan').classList.remove('hidden');
    refreshIcons();
  });

  document.querySelectorAll('.plan-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedUpgradePlan = card.getAttribute('data-plan');
    });
  });

  document.getElementById('btn-confirm-upgrade')?.addEventListener('click', async () => {
    try {
      const res = await apiCall('/api/user/upgrade-plan', 'POST', { plan: selectedUpgradePlan });
      currentUser = res.user;
      updateHeaderProfile();
      updateStorageMeter();

      document.getElementById('upgrade-plans-content').classList.add('hidden');
      document.getElementById('upgrade-success-view').classList.remove('hidden');
      setTimeout(() => {
        document.getElementById('modal-upgrade-plan').classList.add('hidden');
      }, 1800);
    } catch (err) {
      alert(err.message);
    }
  });

  // Render Support FAQs
  function renderFaqs() {
    const container = document.getElementById('faq-accordion');
    if (!container) return;

    container.innerHTML = faqs.map((faq, idx) => `
      <div class="faq-item ${idx === 0 ? 'open' : ''}">
        <div class="faq-question" data-faq="${idx}">
          <span>${faq.question}</span>
          <i data-lucide="chevron-down" class="faq-chevron"></i>
        </div>
        <div class="faq-answer ${idx === 0 ? '' : 'hidden'}">
          ${faq.answer}
        </div>
      </div>
    `).join('');

    refreshIcons();

    container.querySelectorAll('.faq-question').forEach(q => {
      q.addEventListener('click', () => {
        const idx = q.getAttribute('data-faq');
        container.querySelectorAll('.faq-item').forEach((item, i) => {
          const ans = item.querySelector('.faq-answer');
          if (parseInt(idx) === i) {
            item.classList.toggle('open');
            ans.classList.toggle('hidden');
          } else {
            item.classList.remove('open');
            ans.classList.add('hidden');
          }
        });
      });
    });
  }

  // Support Ticket Form Submit
  document.getElementById('form-support-ticket')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('support-subject').value.trim();
    const message = document.getElementById('support-message').value.trim();

    try {
      await apiCall('/api/support/ticket', 'POST', { subject, message });
      const msg = document.getElementById('support-success-msg');
      msg.classList.remove('hidden');
      document.getElementById('support-subject').value = '';
      document.getElementById('support-message').value = '';
      setTimeout(() => msg.classList.add('hidden'), 3000);
    } catch (err) {
      alert(err.message);
    }
  });

  // Mobile Menu Toggle
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar-drawer');
    if (sidebar) sidebar.classList.toggle('mobile-open');
  });

  // Initial Auth Check / Show Auth View
  showView('auth');
});
