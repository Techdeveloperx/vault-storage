const API_BASE = "https://vault-gateway.onrender.com";

// ==========================================
// GET SYSTEM STATUS
// ==========================================

export async function getSystemStatus() {
  const response = await fetch(`${API_BASE}/status`);

  if (!response.ok) {
    throw new Error("Gateway unavailable");
  }

  return response.json();
}

// ==========================================
// GET FILES
// ==========================================

export async function getFiles() {
  const response = await fetch(`${API_BASE}/status`);

  if (!response.ok) {
    throw new Error("Unable to fetch files");
  }

  const data = await response.json();

  return data.files || {};
}

// ==========================================
// UPLOAD FILE
// ==========================================

export async function uploadFile(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("file_id", file.name);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Upload failed"
    );
  }

  return data;
}

// ==========================================
// DOWNLOAD FILE
// ==========================================

export async function downloadFile(fileId) {
  const response = await fetch(
    `${API_BASE}/download/${encodeURIComponent(fileId)}`
  );

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      data.error ||
        "Download failed"
    );
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = fileId;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
}