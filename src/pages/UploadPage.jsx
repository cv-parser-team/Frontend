
import { useCallback, useEffect, useRef, useState } from "react";

import "../css/UploadPage.css";

import {
  Bell,
  ChevronDown,
  CircleUserRound,
  UploadCloud,
  Check,
  AlertTriangle,
  X,
  MoreHorizontal,
  Eye,
  Trash2,
  LoaderCircle,
  FileText,
  RefreshCw,
} from "lucide-react";

import {
  getDocuments,
  uploadDocument,
  getDocument,
  deleteDocument,
} from "../api/documentApi";

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const ACCEPTED = ["pdf", "docx", "jpg", "jpeg", "png"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STATUS_POLL_INTERVAL_MS = 3000;
const ACTIVE_DOCUMENT_STATUSES = new Set([
  "stored",
  "pending",
  "queued",
  "processing",
]);

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFileType(document) {
  const mediaType = document.mediaType || "";

  if (mediaType.includes("pdf")) return "PDF";

  if (mediaType.includes("word")) return "DOCX";

  if (mediaType.startsWith("image/")) return "Image";

  const extension = document.originalFilename
    ?.split(".")
    .pop()
    ?.toUpperCase();

  return extension || "File";
}

function normalizeStatus(status) {
  const value = (status || "").toLowerCase();

  const statuses = {
    stored: "Stored",
    ready: "Ready",
    processing: "Processing",
    pending: "Pending",
    queued: "Queued",
    completed: "Completed",
    failed: "Failed",
  };

  return statuses[value] || status || "Unknown";
}

function normalizeDocument(document) {
  return {
    id: document.documentId,
    name: document.originalFilename || "Untitled document",
    type: getFileType(document),
    added: formatDate(document.createdAt),
    size: formatSize(document.byteSize),
    status: normalizeStatus(document.status),
    rawStatus: document.status,
    mediaType: document.mediaType,
    documentId: document.documentId,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    failureCode: document.failureCode,
    quality:
      document.status === "failed"
        ? "Upload failed"
        : "Available when processing finishes",
    detail:
      document.status === "stored"
        ? "Document successfully stored. Processing status may update later."
        : document.failureCode
          ? `Error: ${document.failureCode}`
          : "",
  };
}

function normalizeDocuments(documents) {
  return documents
    .filter((document) => document.documentId)
    .map(normalizeDocument);
}

// --------------------------------------------------
// HEADER
// --------------------------------------------------

function Header() {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Home</span>
        <span>/</span>
        <strong>Upload</strong>
      </div>

      <div className="account-actions">
        <button
          type="button"
          className="notification"
          aria-label="Notifications"
        >
          <Bell size={14} />
        </button>

        <button
          type="button"
          className="account"
          aria-label="Candidate account"
        >
          <CircleUserRound size={19} />
          <span>Candidate</span>
          <ChevronDown size={11} />
        </button>
      </div>
    </header>
  );
}

// --------------------------------------------------
// PAGE INTRODUCTION
// --------------------------------------------------

function PageIntro() {
  return (
    <div className="page-intro">
      <h1>Upload your documents</h1>

      <p>
        Add your resume and professional sources to build and keep
        your profile up to date. Several sources can be combined
        into one profile. Original files are kept until you delete
        the source.
      </p>
    </div>
  );
}

// --------------------------------------------------
// NUMBER DOT
// --------------------------------------------------

function NumberDot({ children }) {
  return <span className="number-dot">{children}</span>;
}

// --------------------------------------------------
// QUEUE STATUS
// --------------------------------------------------

function QueueStatus({ item }) {
  if (item.issue) {
    return (
      <span className="pill pill-error">
        <X size={11} />
        {item.issue === "unsupported"
          ? "Unsupported format"
          : item.issue === "oversize"
            ? "Over size limit"
            : "Empty file"}
      </span>
    );
  }

  if (item.duplicate && !item.keepBoth) {
    return (
      <span className="pill pill-warning">
        <AlertTriangle size={11} />
        Already added
      </span>
    );
  }

  return (
    <span className="pill pill-ready">
      <Check size={11} />
      Ready
    </span>
  );
}

// --------------------------------------------------
// READY QUEUE
// --------------------------------------------------

