import { useRef, useState } from "react";

import { Trash2, UploadCloud } from "lucide-react";

import {
  initialSources,
  coverageRows,
} from "../data/mockData";

import SourceDistribution from "../components/ui/SourceDistribution";
import SourcesTable from "../components/ui/SourcesTable";
import FieldCoverageTable from "../components/ui/FieldCoverageTable";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

export default function SourcesPage() {

  const [sources, setSources] = useState(initialSources);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [issue, setIssue] = useState("Any");
  const [sort, setSort] = useState("Last processed");

  const [selectedSource, setSelectedSource] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const fileInputRef = useRef(null);

  // Upload Files

  const handleUpload = (event) => {

    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const newSources = files.map((file, index) => {

      let fileType = "Image";

      if (file.name.toLowerCase().endsWith(".pdf")) {
        fileType = "PDF";
      } else if (
        /\.(doc|docx)$/i.test(file.name)
      ) {
        fileType = "DOCX";
      }

      return {
        id: Date.now() + index,
        name: file.name,
        type: fileType,
        added: "Nov 3, 2026",
        processed: "Pending",
        status: "Partial",
        fields: 0,
        issues: "Pending review",
        issueType: "confidence",
      };
    });

    setSources((previous) => [
      ...newSources,
      ...previous,
    ]);

    setUploadMessage(
      `${files.length} file(s) added successfully. Processing is simulated in this demo.`
    );

    event.target.value = "";
  };

  // Delete Source

  const handleDelete = () => {

    setSources((previous) =>
      previous.filter(
        (source) => source.id !== deleteTarget.id
      )
    );

    setDeleteTarget(null);
  };

  return (
    <div className="sources-page">

      {/* Description */}

      <p className="page-description">
        See where every profile value came from.
        To add or monitor files, use Upload Documents.
      </p>

      {/* Source Distribution */}

      <SourceDistribution />

      {/* All Sources */}

      <SourcesTable
        sources={sources}
        search={search}
        setSearch={setSearch}
        type={type}
        setType={setType}
        status={status}
        setStatus={setStatus}
        issue={issue}
        setIssue={setIssue}
        sort={sort}
        setSort={setSort}
        onView={setSelectedSource}
        onDelete={setDeleteTarget}
      />

      {/* Field Coverage */}

      <FieldCoverageTable rows={coverageRows} />

      {/* Hidden File Input */}

      <input
        ref={fileInputRef}
        id="source-upload"
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleUpload}
      />

      {/* Source Details Modal */}

      {selectedSource && (

        <Modal
          title="Source details"
          onClose={() => setSelectedSource(null)}
        >

          <div className="detail-name">

            <div className="detail-file">
              <UploadCloud size={20} />
            </div>

            <div>
              <strong>{selectedSource.name}</strong>
              <p>
                {selectedSource.type} · Added {selectedSource.added}
              </p>
            </div>

          </div>

          <div className="detail-grid">

            <div>
              <span>Processing status</span>

              <Badge tone={selectedSource.status.toLowerCase()}>
                {selectedSource.status}
              </Badge>
            </div>

            <div>
              <span>Extracted fields</span>
              <strong>{selectedSource.fields}</strong>
            </div>

            <div>
              <span>Issues found</span>
              <strong>{selectedSource.issues}</strong>
            </div>

            <div>
              <span>Last processed</span>
              <strong>{selectedSource.processed}</strong>
            </div>

          </div>

          <p className="modal-note">
            Detailed extracted values are represented in
            the Field Coverage table.
          </p>

          <button
            className="primary-button"
            onClick={() => setSelectedSource(null)}
          >
            Done
          </button>

        </Modal>
      )}

      {/* Delete Confirmation Modal */}

      {deleteTarget && (

        <Modal
          title="Delete source?"
          onClose={() => setDeleteTarget(null)}
        >

          <p>
            Are you sure you want to remove{" "}
            <strong>{deleteTarget.name}</strong>?
          </p>

          <p className="modal-note">
            This action removes the source from the current
            demo session.
          </p>

          <div className="modal-actions">

            <button
              className="secondary-button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>

            <button
              className="danger-button"
              onClick={handleDelete}
            >
              <Trash2 size={15} />
              Delete source
            </button>

          </div>

        </Modal>
      )}

      {/* Upload Confirmation Modal */}

      {uploadMessage && (

        <Modal
          title="Upload complete"
          onClose={() => setUploadMessage("")}
        >

          <p>{uploadMessage}</p>

          <button
            className="primary-button"
            onClick={() => setUploadMessage("")}
          >
            Done
          </button>

        </Modal>
      )}

    </div>
  );
}