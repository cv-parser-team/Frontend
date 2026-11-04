
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleUserRound,
  UploadCloud,
  Check,
  AlertTriangle,
  X,
  Circle,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Trash2,
  LoaderCircle,
  Link as LinkIcon,
} from "lucide-react";

const ACCEPTED = ["pdf", "docx", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const initialSources = [
  {
    id: "resume-2026",
    name: "Resume_2026.pdf",
    type: "PDF",
    added: "Oct 26",
    size: "212 KB",
    status: "Processing",
    detail:
      "Stage 3 of 6. This usually takes a few minutes; you can leave this page.",
    stages: [
      "Text ✓",
      "OCR skipped",
      "Extracting data...",
      "Validation",
      "Conflicts",
      "Profile update",
    ],
    quality: "Available when finished",
    action: "View details",
  },
  {
    id: "resume-old",
    name: "Resume_Old.docx",
    type: "DOCX",
    added: "Oct 20",
    size: "96 KB",
    status: "Completed",
    quality: "3 need review",
    qualityDetail:
      "24 extracted · 1 conflict · 1 low confidence · 1 missing",
    action: "View extracted data",
  },
  {
    id: "resume-photo",
    name: "Resume_Photo.jpg",
    type: "Image",
    added: "Oct 18",
    size: "1.4 MB",
    status: "Partially processed",
    detail: "Some text was unreadable (low image quality).",
    quality: "5 need review",
    action: "Open related issues",
    secondary: "Or upload a clearer image",
  },
  {
    id: "linkedin-profile",
    name: "LinkedIn Profile",
    type: "Link",
    added: "Oct 26",
    size: "n/a",
    status: "Queued",
    detail:
      "Retrieval status: waiting. Access depends on profile visibility.",
    quality: "Available when finished",
    action: "View details",
  },
];

function NumberDot({ children }) {
  return <span className="number-dot">{children}</span>;
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
          aria-label="3 notifications"
        >
          <Bell size={14} />
          <span>3</span>
        </button>

        <button
          type="button"
          className="account"
          aria-label="Candidate account menu"
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
        your profile up to date. Several
        <br className="desktop-break" />
        sources can be combined into one profile. Original files
        are kept until you delete the source.
      </p>
    </div>
  );
}

// --------------------------------------------------
// REVIEW BANNER
// --------------------------------------------------

function ReviewBanner({ onReview }) {
  return (
    <div className="review-banner">
      <div className="banner-message">
        <Check size={14} />
        <span>
          Resume_Old.docx added 24 fields. 3 items need review.
        </span>
      </div>

      <button
        type="button"
        className="button button-primary banner-button"
        onClick={onReview}
      >
        Open Review Center
      </button>

      <NumberDot>7</NumberDot>
    </div>
  );
}

// --------------------------------------------------
// QUEUE STATUS
// --------------------------------------------------

