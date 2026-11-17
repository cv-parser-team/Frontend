import { X } from "lucide-react";

export default function Modal({
  title,
  onClose,
  children,
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >

        <div className="modal-header">

          <h2 id="modal-title">{title}</h2>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>

        <div className="modal-content">
          {children}
        </div>

      </div>
    </div>
  );
}