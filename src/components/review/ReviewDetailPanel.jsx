
import { useEffect, useState } from "react";

import {
  Check,
  Undo2,
  AlertTriangle,
  Circle,
} from "lucide-react";

import ReviewBadge from "./ReviewBadge";

export default function ReviewDetailPanel({
  issue,
  savedIssue,
  onSave,
  onUndo,
  onNext,
}) {
  const [correctValue, setCorrectValue] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    setCorrectValue(issue?.currentValue || "");
    setPhoneNumber("");
  }, [issue?.id, issue?.currentValue]);

  if (!issue) {
    return (
      <section className="review-detail-panel empty-panel">
        <h3>No issue selected</h3>
        <p>Select an issue from the table to review it.</p>
      </section>
    );
  }

  const isSaved = savedIssue?.id === issue.id;

  const handleSave = (decision, value) => {
    onSave(issue.id, decision, value);
  };

  const CompareValues = () => (
    <>
      <h4 className="section-label">
        Compare values
      </h4>

      <div className="compare-values">
        <div className="compare-card">
          <strong>Current</strong>
          <p>{issue.currentValue || "None accepted"}</p>
        </div>

        <div className="compare-card">
          <strong>Source A</strong>

          <p>{issue.sourceA?.value || "Not available"}</p>

          <span>
            {issue.sourceA?.document || ""}
          </span>

          {issue.sourceA?.confidence && (
            <span>{issue.sourceA.confidence}</span>
          )}

          <button
            type="button"
            className="text-link"
            onClick={() =>
              window.alert(
                `Viewing original: ${issue.sourceA?.document || "Source A"}`
              )
            }
          >
            View original
          </button>
        </div>

        <div className="compare-card">
          <strong>Source B</strong>

          <p>{issue.sourceB?.value || "Not available"}</p>

          <span>
            {issue.sourceB?.document || ""}
          </span>

          {issue.sourceB?.confidence && (
            <span>{issue.sourceB.confidence}</span>
          )}

          <button
            type="button"
            className="text-link"
            onClick={() =>
              window.alert(
                `Viewing original: ${issue.sourceB?.document || "Source B"}`
              )
            }
          >
            View original
          </button>
        </div>
      </div>
    </>
  );

  if (isSaved) {
    return (
      <section className="review-detail-panel">
        <div className="saved-state">
          <div className="saved-message">
            <strong>
              <Check size={16} />
              Decision saved
            </strong>

            <p>
              {savedIssue.message}
            </p>

            <p>
              Added to History & Activity.
            </p>
          </div>

          <div className="saved-actions">
            <button
              type="button"
              className="review-action-button outline"
              onClick={() => onUndo(issue.id)}
            >
              <Undo2 size={14} />
              Undo
            </button>

            <button
              type="button"
              className="review-action-button"
              onClick={onNext}
            >
              Next issue
            </button>
          </div>

          <p className="detail-help">
            Resolved issues can be re-opened later with
            previous values restored.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="review-detail-panel">
      <div className="detail-panel-content">

        {/* Issue heading */}
        <div className="detail-heading">
          <h3>{issue.field}</h3>

          <ReviewBadge tone="yellow">
            {issue.id}
          </ReviewBadge>
        </div>

        {/* CONFLICT */}
        {issue.reviewType === "conflict" && (
          <>
            <ReviewBadge tone="warning">
              <AlertTriangle size={11} />
              Needs decision
            </ReviewBadge>

            <CompareValues />

            <div className="button-group">
              <button
                type="button"
                className="review-action-button"
                onClick={() =>
                  handleSave(
                    "acceptA",
                    issue.sourceA?.value
                  )
                }
              >
                Accept A
              </button>

              <button
                type="button"
                className="review-action-button"
                onClick={() =>
                  handleSave(
                    "acceptB",
                    issue.sourceB?.value
                  )
                }
              >
                Accept B
              </button>

              <button
                type="button"
                className="review-action-button outline"
                onClick={() => {
                  if (correctValue.trim()) {
                    handleSave(
                      "editAccept",
                      correctValue.trim()
                    );
                  } else {
                    window.alert("Enter a corrected value first.");
                  }
                }}
              >
                Edit and accept
              </button>
            </div>

            <input
              className="review-input"
              value={correctValue}
              onChange={(event) =>
                setCorrectValue(event.target.value)
              }
              placeholder="Enter corrected value"
              aria-label="Corrected value"
            />

            <button
              type="button"
              className="review-action-button outline"
              onClick={() =>
                handleSave("unresolved", issue.currentValue)
              }
            >
              Mark unresolved
            </button>

            <p className="detail-help">
              {issue.note}
            </p>
          </>
        )}

        {/* LOW CONFIDENCE */}
        {issue.reviewType === "lowConfidence" && (
          <>
            <ReviewBadge tone="neutral">
              <Circle size={10} />
              Needs review · Low confidence
            </ReviewBadge>

            <h4 className="section-label">
              Extracted value
            </h4>

            <div className="extracted-value">
              <strong>{issue.extractedValue}</strong>

              <p>
                {issue.document} · {issue.confidence}
              </p>
            </div>

            <div className="reason-box">
              Reason: {issue.reason}
            </div>

            <div className="evidence-box">
              {issue.evidence}
            </div>

            <input
              className="review-input"
              value={correctValue}
              onChange={(event) =>
                setCorrectValue(event.target.value)
              }
              placeholder="Correct value"
              aria-label="Correct value"
            />

            <div className="button-group">
              <button
                type="button"
                className="review-action-button"
                onClick={() =>
                  handleSave(
                    "confirm",
                    issue.extractedValue
                  )
                }
              >
                Confirm value
              </button>

              <button
                type="button"
                className="review-action-button outline"
                onClick={() => {
                  if (correctValue.trim()) {
                    handleSave(
                      "correct",
                      correctValue.trim()
                    );
                  } else {
                    window.alert("Enter a corrected value first.");
                  }
                }}
              >
                Correct value
              </button>
            </div>
          </>
        )}

        {/* MISSING INFORMATION */}
        {issue.reviewType === "missing" && (
          <>
            <ReviewBadge tone="neutral">
              <Circle size={10} />
              Needs review · Required
            </ReviewBadge>

            <h4 className="section-label">
              Field importance
            </h4>

            <div className="importance-card">
              <strong>{issue.importance}</strong>
              <p>{issue.field}</p>
            </div>

            <div className="importance-card">
              <strong>{issue.recommendation}</strong>
              <p>Portfolio link</p>
            </div>

            <input
              className="review-input"
              type="tel"
              value={phoneNumber}
              onChange={(event) =>
                setPhoneNumber(event.target.value)
              }
              placeholder="Add phone number"
              aria-label="Phone number"
            />

            <div className="button-group">
              <button
                type="button"
                className="review-action-button"
                onClick={() => {
                  if (phoneNumber.trim()) {
                    handleSave(
                      "addInformation",
                      phoneNumber.trim()
                    );
                  } else {
                    window.alert("Enter a phone number first.");
                  }
                }}
              >
                Add information
              </button>

              <button
                type="button"
                className="review-action-button outline"
                onClick={() =>
                  window.alert("Profile editor placeholder")
                }
              >
                Edit profile
              </button>
            </div>
          </>
        )}

        {/* DUPLICATE */}
        {issue.reviewType === "duplicate" && (
          <>
            <ReviewBadge tone="purple">
              Possible duplicate
            </ReviewBadge>

            <CompareValues />

            <div className="button-group">
              <button
                type="button"
                className="review-action-button"
                onClick={() =>
                  handleSave(
                    "merge",
                    issue.sourceA?.value
                  )
                }
              >
                Merge
              </button>

              <button
                type="button"
                className="review-action-button outline"
                onClick={() =>
                  handleSave(
                    "keepBoth",
                    issue.currentValue
                  )
                }
              >
                Keep both
              </button>
            </div>
          </>
        )}

        {/* INVALID LINK */}
        {issue.reviewType === "invalidLink" && (
          <>
            <ReviewBadge tone="warning">
              Invalid link
            </ReviewBadge>

            <h4 className="section-label">
              Extracted URL
            </h4>

            <div className="extracted-value">
              <p>{issue.currentValue}</p>
            </div>

            <input
              className="review-input"
              value={correctValue}
              onChange={(event) =>
                setCorrectValue(event.target.value)
              }
              placeholder="Enter corrected URL"
              aria-label="Corrected URL"
            />

            <div className="button-group">
              <button
                type="button"
                className="review-action-button"
                onClick={() => {
                  try {
                    const url = new URL(correctValue);

                    if (
                      url.protocol === "http:" ||
                      url.protocol === "https:"
                    ) {
                      handleSave(
                        "fixLink",
                        correctValue
                      );
                    } else {
                      window.alert(
                        "URL must use HTTP or HTTPS."
                      );
                    }
                  } catch {
                    window.alert("Enter a valid URL.");
                  }
                }}
              >
                Fix link
              </button>

              <button
                type="button"
                className="review-action-button outline"
                onClick={() =>
                  handleSave(
                    "dismiss",
                    issue.currentValue
                  )
                }
              >
                Dismiss
              </button>
            </div>
          </>
        )}

        {/* EXTRACTION ISSUE */}
        {issue.reviewType === "extraction" && (
          <>
            <ReviewBadge tone="error">
              Processing issue
            </ReviewBadge>

            <h4 className="section-label">
              Extraction details
            </h4>

            <div className="extracted-value">
              <strong>Source document</strong>
              <p>{issue.source}</p>
            </div>

            <div className="reason-box">
              Some text could not be extracted from this
              document. You can retry processing.
            </div>

            <div className="button-group">
              <button
                type="button"
                className="review-action-button"
                onClick={() =>
                  handleSave("retry", issue.source)
                }
              >
                Retry extraction
              </button>

              <button
                type="button"
                className="review-action-button outline"
                onClick={() =>
                  handleSave("dismiss", issue.source)
                }
              >
                Dismiss
              </button>
            </div>
          </>
        )}

      </div>

      {/* Save changes */}
      <div className="detail-footer">
        <button
          type="button"
          className="review-action-button"
          onClick={() =>
            handleSave(
              "saveChanges",
              correctValue || issue.currentValue
            )
          }
        >
          Save changes
        </button>
      </div>
    </section>
  );
}