function QueueStatus({ item }) {
  if (item.issue === "unsupported") {
    return (
      <span className="pill pill-error">
        <X size={11} />
        Unsupported format
      </span>
    );
  }

  if (item.issue === "oversize") {
    return (
      <span className="pill pill-error">
        <X size={11} />
        Over size limit
      </span>
    );
  }

  if (item.issue === "unreadable") {
    return (
      <span className="pill pill-error">
        <X size={11} />
        Cannot be read
      </span>
    );
  }

  if (item.duplicate) {
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
// READY TO UPLOAD QUEUE
// --------------------------------------------------

function ReadyQueue({
  items,
  onRemove,
  onKeep,
  onSkip,
  onReplace,
}) {
  if (!items.length) return null;

  return (
    <div className="ready-queue">
      <div className="queue-heading">
        <strong>Ready to upload</strong>
        <NumberDot>2</NumberDot>
      </div>

      {items.map((item) => (
        <div className="queue-row" key={item.id}>
          <div className="queue-file">
            <span className="queue-name">{item.file.name}</span>
            <span className="queue-size">
              · {item.sizeLabel}
            </span>
          </div>

          <div className="queue-state">
            <QueueStatus item={item} />
          </div>

          <div className="queue-guidance">
            {item.issue === "unsupported" && (
              <>
                Use PDF, DOCX, JPG or PNG ·{" "}
                <button onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              </>
            )}

            {item.issue === "oversize" && (
              <>
                Compress or choose another file ·{" "}
                <button onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              </>
            )}

            {item.issue === "unreadable" && (
              <>
                Re-export the file and try again ·{" "}
                <button onClick={() => onReplace(item.id)}>
                  Replace
                </button>
              </>
            )}

            {item.duplicate && (
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
// UPLOAD CARD - FILE AND LINK TABS
// --------------------------------------------------

function UploadCard({
  inputRef,
  queue,
  onQueueFiles,
  onRemove,
  onKeep,
  onSkip,
  onReplace,
  onUpload,
  onAddLink,
  uploading,
  progress,
}) {
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("file");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");

  const handleFiles = (files) => {
    if (files.length) {
      onQueueFiles(files);
    }
  };

  const handleAddLink = () => {
    const value = link.trim();

    if (!value) {
      setLinkError("Please enter a profile URL.");
      setLinkSuccess("");
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(value);
    } catch {
      setLinkError("Please enter a valid URL.");
      setLinkSuccess("");
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setLinkError("Please enter a valid HTTP or HTTPS URL.");
      setLinkSuccess("");
      return;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if (
      hostname === "linkedin.com" ||
      hostname.endsWith(".linkedin.com")
    ) {
      if (
        !hostname.startsWith("www.") &&
        !hostname.startsWith("m.")
      ) {
        // LinkedIn URLs are accepted with or without www.
      }

      if (!parsedUrl.pathname.startsWith("/in/") &&
          !parsedUrl.pathname.startsWith("/pub/")) {
        setLinkError(
          "Please enter a valid LinkedIn profile URL."
        );
        setLinkSuccess("");
        return;
      }
    }

    const result = onAddLink(parsedUrl.href);

    if (result === false) {
      setLinkError("This link has already been added.");
      setLinkSuccess("");
      return;
    }

    setLink("");
    setLinkError("");
    setLinkSuccess("Source added successfully.");
  };

  return (
    <section className="panel upload-panel">
      <div className="section-title">
        Add a source <NumberDot>1</NumberDot>
      </div>

      {/* TABS */}

      <div className="source-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "file"}
          className={`source-tab ${
            activeTab === "file" ? "active" : ""
          }`}
          onClick={() => setActiveTab("file")}
        >
          File
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "link"}
          className={`source-tab ${
            activeTab === "link" ? "active" : ""
          }`}
          onClick={() => setActiveTab("link")}
        >
          LinkedIn or other link
        </button>
      </div>

      {/* FILE UPLOAD TAB */}

      {activeTab === "file" && (
        <>
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
              disabled={
                !queue.some(
                  (item) =>
                    !item.issue &&
                    (!item.duplicate || item.keepBoth)
                ) || uploading
              }
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
                "Upload"
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
              aria-label="File upload progress"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          )}

          <p className="helper-text">
            Original files are kept until you delete the source.
            Multiple sources can be combined into one profile.
          </p>

          <NumberDot>8</NumberDot>

          <ReadyQueue
            items={queue}
            onRemove={onRemove}
            onKeep={onKeep}
            onSkip={onSkip}
            onReplace={onReplace}
          />
        </>
      )}

      {/* LINK TAB */}

      {activeTab === "link" && (
        <div className="link-upload-section">
          <label htmlFor="profile-url">
            LinkedIn profile URL or professional source
          </label>

          <div className="link-input-row">
            <input
              id="profile-url"
              type="url"
              value={link}
              placeholder="Paste your LinkedIn profile URL"
              onChange={(e) => {
                setLink(e.target.value);
                setLinkError("");
                setLinkSuccess("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
              aria-invalid={Boolean(linkError)}
              aria-describedby={
                linkError
                  ? "link-error"
                  : "link-help"
              }
            />

            <button
              type="button"
              className="button button-primary add-link-button"
              onClick={handleAddLink}
            >
              <LinkIcon size={14} />
              Add source
            </button>
          </div>

          {linkError && (
            <p
              id="link-error"
              className="link-error"
              role="alert"
            >
              {linkError}
            </p>
          )}

          {linkSuccess && (
            <p
              className="link-success"
              role="status"
            >
              <CheckCircleIcon />
              {linkSuccess}
            </p>
          )}

          {!linkError && !linkSuccess && (
            <p id="link-help" className="helper-text">
              URL format is checked as you type. Retrieval depends
              on whether the profile is accessible and on the
              supported method. By adding a link, you confirm it
              is your own profile.
            </p>
          )}

          <NumberDot>8</NumberDot>
        </div>
      )}
    </section>
  );
}

function CheckCircleIcon() {
  return <Check size={13} />;
}

// --------------------------------------------------
// SOURCE STATUS BADGE
// --------------------------------------------------

function StatusBadge({ status }) {
  const map = {
    Processing: [
      "pill-processing",
      <LoaderCircle size={11} />,
    ],
    Completed: [
      "pill-completed",
      <Check size={11} />,
    ],
    "Partially processed": [
      "pill-warning",
      <AlertTriangle size={11} />,
    ],
    Queued: [
      "pill-queued",
      <Circle size={10} />,
    ],
  };

  const [cls, icon] = map[status] || map.Queued;

  return (
    <span className={`pill ${cls}`}>
      {icon}
      {status}
    </span>
  );
}

// --------------------------------------------------
// SOURCE ACTIONS
// --------------------------------------------------

function SourceActions({ source, onDelete, onRetry }) {
  const [open, setOpen] = useState(false);

  const canView =
    source.status === "Completed" ||
    source.status === "Partially processed";

  return (
    <div className="source-actions">
      <button
        type="button"
        className={`button source-primary ${
          canView ? "" : "button-disabled"
        }`}
        onClick={() => setOpen((value) => !value)}
      >
        {source.action || "View details"}
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
            onClick={() => setOpen(false)}
          >
            <Eye size={13} />
            View details
          </button>

          <button
            type="button"
            onClick={() => {
              onRetry(source.id);
              setOpen(false);
            }}
          >
            <RefreshCw size={13} />
            Retry processing
          </button>

          <button
            type="button"
            className="danger-action"
            onClick={() => {
              onDelete(source.id);
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

function SourceTable({ sources, onDelete, onRetry }) {
  return (
    <section className="panel sources-panel">
      <h2 className="section-title">Your sources</h2>

      <div className="table-scroll">
        <table className="sources-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Type</th>
              <th>Added</th>
              <th>Size</th>

              <th>
                Status <NumberDot>4</NumberDot>
              </th>

              <th>
                Data quality <NumberDot>5</NumberDot>
              </th>

              <th>
                Actions <NumberDot>6</NumberDot>
              </th>
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

                  {source.stages && (
                    <div className="stage-list">
                      {source.stages.map((stage) => (
                        <span
                          key={stage}
                          className={
                            stage.includes("Extracting")
                              ? "stage-active"
                              : ""
                          }
                        >
                          {stage}
                        </span>
                      ))}
                    </div>
                  )}

                  {source.detail && (
                    <p className="cell-detail">
                      {source.detail}
                    </p>
                  )}
                </td>

                <td className="quality-cell">
                  {source.quality === "3 need review" ||
                  source.quality === "5 need review" ? (
                    <>
                      <span className="pill pill-warning">
                        <AlertTriangle size={11} />
                        {source.quality}
                      </span>

                      {source.qualityDetail && (
                        <p className="cell-detail">
                          {source.qualityDetail}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="quality-plain">
                      {source.quality}
                    </span>
                  )}
                </td>

                <td>
                  <SourceActions
                    source={source}
                    onDelete={onDelete}
                    onRetry={onRetry}
                  />

                  {source.secondary && (
                    <p className="cell-detail action-detail">
                      {source.secondary}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sources.length === 0 && (
          <div className="empty-sources">
            <p>No sources yet</p>
            <span>
              Add a resume or LinkedIn link above to start
              building your profile.
            </span>
          </div>
        )}
      </div>

      <div className="table-footnote">
        Overflow … menu: View details · View extracted data ·
        Retry processing · Open related issues · Delete source.
        The primary action changes with status. Read-only users
        see no upload, retry or delete controls.
        <br />
        Every status pairs an icon with text, not color alone.{" "}
        <NumberDot>10</NumberDot>
      </div>

      <NumberDot>9</NumberDot>
    </section>
  );
}

// --------------------------------------------------
// REVIEW CENTER DIALOG
// --------------------------------------------------

function ReviewDialog({ onClose }) {
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <section
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 id="review-title">Review center</h2>

        <p>
          Resume_Old.docx added 24 fields. 3 items need
          your attention.
        </p>

        <div className="review-item">
          <AlertTriangle size={15} />
          1 conflict needs confirmation
        </div>

        <div className="review-item">
          <AlertTriangle size={15} />
          1 field has low confidence
        </div>

        <div className="review-item">
          <AlertTriangle size={15} />
          1 field is missing
        </div>

        <button
          type="button"
          className="button button-primary modal-done"
          onClick={onClose}
        >
          Done
        </button>
      </section>
    </div>
  );
}

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

export default function App() {
  const inputRef = useRef(null);
  const uploadTimerRef = useRef(null);

  const [sources, setSources] = useState(initialSources);
  const [queue, setQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Add files to upload queue.
  const queueFiles = (files) => {
    setQueue((current) => [
      ...current,
      ...files.map((file, index) => {
        const ext = file.name
          .split(".")
          .pop()
          ?.toLowerCase();

        const duplicate = sources.some(
          (source) =>
            source.name.toLowerCase() ===
            file.name.toLowerCase()
        );

        let issue = "";

        if (!ACCEPTED.includes(ext)) {
          issue = "unsupported";
        } else if (file.size > MAX_FILE_SIZE) {
          issue = "oversize";
        } else if (file.size === 0) {
          issue = "unreadable";
        }

        return {
          id: `${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          file,
          issue,
          duplicate,
          keepBoth: false,
          sizeLabel: file.size
            ? `${(file.size / 1024).toFixed(0)} KB`
            : "0 KB",
        };
      }),
    ]);
  };

  // Update an item in the queue.
  const updateQueue = (id, patch) => {
    setQueue((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, ...patch }
          : item
      )
    );
  };

  // Remove queue item.
  const removeQueue = (id) => {
    setQueue((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  // Delete source.
  const deleteSource = (id) => {
    setSources((current) =>
      current.filter((source) => source.id !== id)
    );
  };

  // Retry processing.
  const retrySource = (id) => {
    setSources((current) =>
      current.map((source) =>
        source.id === id
          ? {
              ...source,
              status: "Processing",
              detail:
                "Processing has been queued for retry.",
            }
          : source
      )
    );
  };

  // Add LinkedIn or another professional link.
  const addLinkSource = (url) => {
    const normalizedUrl = new URL(url).href;

    const alreadyExists = sources.some(
      (source) =>
        source.url &&
        source.url.toLowerCase() ===
          normalizedUrl.toLowerCase()
    );

    if (alreadyExists) {
      return false;
    }

    const hostname = new URL(normalizedUrl)
      .hostname
      .replace(/^www\./, "");

    const isLinkedIn =
      hostname === "linkedin.com" ||
      hostname.endsWith(".linkedin.com");

    const newSource = {
      id: `link-${Date.now()}`,
      name: isLinkedIn
        ? "LinkedIn Profile"
        : hostname,
      url: normalizedUrl,
      type: "Link",
      added: new Date().toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      ),
      size: "n/a",
      status: "Queued",
      detail:
        "Retrieval status: waiting. Access depends on profile visibility.",
      quality: "Available when finished",
      action: "View details",
    };

    setSources((current) => [
      newSource,
      ...current,
    ]);

    return true;
  };

  // Upload files with simulated progress.
  const uploadFiles = () => {
    const eligible = queue.filter(
      (item) =>
        !item.issue &&
        (!item.duplicate || item.keepBoth)
    );

    if (!eligible.length || uploading) return;

    setUploading(true);
    setProgress(0);

    let value = 0;

    uploadTimerRef.current = window.setInterval(() => {
      value = Math.min(100, value + 10);

      setProgress(value);

      if (value >= 100) {
        window.clearInterval(uploadTimerRef.current);
        uploadTimerRef.current = null;

        const date = new Date().toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        );

        const added = eligible.map((item, index) => {
          const ext = item.file.name
            .split(".")
            .pop()
            .toLowerCase();

          return {
            id: `uploaded-${Date.now()}-${index}`,
            name: item.file.name,
            type: ["jpg", "jpeg", "png"].includes(ext)
              ? "Image"
              : ext.toUpperCase(),
            added: date,
            size: item.sizeLabel,
            status: "Queued",
            detail:
              "Waiting for a free processor. Nothing is needed from you yet.",
            quality: "Available when finished",
            action: "View details",
          };
        });

        setSources((current) => [
          ...added,
          ...current,
        ]);

        setQueue((current) =>
          current.filter(
            (item) =>
              !eligible.some(
                (done) => done.id === item.id
              )
          )
        );

        setUploading(false);
      }
    }, 180);
  };

  // Clean up timer when component unmounts.
  useEffect(() => {
    return () => {
      if (uploadTimerRef.current) {
        window.clearInterval(uploadTimerRef.current);
      }
    };
  }, []);

  return (
    <main className="app-shell">
      <div className="page-container">
        <Header />

        <PageIntro />

        <ReviewBanner
          onReview={() => setReviewOpen(true)}
        />

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
          onReplace={(id) => {
            removeQueue(id);
            inputRef.current?.click();
          }}
          onUpload={uploadFiles}
          onAddLink={addLinkSource}
          uploading={uploading}
          progress={progress}
        />

        <SourceTable
          sources={sources}
          onDelete={deleteSource}
          onRetry={retrySource}
        />
      </div>

      {reviewOpen && (
        <ReviewDialog
          onClose={() => setReviewOpen(false)}
        />
      )}
    </main>
  );
}
