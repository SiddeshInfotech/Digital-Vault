/**
 * Digital Document Vault API Client
 * Connects React frontend to Python FastAPI backend (http://localhost:8000)
 */

const API_BASE_URL = 'http://localhost:8000/api';

async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'API request failed');
    }
    return data;
  } catch (err) {
    console.warn(`[Vault API] ${options.method || 'GET'} ${url} failed:`, err.message);
    throw err;
  }
}

export const authAPI = {
  async register({ fullName, email, phone, password }) {
    return fetchJSON(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ fullName, email, phone, password })
    });
  },

  async login({ email, password }) {
    return fetchJSON(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async ssoLogin({ provider, name, email }) {
    return fetchJSON(`${API_BASE_URL}/auth/sso`, {
      method: 'POST',
      body: JSON.stringify({ provider, name, email })
    });
  },

  async forgotPassword(email) {
    return fetchJSON(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(email, newPassword) {
    return fetchJSON(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ email, newPassword })
    });
  }
};

export const userAPI = {
  async getProfile(email) {
    return fetchJSON(`${API_BASE_URL}/user/profile?email=${encodeURIComponent(email)}`);
  },

  async updateProfile(currentEmail, { fullName, email, phone }) {
    return fetchJSON(`${API_BASE_URL}/user/profile?current_email=${encodeURIComponent(currentEmail)}`, {
      method: 'PUT',
      body: JSON.stringify({ fullName, email, phone })
    });
  },

  async changePassword(email, currentPassword, newPassword) {
    return fetchJSON(`${API_BASE_URL}/user/change-password?email=${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
};

export const docsAPI = {
  async getDocuments(email) {
    return fetchJSON(`${API_BASE_URL}/documents?email=${encodeURIComponent(email)}`);
  },

  async uploadDocument(email, file, category = 'Others') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);
    formData.append('category', category);

    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Upload failed');
    return data;
  },

  async toggleFavorite(docId) {
    return fetchJSON(`${API_BASE_URL}/documents/${docId}/favorite`, {
      method: 'PUT'
    });
  },

  async shareDocument(docId, targetEmail) {
    return fetchJSON(`${API_BASE_URL}/documents/${docId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail })
    });
  },

  async moveToTrash(docId) {
    return fetchJSON(`${API_BASE_URL}/documents/${docId}`, {
      method: 'DELETE'
    });
  },

  getDownloadUrl(docId) {
    return `${API_BASE_URL}/documents/${docId}/download`;
  }
};

export const trashAPI = {
  async getTrash(email) {
    return fetchJSON(`${API_BASE_URL}/trash?email=${encodeURIComponent(email)}`);
  },

  async restoreDoc(docId) {
    return fetchJSON(`${API_BASE_URL}/trash/${docId}/restore`, {
      method: 'POST'
    });
  },

  async permanentDelete(docId) {
    return fetchJSON(`${API_BASE_URL}/trash/${docId}/permanent`, {
      method: 'DELETE'
    });
  }
};

export const categoryAPI = {
  async getCategories(email) {
    return fetchJSON(`${API_BASE_URL}/categories?email=${encodeURIComponent(email)}`);
  },

  async addCategory(email, name) {
    return fetchJSON(`${API_BASE_URL}/categories?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }
};
