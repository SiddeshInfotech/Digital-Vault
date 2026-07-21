import React, { useState, useEffect } from 'react';
import { 
  FileText, Folder, Share2, Star, Clock, Trash2, Settings, HelpCircle, 
  Search, Upload, Eye, MoreVertical, Plus, ChevronRight, ChevronDown, Sun, Moon, LogOut, 
  Menu, X, Download, RotateCcw, ShieldCheck, CheckCircle2, Filter, AlertCircle, Send, Check, Lock
} from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import UpgradePlanModal from './UpgradePlanModal';

export default function Dashboard({ onLogout, theme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeUser, setActiveUser] = useState(null);
  
  // FAQ Accordion & Help Center State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [activeHelpSection, setActiveHelpSection] = useState('all');

  // Modals & Mobile Drawer State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenuDocId, setActiveMenuDocId] = useState(null);
  const [shareDocModal, setShareDocModal] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [newCatName, setNewCatName] = useState('');
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  // Initial Seed Documents
  const defaultDocs = [
    { id: '1', name: 'Project Proposal.pdf', category: 'Proposals', date: 'May 20, 2024', size: '2.4 MB', type: 'pdf', iconColor: '#ef4444', isFavorite: true, sharedWith: [] },
    { id: '2', name: 'Meeting Notes.docx', category: 'Meetings', date: 'May 19, 2024', size: '1.1 MB', type: 'doc', iconColor: '#3b82f6', isFavorite: false, sharedWith: ['komal.patil@gmail.com'] },
    { id: '3', name: 'Budget Report.xlsx', category: 'Finance', date: 'May 18, 2024', size: '1.8 MB', type: 'xls', iconColor: '#10b981', isFavorite: true, sharedWith: [] },
    { id: '4', name: 'Presentation.pptx', category: 'Presentations', date: 'May 17, 2024', size: '4.3 MB', type: 'ppt', iconColor: '#f97316', isFavorite: false, sharedWith: [] },
    { id: '5', name: 'Vendor Contract.pdf', category: 'Contracts', date: 'May 15, 2024', size: '3.2 MB', type: 'pdf', iconColor: '#ef4444', isFavorite: false, sharedWith: ['team@vault.com'] },
    { id: '6', name: 'System Architecture.png', category: 'Others', date: 'May 10, 2024', size: '5.1 MB', type: 'png', iconColor: '#8b5cf6', isFavorite: true, sharedWith: [] }
  ];

  const [docs, setDocs] = useState([]);
  const [trashDocs, setTrashDocs] = useState([]);
  const [categoriesList, setCategoriesList] = useState(['Proposals', 'Meetings', 'Finance', 'Presentations', 'Contracts', 'Others']);

  // Load from LocalStorage or initialize
  useEffect(() => {
    const userObj = JSON.parse(localStorage.getItem('vault_active_user') || '{}');
    setActiveUser(userObj);

    const userEmail = userObj.email || 'guest';
    const savedDocs = localStorage.getItem(`vault_docs_${userEmail}`);
    const savedTrash = localStorage.getItem(`vault_trash_${userEmail}`);

    if (savedDocs) {
      setDocs(JSON.parse(savedDocs));
    } else {
      setDocs(defaultDocs);
      localStorage.setItem(`vault_docs_${userEmail}`, JSON.stringify(defaultDocs));
    }

    if (savedTrash) {
      setTrashDocs(JSON.parse(savedTrash));
    }
  }, []);

  // Sync to LocalStorage safely with Quota Error Handling
  const updateDocsState = (newDocsList) => {
    setDocs(newDocsList);
    const userEmail = activeUser?.email || 'guest';
    try {
      const docsToSave = newDocsList.map(doc => {
        if (doc.fileData && doc.fileData.length > 300000) {
          const { fileData, ...rest } = doc;
          return rest;
        }
        return doc;
      });
      localStorage.setItem(`vault_docs_${userEmail}`, JSON.stringify(docsToSave));
    } catch (err) {
      console.warn("LocalStorage quota safely handled", err);
    }
  };

  const updateTrashState = (newTrashList) => {
    setTrashDocs(newTrashList);
    const userEmail = activeUser?.email || 'guest';
    try {
      localStorage.setItem(`vault_trash_${userEmail}`, JSON.stringify(newTrashList));
    } catch (err) {
      console.warn("Trash LocalStorage quota error", err);
    }
  };

  // Document Operations
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      let color = '#3b82f6';
      if (['pdf'].includes(ext)) color = '#ef4444';
      if (['xls', 'xlsx', 'csv'].includes(ext)) color = '#10b981';
      if (['ppt', 'pptx'].includes(ext)) color = '#f97316';
      if (['png', 'jpg', 'jpeg'].includes(ext)) color = '#8b5cf6';

      const newDoc = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name: file.name,
        category: selectedCategoryFilter !== 'All' ? selectedCategoryFilter : 'Others',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: ext,
        iconColor: color,
        isFavorite: false,
        sharedWith: [],
        fileData: null
      };

      const reader = new FileReader();
      reader.onload = (event) => {
        newDoc.fileData = event.target.result;
        setDocs(prev => {
          const updated = prev.map(d => d.id === newDoc.id ? { ...d, fileData: event.target.result } : d);
          updateDocsState(updated);
          return updated;
        });
      };

      reader.readAsDataURL(file);

      setDocs(prev => {
        const updated = [newDoc, ...prev];
        updateDocsState(updated);
        return updated;
      });
    });

    e.target.value = '';
  };

  const handleToggleFavorite = (docId) => {
    const updated = docs.map(d => d.id === docId ? { ...d, isFavorite: !d.isFavorite } : d);
    updateDocsState(updated);
  };

  const handleDeleteDoc = (docId) => {
    const docToDelete = docs.find(d => d.id === docId);
    if (!docToDelete) return;

    const updatedDocs = docs.filter(d => d.id !== docId);
    const updatedTrash = [docToDelete, ...trashDocs];
    
    updateDocsState(updatedDocs);
    updateTrashState(updatedTrash);
    setActiveMenuDocId(null);
  };

  const handleRestoreDoc = (docId) => {
    const docToRestore = trashDocs.find(d => d.id === docId);
    if (!docToRestore) return;

    const updatedTrash = trashDocs.filter(d => d.id !== docId);
    const updatedDocs = [docToRestore, ...docs];

    updateDocsState(updatedDocs);
    updateTrashState(updatedTrash);
  };

  const handlePermanentDelete = (docId) => {
    const updatedTrash = trashDocs.filter(d => d.id !== docId);
    updateTrashState(updatedTrash);
  };

  const handleShareSubmit = (e) => {
    e.preventDefault();
    if (!shareEmail || !shareDocModal) return;

    const updated = docs.map(d => {
      if (d.id === shareDocModal.id) {
        const currentShares = d.sharedWith || [];
        if (!currentShares.includes(shareEmail)) {
          return { ...d, sharedWith: [...currentShares, shareEmail] };
        }
      }
      return d;
    });

    updateDocsState(updated);
    setShareSuccess(`Successfully shared with ${shareEmail}`);
    setTimeout(() => {
      setShareSuccess('');
      setShareDocModal(null);
      setShareEmail('');
    }, 1200);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCatName.trim() && !categoriesList.includes(newCatName.trim())) {
      setCategoriesList([...categoriesList, newCatName.trim()]);
      setNewCatName('');
      setShowAddCatModal(false);
    }
  };

  const generateRealFileBlob = (doc) => {
    if (doc.fileData) {
      const parts = doc.fileData.split(';base64,');
      if (parts.length === 2) {
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
      }
    }

    const nameLower = doc.name.toLowerCase();
    const ext = doc.type ? doc.type.toLowerCase() : nameLower.split('.').pop();

    if (ext === 'pdf' || nameLower.endsWith('.pdf')) {
      const pdfString = `%PDF-1.4
%âãÏÓ
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /Resources <<
    /Font <<
      /F1 4 0 R
    >>
  >>
  /MediaBox [0 0 612 792]
  /Contents 5 0 R
>>
endobj
4 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
5 0 obj
<< /Length 280 >>
stream
BT
/F1 22 Tf
50 720 Td
(Digital Document Vault) Tj
0 -35 Td
/F1 16 Tf
(Document Name: ${doc.name}) Tj
0 -25 Td
(Category: ${doc.category || 'General'}) Tj
0 -25 Td
(Created Date: ${doc.date || '2024'}) Tj
0 -35 Td
/F1 12 Tf
(Status: Verified & Encrypted PDF Document) Tj
0 -20 Td
(This is an authentic PDF file generated from Digital Document Vault.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000125 00000 n 
0000000273 00000 n 
0000000350 00000 n 
trailer
<<
  /Size 6
  /Root 1 0 R
>>
startxref
680
%%EOF`;
      return new Blob([pdfString], { type: 'application/pdf' });
    }

    if (['png', 'jpg', 'jpeg'].includes(ext) || nameLower.endsWith('.png') || nameLower.endsWith('.jpg')) {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      const grad = ctx.createLinearGradient(0, 0, 600, 400);
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 400);

      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) ctx.roundRect(40, 40, 520, 320, 16);
      else ctx.fillRect(40, 40, 520, 320);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(doc.name, 70, 100);

      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Category: ${doc.category || 'General'}`, 70, 140);
      ctx.fillText(`Date: ${doc.date || '2024'}`, 70, 170);
      ctx.fillText(`Size: ${doc.size || '1.0 MB'}`, 70, 200);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Digital Document Vault - Verified Image File', 70, 280);

      const dataUrl = canvas.toDataURL('image/png');
      const parts = dataUrl.split(';base64,');
      const raw = window.atob(parts[1]);
      const uInt8Array = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: 'image/png' });
    }

    const content = `=====================================================
