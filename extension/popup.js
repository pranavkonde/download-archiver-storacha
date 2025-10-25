// popup.js
document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("clearHistory").addEventListener("click", async () => {
  await chrome.storage.local.set({ uploadHistory: [] });
  loadUploadHistory();
});

function formatFileSize(sizeMB) {
  if (sizeMB < 1) {
    return `${(sizeMB * 1024).toFixed(1)} KB`;
  }
  return `${sizeMB.toFixed(1)} MB`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

async function loadUploadHistory() {
  const { uploadHistory = [] } = await chrome.storage.local.get([
    "uploadHistory",
  ]);
  const historyDiv = document.getElementById("uploadHistory");

  if (uploadHistory.length === 0) {
    historyDiv.innerHTML = '<div class="no-history">No uploads yet</div>';
    return;
  }

  historyDiv.innerHTML = uploadHistory
    .slice(0, 10)
    .map(
      (upload) => `
    <div class="upload-item">
      <div class="upload-filename">${upload.filename}</div>
      <div class="upload-cid">CID: ${upload.cid}</div>
      <div class="upload-meta">
        ${formatFileSize(upload.size)} • ${formatTimestamp(
        upload.timestamp
      )} • ${upload.source}
      </div>
    </div>
  `
    )
    .join("");
}

function renderSessionExpiredUI(email, spaceDid) {
  const status = document.getElementById("status");
  status.innerHTML = `
    <div class="status-label">Session</div>
    <div class="status-value" style="color:#b45309">Expired — please re-authenticate</div>
    <button id="reauthBtn" class="button" style="margin-top:8px">Re-authenticate</button>
  `;
  const btn = document.getElementById("reauthBtn");
  btn?.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Re-authenticating…";
    try {
      const resp = await chrome.runtime.sendMessage({
        type: "REAUTH",
        email,
        spaceDid: spaceDid || null,
      });
      if (resp?.ok) {
        status.innerHTML = `
          <div class="status-label">Session</div>
          <div class="status-value" style="color:#16a34a">Active</div>
        `;
      } else {
        status.innerHTML = `
          <div class="status-label">Session</div>
          <div class="status-value" style="color:#dc2626">Re-auth failed: ${
            resp?.error || "unknown"
          }</div>
        `;
      }
    } catch (e) {
      status.innerHTML = `
        <div class="status-label">Session</div>
        <div class="status-value" style="color:#dc2626">Re-auth error: ${e?.message || e}</div>
      `;
    }
  });
}

(async () => {
  const { email, spaceDid } = await chrome.storage.local.get([
    "email",
    "spaceDid",
  ]);
  const status = document.getElementById("status");
  if (!email) {
    status.innerHTML = `
      <div class="not-configured">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 12px">
          <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z" fill="currentColor" />
          <path d="M12 14a1 1 0 0 1-1-1V7a1 1 0 1 1 2 0v6a1 1 0 0 1-1 1zm-1.5 2.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" fill="currentColor" />
        </svg>
        <div>Not configured yet</div>
        <div style="font-size: 12px; margin-top: 4px">Click Configure Settings to get started</div>
      </div>
    `;
  } else {
    status.innerHTML = `
      <div class="status-label">Account</div>
      <div class="status-value">${email}</div>
      ${
        spaceDid
          ? `
        <div class="status-label" style="margin-top: 12px">Space</div>
        <div class="status-value">${spaceDid}</div>
      `
          : `
        <div class="status-label" style="margin-top: 12px">Space</div>
        <div class="status-value" style="color: #868e96">Pending configuration...</div>
      `
      }
    `;
  }

  // Load upload history
  await loadUploadHistory();

  try {
    const resp = await chrome.runtime.sendMessage({ type: "CHECK_SESSION" });
    if (!resp?.isValid) {
      try {
        const reauth = await chrome.runtime.sendMessage({
          type: "REAUTH",
          email,
          spaceDid: spaceDid || null,
        });
        if (!reauth?.ok) {
          renderSessionExpiredUI(email, spaceDid);
        } else {
          const s = document.getElementById("status");
          s.innerHTML += `
            <div class="status-label" style="margin-top: 12px">Session</div>
            <div class="status-value" style="color:#16a34a">Active</div>
          `;
        }
      } catch {
        renderSessionExpiredUI(email, spaceDid);
      }
    } else {
      const s = document.getElementById("status");
      s.innerHTML += `
        <div class="status-label" style="margin-top: 12px">Session</div>
        <div class="status-value" style="color:#16a34a">Active</div>
      `;
    }
  } catch (e) {
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "SESSION_EXPIRED") {
      renderSessionExpiredUI(email, spaceDid);
    }
  });
})();