function ReadyQueue({
  items,
  onRemove,
  onKeep,
  onSkip,
}) {
  if (!items.length) return null;

  return (
    <div className="ready-queue">
      <div className="queue-heading">
        <strong>Ready to upload</strong>
        <NumberDot>{items.length}</NumberDot>
      </div>

      {items.map((item) => (
        <div className="queue-row" key={item.id}>
          <div className="queue-file">
            <span className="queue-name">
              {item.file.name}
            </span>

            <span className="queue-size">
              · {item.sizeLabel}
            </span>
          </div>

          <div className="queue-state">
            <QueueStatus item={item} />
          </div>

          <div className="queue-guidance">
            {item.issue && (
              <button onClick={() => onRemove(item.id)}>
                Remove
              </button>
            )}

            {item.duplicate && !item.issue && (
              <>
                <button onClick={() => onKeep(item.id)}>
                  Keep both as separate sources
                </button>

                {" · "}

                <button onClick={() => onSkip(item.id)}>
                  Skip
                </button>
              </>
            )}

            {!item.issue && !item.duplicate && (
              <button onClick={() => onRemove(item.id)}>
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------
// UPLOAD CARD
// --------------------------------------------------

function UploadCard({
  inputRef,
  queue,
  onQueueFiles,
  onRemove,
  onKeep,
  onSkip,
  onUpload,
  uploading,
  progress,
}) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    if (files.length) {
      onQueueFiles(files);
    }
  };

  const eligibleCount = queue.filter(
    (item) =>
      !item.issue &&
      (!item.duplicate || item.keepBoth)
  ).length;

  return (
    <section className="panel upload-panel">
      <div className="section-title">
        Add a source <NumberDot>1</NumberDot>
      </div>

      <div className="source-tabs">
        <button
          type="button"
          className="source-tab active"
        >
          File
        </button>
      </div>

      <button
        type="button"
        className={`dropzone ${
          dragging ? "dropzone-active" : ""
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);

          handleFiles(
            Array.from(e.dataTransfer.files || [])
          );
        }}
      >
        <span className="upload-icon">
          <UploadCloud size={24} />
        </span>

        <strong>Drag and drop your files here</strong>

        <span className="dropzone-help">
          PDF, DOCX, JPG, PNG · up to 10 MB · multiple
          files allowed
        </span>

        <span className="button button-primary browse-button">
          Browse files
        </span>
      </button>

      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg,.png"
        multiple
        onChange={(e) => {
          handleFiles(
            Array.from(e.target.files || [])
          );

          e.target.value = "";
        }}
      />

      <div className="upload-action-wrap">
        <button
          type="button"
          className="button button-primary upload-button"
          onClick={onUpload}
          disabled={!eligibleCount || uploading}
        >
          {uploading ? (
            <>
              <LoaderCircle
                className="spin"
                size={14}
              />

              Uploading {progress}%
            </>
          ) : (
            `Upload ${eligibleCount || ""}`
          )}
        </button>
      </div>

      {uploading && (
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <p className="helper-text">
        Original files are stored securely by the backend.
        Multiple sources can be combined into one profile.
      </p>

      <ReadyQueue
        items={queue}
        onRemove={onRemove}
        onKeep={onKeep}
        onSkip={onSkip}
      />
    </section>
  );
}

// --------------------------------------------------
// SOURCE STATUS
// --------------------------------------------------

function StatusBadge({ status }) {
  const map = {
    Stored: ["pill-processing", <FileText size={11} />],
    Ready: ["pill-completed", <Check size={11} />],
    Processing: [
      "pill-processing",
      <LoaderCircle className="spin" size={11} />,
    ],
    Pending: ["pill-queued", <RefreshCw size={11} />],
    Queued: ["pill-queued", <RefreshCw size={11} />],
    Completed: ["pill-completed", <Check size={11} />],
    Failed: [
      "pill-error",
      <AlertTriangle size={11} />,
    ],
  };

  const [className, icon] = map[status] || [
    "pill-queued",
    <FileText size={11} />,
  ];

  return (
    <span className={`pill ${className}`}>
      {icon}
      {status}
    </span>
  );
}

// --------------------------------------------------
// SOURCE ACTIONS
// --------------------------------------------------

function SourceActions({
  source,
  onDelete,
  onView,
  deleting,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="source-actions">
      <button
        type="button"
        className="button source-primary"
        onClick={() => onView(source)}
      >
        View details
      </button>

      <button
        type="button"
        className="more-button"
        aria-label={`More actions for ${source.name}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={17} />
      </button>

      {open && (
        <div className="action-menu">
          <button
            type="button"
            onClick={() => {
              onView(source);
              setOpen(false);
            }}
          >
            <Eye size={13} />
            View details
          </button>

          <button
            type="button"
            className="danger-action"
            disabled={deleting}
            onClick={() => {
              onDelete(source);
              setOpen(false);
            }}
          >
            <Trash2 size={13} />
            Delete source
          </button>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// SOURCES TABLE
// --------------------------------------------------

function SourceTable({
  sources,
  loading,
  onDelete,
  onView,
  deletingId,
}) {
  return (
    <section className="panel sources-panel">
      <div className="section-title">
        Your sources

        <span className="source-count">
          {sources.length} documents
        </span>
      </div>

      <div className="table-scroll">
        <table className="sources-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Type</th>
              <th>Added</th>
              <th>Size</th>
              <th>Status</th>
              <th>Data quality</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="source-name">
                  {source.name}
                </td>

                <td>{source.type}</td>

                <td>{source.added}</td>

                <td>{source.size}</td>

                <td className="status-cell">
                  <StatusBadge status={source.status} />

                  {source.detail && (
                    <p className="cell-detail">
                      {source.detail}
                    </p>
                  )}
                </td>

                <td className="quality-cell">
                  <span className="quality-plain">
                    {source.quality}
                  </span>
                </td>

                <td>
                  <SourceActions
                    source={source}
                    onDelete={onDelete}
                    onView={onView}
                    deleting={deletingId === source.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="empty-sources">
            <LoaderCircle className="spin" size={20} />
            <p>Loading your sources...</p>
          </div>
        )}

        {!loading && sources.length === 0 && (
          <div className="empty-sources">
            <FileText size={26} />

            <p>No sources yet</p>

            <span>
              Upload your resume or another professional
              document to start building your profile.
            </span>
          </div>
        )}
      </div>

      <div className="table-footnote">
        Your sources are retrieved directly from your
        authenticated candidate account.
      </div>
    </section>
  );
}

// --------------------------------------------------
// DOCUMENT DETAILS MODAL
// --------------------------------------------------

function DocumentDetails({ document, onClose }) {
  if (!document) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <section
        className="review-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <h2>Document details</h2>

        <div className="document-details">
          <p>
            <strong>Filename:</strong>{" "}
            {document.originalFilename}
          </p>

          <p>
            <strong>Document ID:</strong>{" "}
            {document.documentId}
          </p>

          <p>
            <strong>Purpose:</strong>{" "}
            {document.purpose}
          </p>

          <p>
            <strong>Media type:</strong>{" "}
            {document.mediaType}
          </p>

          <p>
            <strong>Size:</strong>{" "}
            {formatSize(document.byteSize)}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {normalizeStatus(document.status)}
          </p>

          <p>
            <strong>Created:</strong>{" "}
            {formatDate(document.createdAt)}
          </p>

          <p>
            <strong>Updated:</strong>{" "}
            {formatDate(document.updatedAt)}
          </p>

          {document.failureCode && (
            <p>
              <strong>Failure:</strong>{" "}
              {document.failureCode}
            </p>
          )}
        </div>

        <button
          type="button"
          className="button button-primary modal-done"
          onClick={onClose}
        >
          Close
        </button>
      </section>
    </div>
  );
}

// --------------------------------------------------
// MAIN UPLOAD PAGE
// --------------------------------------------------

export default function UploadPage() {
  const inputRef = useRef(null);
  const statusPollInFlightRef = useRef(false);
  const statusPollingGenerationRef = useRef(0);

  const [sources, setSources] = useState([]);
  const [queue, setQueue] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [progress, setProgress] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  const [selectedDocument, setSelectedDocument] =
    useState(null);

  // ------------------------------------------------
  // LOAD SOURCES FROM BACKEND
  // ------------------------------------------------

  const loadSources = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
      setError("");
    }

    try {
      const documents = await getDocuments();
      setSources(normalizeDocuments(documents));
      setStatusError("");
    } catch (err) {
      const message = err.message || "Failed to load documents.";
      if (showLoading) {
        setError(message);
      } else {
        setStatusError(message);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const hasActiveDocuments = sources.some((source) =>
    ACTIVE_DOCUMENT_STATUSES.has(
      String(source.rawStatus || "").toLowerCase()
    )
  );

  useEffect(() => {
    if (!hasActiveDocuments) return undefined;

    const generation = statusPollingGenerationRef.current + 1;
    statusPollingGenerationRef.current = generation;
    const intervalId = window.setInterval(() => {
      if (statusPollInFlightRef.current) return;
      statusPollInFlightRef.current = true;

      getDocuments()
        .then((documents) => {
          if (statusPollingGenerationRef.current !== generation) return;

          setSources(normalizeDocuments(documents));
          setStatusError("");
        })
        .catch((err) => {
          if (statusPollingGenerationRef.current === generation) {
            setStatusError(
              err.message || "Failed to refresh document statuses."
            );
          }
        })
        .finally(() => {
          statusPollInFlightRef.current = false;
        });
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      if (statusPollingGenerationRef.current === generation) {
        statusPollingGenerationRef.current += 1;
      }
      window.clearInterval(intervalId);
    };
  }, [hasActiveDocuments]);

  // ------------------------------------------------
  // ADD FILES TO QUEUE
  // ------------------------------------------------

  const queueFiles = (files) => {
    const newItems = files.map((file, index) => {
      const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

      const duplicate = sources.some(
        (source) =>
          source.name.toLowerCase() ===
          file.name.toLowerCase()
      );

      let issue = "";

      if (!ACCEPTED.includes(extension)) {
        issue = "unsupported";
      } else if (file.size > MAX_FILE_SIZE) {
        issue = "oversize";
      } else if (file.size === 0) {
        issue = "empty";
      }

      return {
        id: `${Date.now()}-${index}-${Math.random()}`,
        file,
        issue,
        duplicate,
        keepBoth: false,
        sizeLabel: formatSize(file.size),
      };
    });

    setQueue((current) => [...current, ...newItems]);
    setError("");
    setSuccess("");
  };

  // ------------------------------------------------
  // UPDATE QUEUE
  // ------------------------------------------------

  const updateQueue = (id, patch) => {
    setQueue((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, ...patch }
          : item
      )
    );
  };

  const removeQueue = (id) => {
    setQueue((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  // ------------------------------------------------
  // UPLOAD FILES TO BACKEND
  // ------------------------------------------------

  const uploadFiles = async () => {
    const eligible = queue.filter(
      (item) =>
        !item.issue &&
        (!item.duplicate || item.keepBoth)
    );

    if (!eligible.length || uploading) return;

    setUploading(true);
    setProgress(0);
    setError("");
    setStatusError("");
    setSuccess("");

    let completed = 0;
    const total = eligible.length;

    const successfulIds = [];
    const failures = [];

    for (const item of eligible) {
      try {
        await uploadDocument(item.file, (fileProgress) => {
          const overallProgress = Math.round(
            ((completed + fileProgress / 100) / total) * 100
          );

          setProgress(overallProgress);
        });

        successfulIds.push(item.id);
        completed++;

        setProgress(
          Math.round((completed / total) * 100)
        );
      } catch (err) {
        failures.push({
          name: item.file.name,
          message: err.message,
        });
      }
    }

    setQueue((current) =>
      current.filter(
        (item) => !successfulIds.includes(item.id)
      )
    );

    setUploading(false);

    // Reload actual records without replacing the table with a loading state.
    await loadSources({ showLoading: false });

    if (failures.length) {
      setError(
        failures
          .map(
            (failure) =>
              `${failure.name}: ${failure.message}`
          )
          .join(" | ")
      );

      if (successfulIds.length) {
        setSuccess(
          `${successfulIds.length} file(s) uploaded successfully.`
        );
      }
    } else {
      setSuccess(
        `${successfulIds.length} file(s) uploaded successfully.`
      );
    }
  };

  // ------------------------------------------------
  // DELETE DOCUMENT
  // ------------------------------------------------

  const handleDelete = async (source) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${source.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(source.id);
    setError("");
    setSuccess("");

    try {
      await deleteDocument(source.documentId);

      setSources((current) =>
        current.filter(
          (item) => item.id !== source.id
        )
      );

      setSuccess("Document deleted successfully.");
    } catch (err) {
      setError(
        err.message || "Failed to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ------------------------------------------------
  // VIEW DOCUMENT DETAILS
  // ------------------------------------------------

  const handleView = async (source) => {
    setError("");

    try {
      const document = await getDocument(
        source.documentId
      );

      setSelectedDocument(document);
    } catch (err) {
      setError(
        err.message || "Unable to load document details."
      );
    }
  };

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <main className="app-shell">
      <div className="page-container">
        <Header />

        <PageIntro />

        {error && (
          <div className="api-message api-error" role="alert">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        {statusError && (
          <div className="api-message api-error" role="alert">
            <AlertTriangle size={15} />
            <span>{statusError}</span>
          </div>
        )}

        {success && (
          <div className="api-message api-success" role="status">
            <Check size={15} />
            <span>{success}</span>
          </div>
        )}

        <UploadCard
          inputRef={inputRef}
          queue={queue}
          onQueueFiles={queueFiles}
          onRemove={removeQueue}
          onKeep={(id) =>
            updateQueue(id, {
              keepBoth: true,
              duplicate: false,
            })
          }
          onSkip={removeQueue}
          onUpload={uploadFiles}
          uploading={uploading}
          progress={progress}
        />

        <SourceTable
          sources={sources}
          loading={loading}
          onDelete={handleDelete}
          onView={handleView}
          deletingId={deletingId}
        />

        <div className="refresh-sources">
          <button
            type="button"
            className="button"
            onClick={loadSources}
            disabled={loading || uploading}
          >
            <RefreshCw size={14} />
            Refresh sources
          </button>
        </div>
      </div>

      {selectedDocument && (
        <DocumentDetails
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </main>
  );
}