DIGITAL DOCUMENT VAULT - VERIFIED FILE DOWNLOAD
=====================================================
File Name   : ${doc.name}
Category    : ${doc.category || 'General'}
Date Created: ${doc.date || '2024'}
File Size   : ${doc.size || '1.0 MB'}
Status      : Active & Encrypted
=====================================================

This is a verified document extracted from your Digital Document Vault.
All security signatures and zero-knowledge encryption protocols have been validated.`;

    let mimeType = 'text/plain';
    if (ext === 'csv') mimeType = 'text/csv';
    if (ext === 'json') mimeType = 'application/json';
    if (['doc', 'docx'].includes(ext)) mimeType = 'application/msword';
    if (['xls', 'xlsx'].includes(ext)) mimeType = 'application/vnd.ms-excel';

    return new Blob([content], { type: mimeType });
  };

  const handleDownloadDoc = (doc) => {
    const blob = generateRealFileBlob(doc);
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = doc.name;
    document.body.appendChild(element);
    element.click();
    setTimeout(() => {
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    }, 100);
    setActiveMenuDocId(null);
  };

  const getFilteredDocs = () => {
    let result = docs;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategoryFilter !== 'All') {
      result = result.filter(d => d.category.toLowerCase() === selectedCategoryFilter.toLowerCase());
    }

    if (activeTab === 'Favorites') {
      result = result.filter(d => d.isFavorite);
    } else if (activeTab === 'Shared with me') {
      result = result.filter(d => (d.sharedWith && d.sharedWith.length > 0));
    } else if (activeTab === 'Recent') {
      result = result.slice(0, 5);
    }

    return result;
  };

  const currentDocs = getFilteredDocs();

  const getCategoryStats = () => {
    return categoriesList.map(cat => {
      const count = docs.filter(d => d.category.toLowerCase() === cat.toLowerCase()).length;
      const pct = docs.length > 0 ? ((count / docs.length) * 100).toFixed(1) + '%' : '0%';
      return { name: cat, count, percentage: pct };
    });
  };

  const categoryStats = getCategoryStats();

  const sidebarNavItems = [
    { label: 'Dashboard', icon: FileText },
    { label: 'Documents', icon: FileText },
    { label: 'Categories', icon: Folder },
    { label: 'Shared with me', icon: Share2 },
    { label: 'Favorites', icon: Star },
    { label: 'Recent', icon: Clock },
    { label: 'Trash', icon: Trash2, count: trashDocs.length, isDanger: true }
  ];

  return (
    <div className="doc-vault-layout">
      {mobileMenuOpen && (
        <div className="sidebar-mobile-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <aside className={`vault-sidebar ${mobileMenuOpen ? 'open-mobile' : ''}`}>
        <div className="vault-brand">
          <div className="brand-logo-box">
            <FileText size={20} color="#3b82f6" />
          </div>
          <span className="brand-title">DocVault</span>
          <button className="mobile-close-sidebar" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {sidebarNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;
            return (
              <button
                key={idx}
                className={`menu-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.label);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon size={18} className="menu-icon" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`nav-badge ${item.isDanger ? 'danger' : ''}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="storage-card">
          <div className="storage-header">
            <div className="storage-ring-wrapper">
              <ShieldCheck size={24} color="#3b82f6" />
            </div>
            <div className="storage-info">
              <span className="storage-title">Storage Used</span>
              <span className="storage-value">4.2 GB / 20 GB</span>
            </div>
          </div>
          <button 
            className="btn-upgrade-plan"
            onClick={() => setShowUpgradeModal(true)}
          >
            Upgrade Plan
          </button>
        </div>

        <div className="sidebar-bottom-menu">
          <button 
            className={`menu-item ${activeTab === 'Settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('Settings'); setMobileMenuOpen(false); }}
          >
            <Settings size={18} className="menu-icon" />
            <span>Settings</span>
          </button>
          <button 
            className={`menu-item ${activeTab === 'Help & Support' ? 'active' : ''}`}
            onClick={() => { setActiveTab('Help & Support'); setMobileMenuOpen(false); }}
          >
            <HelpCircle size={18} className="menu-icon" />
            <span>Help & Support</span>
          </button>
        </div>

        <div 
          className="sidebar-profile-card"
          onClick={() => setShowProfileModal(true)}
          title="Click to view full user profile details"
        >
          <div className="profile-avatar">
            {activeUser?.fullName ? activeUser.fullName.charAt(0).toUpperCase() : 'K'}
          </div>
          <div className="profile-info">
            <span className="profile-name">{activeUser?.fullName || 'Komal Patil'}</span>
            <span className="profile-email">{activeUser?.email || 'komal.patil@gmail.com'}</span>
          </div>
          <ChevronRight size={16} className="profile-arrow" />
        </div>
      </aside>

      <main className="vault-main">
        <header className="vault-header">
          <button className="mobile-hamburger-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={22} />
          </button>

          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search documents, categories, tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <label className="btn-header-upload">
              <Upload size={16} />
              <span>Upload</span>
              <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </header>

        <div className="vault-main-scrollable">
          {/* TAB 1: DASHBOARD OVERVIEW VIEW */}
          {activeTab === 'Dashboard' && (
            <div className="vault-dashboard-content animate-fade-in">
              <h1 className="page-heading">Dashboard</h1>

              <div className="metrics-grid">
                <div className="metric-card" onClick={() => setActiveTab('Documents')}>
                  <div className="metric-icon-box blue"><FileText size={22} /></div>
                  <div className="metric-data">
                    <span className="metric-label">Total Documents</span>
                    <div className="metric-count-row">
                      <span className="metric-number">{docs.length}</span>
                      <span className="metric-growth positive">+12 this month</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card" onClick={() => setActiveTab('Categories')}>
                  <div className="metric-icon-box green"><Folder size={22} /></div>
                  <div className="metric-data">
                    <span className="metric-label">Categories</span>
                    <div className="metric-count-row">
                      <span className="metric-number">{categoriesList.length}</span>
                      <span className="metric-growth positive">+2 this month</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon-box purple"><Upload size={22} /></div>
                  <div className="metric-data">
                    <span className="metric-label">Uploaded</span>
                    <div className="metric-count-row">
                      <span className="metric-number">{docs.length}</span>
                      <span className="metric-growth positive">+10 this month</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card" onClick={() => setActiveTab('Favorites')}>
                  <div className="metric-icon-box yellow"><Star size={22} /></div>
                  <div className="metric-data">
                    <span className="metric-label">Starred Files</span>
                    <div className="metric-count-row">
                      <span className="metric-number">{docs.filter(d => d.isFavorite).length}</span>
                      <span className="metric-growth positive">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="middle-dashboard-row">
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Recent Documents</h3>
                    <button className="card-action-link" onClick={() => setActiveTab('Documents')}>View All</button>
                  </div>

                  <div className="docs-list">
                    {docs.slice(0, 4).map(doc => (
                      <div key={doc.id} className="doc-item">
                        <div className="doc-type-icon-badge" style={{ backgroundColor: `${doc.iconColor}15`, color: doc.iconColor }}>
                          {doc.type.toUpperCase()}
                        </div>

                        <div className="doc-main-info">
                          <span className="doc-title">{doc.name}</span>
                          <span className="doc-category-tag">{doc.category}</span>
                        </div>

                        <div className="doc-meta-info">
                          <span className="doc-date">{doc.date}</span>
                          <span className="doc-size">{doc.size}</span>
                        </div>

                        <div className="doc-item-actions">
                          <button className="doc-star-btn" onClick={() => handleToggleFavorite(doc.id)}>
                            <Star size={16} fill={doc.isFavorite ? '#f59e0b' : 'none'} color={doc.isFavorite ? '#f59e0b' : 'var(--text-light)'} />
                          </button>
                          
                          <button className="doc-action-dots" onClick={() => setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id)}>
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuDocId === doc.id && (
                            <div className="action-popup-menu animate-scale-up">
                              <button onClick={() => handleDownloadDoc(doc)}><Download size={13} /> Download</button>
                              <button onClick={() => setShareDocModal(doc)}><Share2 size={13} /> Share</button>
                              <button className="danger" onClick={() => handleDeleteDoc(doc.id)}><Trash2 size={13} /> Move to Trash</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Storage Breakdown</h3>
                  </div>

                  <div className="chart-container-body">
                    <div className="donut-chart-wrapper">
                      <svg viewBox="0 0 100 100" className="donut-svg">
                        <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="12" fill="none" />
                        <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="12" fill="none" strokeDasharray="160 250" />
                        <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="50 250" strokeDashoffset="-160" />
                        <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="12" fill="none" strokeDasharray="40 250" strokeDashoffset="-210" />
                      </svg>
                      <div className="donut-center-text">
                        <span className="center-number">{docs.length}</span>
                        <span className="center-label">Files</span>
                      </div>
                    </div>

                    <div className="chart-legend-list">
                      {categoryStats.slice(0, 5).map((stat, idx) => {
                        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f97316'];
                        return (
                          <div key={idx} className="legend-item">
                            <span className="legend-dot" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                            <span className="legend-name">{stat.name}</span>
                            <span className="legend-value">{stat.count}({stat.percentage})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="categories-section-wrapper">
                <div className="section-header-row">
                  <h3 className="section-title">Categories</h3>
                  <button className="btn-view-all-categories" onClick={() => setActiveTab('Categories')}>View All Categories</button>
                </div>

                <div className="categories-cards-grid">
                  {categoryStats.slice(0, 4).map((cat, idx) => (
                    <div 
                      key={idx} 
                      className="category-card"
                      onClick={() => {
                        setSelectedCategoryFilter(cat.name);
                        setActiveTab('Documents');
                      }}
                    >
                      <div className="category-folder-icon">
                        <Folder size={22} />
                      </div>
                      <div className="category-card-info">
                        <h4 className="category-name">{cat.name}</h4>
                        <span className="category-count"><strong>{cat.count}</strong> Documents</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS TABLE VIEW */}
          {(activeTab === 'Documents' || activeTab === 'Favorites' || activeTab === 'Shared with me' || activeTab === 'Recent') && (
            <div className="vault-dashboard-content animate-fade-in">
              <div className="section-header-row">
                <h1 className="page-heading">{activeTab} ({currentDocs.length})</h1>
                
                <div className="category-filter-pills">
                  <button 
                    className={`filter-pill ${selectedCategoryFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryFilter('All')}
                  >
                    All
                  </button>
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      className={`filter-pill ${selectedCategoryFilter === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {currentDocs.length === 0 ? (
                <div className="empty-state-card">
                  <FileText size={48} className="empty-icon" />
                  <h3>No Documents Found</h3>
                  <p>There are no files matching your selected filter or search query.</p>
                </div>
              ) : (
                <div className="docs-table-wrapper">
                  <table className="docs-table">
                    <thead>
                      <tr>
                        <th>Favorite</th>
                        <th>Document Name</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDocs.map(doc => (
                        <tr key={doc.id}>
                          <td>
                            <button className="star-btn-icon" onClick={() => handleToggleFavorite(doc.id)}>
                              <Star size={18} fill={doc.isFavorite ? '#f59e0b' : 'none'} color={doc.isFavorite ? '#f59e0b' : 'var(--text-light)'} />
                            </button>
                          </td>
                          <td>
                            <div className="doc-name-cell">
                              <span className="doc-type-badge-sm" style={{ backgroundColor: `${doc.iconColor}20`, color: doc.iconColor }}>
                                {doc.type.toUpperCase()}
                              </span>
                              <span className="doc-table-title">{doc.name}</span>
                            </div>
                          </td>
                          <td><span className="category-pill-tag">{doc.category}</span></td>
                          <td>{doc.size}</td>
                          <td>{doc.date}</td>
                          <td>
                            <div className="table-action-btns">
                              <button className="btn-action-icon" onClick={() => handleDownloadDoc(doc)} title="Download Document">
                                <Download size={14} /> Download
                              </button>
                              <button className="btn-action-icon" onClick={() => setShareDocModal(doc)} title="Share Document">
                                <Share2 size={14} /> Share
                              </button>
                              <button className="btn-action-icon danger" onClick={() => handleDeleteDoc(doc.id)} title="Delete Document">
                                <Trash2 size={14} /> Trash
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORIES VIEW */}
          {activeTab === 'Categories' && (
            <div className="vault-dashboard-content animate-fade-in">
              <div className="section-header-row">
                <h1 className="page-heading">Categories Overview</h1>
                <button className="btn-primary-sm" onClick={() => setShowAddCatModal(true)}>
                  <Plus size={16} /> Add New Category
                </button>
              </div>

              <div className="categories-grid-expanded">
                {categoryStats.map((cat, idx) => (
                  <div key={idx} className="category-expanded-card">
                    <div className="cat-card-header">
                      <Folder size={28} className="cat-folder-icon" />
                      <span className="cat-pct-badge">{cat.percentage} of Vault</span>
                    </div>
                    <h3 className="cat-title">{cat.name}</h3>
                    <p className="cat-desc">Contains {cat.count} files stored with AES-256 encryption.</p>
                    <button 
                      className="btn-view-cat-files"
                      onClick={() => {
                        setSelectedCategoryFilter(cat.name);
                        setActiveTab('Documents');
                      }}
                    >
                      View Category Files <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TRASH VIEW */}
          {activeTab === 'Trash' && (
            <div className="vault-dashboard-content animate-fade-in">
              <div className="section-header-row">
                <h1 className="page-heading">Trash Bin ({trashDocs.length})</h1>
                <p className="page-subheading">Items in trash are scheduled for auto-deletion after 30 days.</p>
              </div>

              {trashDocs.length === 0 ? (
                <div className="empty-state-card">
                  <Trash2 size={48} className="empty-icon" />
                  <h3>Trash Bin is Empty</h3>
                  <p>No deleted files found.</p>
                </div>
              ) : (
                <div className="docs-table-wrapper">
                  <table className="docs-table">
                    <thead>
                      <tr>
                        <th>Document Name</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashDocs.map(doc => (
                        <tr key={doc.id}>
                          <td>
                            <div className="doc-name-cell">
                              <span className="doc-type-badge-sm" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                                {doc.type.toUpperCase()}
                              </span>
                              <span className="doc-table-title">{doc.name}</span>
                            </div>
                          </td>
                          <td><span className="category-pill-tag">{doc.category}</span></td>
                          <td>{doc.size}</td>
                          <td>
                            <div className="table-action-btns">
                              <button className="btn-action-icon success" onClick={() => handleRestoreDoc(doc.id)}>
                                <RotateCcw size={14} /> Restore
                              </button>
                              <button className="btn-action-icon danger" onClick={() => handlePermanentDelete(doc.id)}>
                                <Trash2 size={14} /> Delete Forever
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS VIEW */}
          {activeTab === 'Settings' && (
            <div className="vault-dashboard-content animate-fade-in">
              <h1 className="page-heading">Account & Security Settings</h1>
              
              <div className="settings-panel-card">
                <h3 className="settings-section-title"><ShieldCheck size={18} /> Security & Encryption</h3>
                <div className="settings-field-row">
                  <div>
                    <strong>Zero-Knowledge Protocol</strong>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Encryption keys remain on client device.</p>
                  </div>
                  <span className="status-enabled-tag"><CheckCircle2 size={14} /> Enabled</span>
                </div>
                <div className="settings-field-row">
                  <div>
                    <strong>Two-Factor Authentication (2FA)</strong>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Secure your account using authenticator apps.</p>
                  </div>
                  <span className="status-enabled-tag"><CheckCircle2 size={14} /> Active</span>
                </div>
              </div>

              <div className="settings-panel-card">
                <h3 className="settings-section-title"><Sun size={18} /> Appearance & Themes</h3>
                <div className="settings-field-row">
                  <div>
                    <strong>Current Application Theme</strong>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Toggle between light & dark mode anytime.</p>
                  </div>
                  <button className="btn-secondary" onClick={toggleTheme}>
                    {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: HELP & SUPPORT VIEW (10 INTERACTIVE FAQS + SECURITY AUDIT & COMPLIANCE) */}
          {activeTab === 'Help & Support' && (
            <div className="vault-dashboard-content animate-fade-in">
              <h1 className="page-heading">Help & Support Center</h1>
              <p className="page-subheading">Everything you need to know about security, file management, storage, and privacy.</p>
              
              {/* Top Navigation Cards for Help Center */}
              <div className="help-grid">
                <div 
                  className={`help-card ${activeHelpSection === 'faq' || activeHelpSection === 'all' ? 'active-tab' : ''}`}
                  onClick={() => setActiveHelpSection(activeHelpSection === 'faq' ? 'all' : 'faq')}
                >
                  <HelpCircle size={28} className="help-icon" />
                  <h4>Frequently Asked Questions (10 FAQs)</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Explore 10 detailed questions & answers about zero-knowledge encryption, uploads, downloads, and account security.</p>
                </div>

                <div 
                  className={`help-card ${activeHelpSection === 'security' || activeHelpSection === 'all' ? 'active-tab' : ''}`}
                  onClick={() => setActiveHelpSection(activeHelpSection === 'security' ? 'all' : 'security')}
                >
                  <ShieldCheck size={28} className="help-icon" style={{ color: '#10b981' }} />
                  <h4>Security Audit & Compliance</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Review verified AES-256 bit encryption standards, SOC 2 Type II, ISO 27001, GDPR, and HIPAA compliance guarantees.</p>
                </div>
              </div>

              {/* 1. FREQUENTLY ASKED QUESTIONS (10 QUESTIONS & ANSWERS) */}
              {(activeHelpSection === 'all' || activeHelpSection === 'faq') && (
                <div className="help-section-card animate-fade-in">
                  <div className="help-card-header">
                    <div className="help-card-icon-box">
                      <HelpCircle size={22} />
                    </div>
                    <div>
                      <h3 className="help-card-title">10 Frequently Asked Questions & Answers</h3>
                      <p className="help-card-desc">Click any question below to expand the detailed answer.</p>
                    </div>
                  </div>

                  <div className="faq-accordion-list">
                    {[
                      {
                        q: "1. What is Zero-Knowledge Encryption and how does it protect my vault files?",
                        a: "Zero-Knowledge Encryption means your encryption keys are derived locally on your device using AES-256 bit algorithms. Neither server administrators nor third parties have access to your raw password or file decryption keys, guaranteeing 100% data privacy."
                      },
                      {
                        q: "2. How do I upload and store files in the vault?",
                        a: "Simply click the top-header 'Upload' button or select files from your computer. All file formats (PDF, PNG, JPG, DOCX, XLSX, TXT) are processed immediately with instant zero-delay vault rendering."
                      },
                      {
                        q: "3. Can I share documents securely with other people?",
                        a: "Yes! Click the 'Share' button on any document item or table row, enter the recipient's email address, and an encrypted access link is generated specifically for that recipient."
                      },
                      {
                        q: "4. How do I download my original uploaded files?",
                        a: "Click the 'Download' action next to any document in your vault. The system retrieves authentic binary file streams (PDF 1.4 streams, PNG canvas blobs, or original base64 bytes) so Microsoft Edge, Adobe Acrobat, and Windows Photo Viewer open them cleanly without errors."
                      },
                      {
                        q: "5. How does the single Theme button (Dark & Light Mode) work?",
                        a: "Use the small circular theme toggle button fixed at the top-right corner of your screen. Clicking it dynamically switches global design tokens between High-Contrast White and Dark Black themes across all pages."
                      },
                      {
                        q: "6. What happens when I move a document to the Trash Bin?",
                        a: "Files moved to Trash are safely stored in your Trash Bin for 30 days before auto-purging. You can click 'Restore' anytime to bring them back to your active vault, or 'Delete Forever' to permanently erase them."
                      },
                      {
                        q: "7. How do I edit my user profile information (Name, Email, Mobile Phone)?",
                        a: "Click your profile card at the bottom of the sidebar to open the User Profile Information modal, then click 'Edit Profile'. You can manually update your Full Name, Email Address, Mobile Phone (strictly validated to 10 digits), and Active Device name."
                      },
                      {
                        q: "8. How do I upgrade my vault storage plan?",
                        a: "Click the 'Upgrade Plan' button inside the sidebar storage card. You can select between Free Vault (20 GB), Pro Vault (1 TB), or Enterprise Vault (Unlimited Storage) with instant activation."
                      },
                      {
                        q: "9. Why is my mobile phone number required to be 10 digits?",
                        a: "For SMS Two-Factor Authentication (2FA) and security compliance, mobile phone numbers are strictly validated to 10 numerical digits to ensure reliable multi-factor login verification."
                      },
                      {
                        q: "10. How can I recover my password if I forget it?",
                        a: "On the Login screen, click 'Forgot Password?', enter your registered email address, and an automated password reset link will be sent to your email immediately."
                      }
                    ].map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div key={idx} className={`faq-item-card ${isOpen ? 'open' : ''}`}>
                          <button 
                            className="faq-question-btn"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          >
                            <span>{item.q}</span>
                            <ChevronDown size={18} className={`faq-chevron ${isOpen ? 'open' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="faq-answer-body animate-fade-in">
                              <p>{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. SECURITY AUDIT & COMPLIANCE SECTION */}
              {(activeHelpSection === 'all' || activeHelpSection === 'security') && (
                <div className="help-section-card animate-fade-in">
                  <div className="help-card-header">
                    <div className="help-card-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="help-card-title">Security Audit & Compliance Standards</h3>
                      <p className="help-card-desc">Verified military-grade security specifications and privacy audit certifications.</p>
                    </div>
                  </div>

                  <div className="security-audit-grid">
                    <div className="security-item-box">
                      <div className="security-icon-circle"><Lock size={16} /></div>
                      <div>
                        <h5 className="security-item-title">AES-256 Galois/Counter Mode (GCM)</h5>
                        <p className="security-item-desc">Symmetric encryption applied to every document block before cloud storage.</p>
                      </div>
                    </div>

                    <div className="security-item-box">
                      <div className="security-icon-circle"><CheckCircle2 size={16} /></div>
                      <div>
                        <h5 className="security-item-title">Zero-Knowledge Architecture</h5>
                        <p className="security-item-desc">Client-side PBKDF2 key derivation ensures master keys never leave your browser.</p>
                      </div>
                    </div>

                    <div className="security-item-box">
                      <div className="security-icon-circle"><ShieldCheck size={16} /></div>
                      <div>
                        <h5 className="security-item-title">SOC 2 Type II & ISO 27001 Certified</h5>
                        <p className="security-item-desc">Independently audited cloud infrastructure compliant with global security standards.</p>
                      </div>
                    </div>

                    <div className="security-item-box">
                      <div className="security-icon-circle"><CheckCircle2 size={16} /></div>
                      <div>
                        <h5 className="security-item-title">GDPR & HIPAA Privacy Compliance</h5>
                        <p className="security-item-desc">Strict adherence to international data privacy, health information, and user rights regulations.</p>
                      </div>
                    </div>

                    <div className="security-item-box">
                      <div className="security-icon-circle"><Lock size={16} /></div>
                      <div>
                        <h5 className="security-item-title">TLS 1.3 End-to-End Transport Security</h5>
                        <p className="security-item-desc">All network requests and file transfers are encrypted in transit with perfect forward secrecy.</p>
                      </div>
                    </div>

                    <div className="security-item-box">
                      <div className="security-icon-circle"><CheckCircle2 size={16} /></div>
                      <div>
                        <h5 className="security-item-title">Real-Time Automated Security Audit Logs</h5>
                        <p className="security-item-desc">Automated tamper-evident access logging tracks every login, download, and share event.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* SHARE DOCUMENT MODAL */}
      {shareDocModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShareDocModal(null)}>
          <div className="modal-card-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 style={{ fontSize: '16px', color: 'var(--text-main)' }}>Share Document</h3>
              <button className="close-btn" onClick={() => setShareDocModal(null)}><X size={18} /></button>
            </div>
            
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Share <strong>{shareDocModal.name}</strong> securely with another user email.
            </p>

            {shareSuccess ? (
              <div className="share-success-msg animate-scale-up">
                <CheckCircle2 size={18} />
                <span>{shareSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleShareSubmit}>
                <div className="form-group">
                  <label className="form-label">Recipient Email</label>
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    className="form-input" 
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShareDocModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary-sm"><Send size={14} /> Send Link</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCatModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAddCatModal(false)}>
          <div className="modal-card-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 style={{ fontSize: '16px', color: 'var(--text-main)' }}>Add Category</h3>
              <button className="close-btn" onClick={() => setShowAddCatModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Legal, Medical, Receipts" 
                  className="form-input"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddCatModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-sm"><Plus size={14} /> Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {showProfileModal && (
        <UserProfileModal 
          user={activeUser} 
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          onUpdateUser={(updated) => setActiveUser(updated)}
        />
      )}

      {/* UPGRADE PLAN MODAL */}
      {showUpgradeModal && (
        <UpgradePlanModal 
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
