import { useEffect, useState } from "react";
import AccordionSection from "../components/setting/AccordionSection.jsx";
import FormField from "../components/setting/FormField.jsx";
import Toast from "../components/setting/Toast.jsx";
import { changePassword as changeAccountPassword } from "../api/authApi.js";
import { getMyCandidateRecord, updateMyCandidateRecord } from "../api/candidateApi.js";
import { countries } from "../data/countries.js";
import { useToast } from "../hooks/useToast.js";
import "../css/setting.css";

function EyeButton({ visible, onClick, target }) {
  return (
    <button
      className="eye"
      type="button"
      onClick={onClick}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-controls={target}
    >
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.7 6.7C3.8 8.5 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function toEditableProfile(candidate) {
  const [firstName = "", ...lastNameParts] = (candidate.fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
    email: candidate.email || "",
    phone: candidate.phone || "",
    country: candidate.location || "",
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
  });
  const [savedProfile, setSavedProfile] = useState(profile);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(true);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);
  const { message, showToast } = useToast();

  useEffect(() => {
    let active = true;

    async function loadCandidateProfile() {
      setLoading(true);
      setLoadError("");
      try {
        const record = await getMyCandidateRecord();
        const loadedProfile = toEditableProfile(record);
        if (active) {
          setCandidate(record);
          setProfile(loadedProfile);
          setSavedProfile(loadedProfile);
        }
      } catch (error) {
        if (active) setLoadError(error.message || "Unable to load your candidate profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCandidateProfile();
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const profileDirty = Object.keys(profile).some(
    (key) => profile[key] !== savedProfile[key],
  );
  const matchingCountry = countries.find(
    (country) =>
      country.isoCode.toLowerCase() === profile.country.toLowerCase()
      || country.name.toLowerCase() === profile.country.toLowerCase(),
  );
  const countrySelectValue = matchingCountry?.name ?? profile.country;

  function setProfileField(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
    setProfileErrors((current) => ({
      ...current,
      ...(key === "firstName" ? { firstName: "" } : {}),
      api: "",
    }));
  }

  async function saveProfile() {
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    const errors = {
      firstName: firstName ? "" : "Enter your first name.",
    };
    setProfileErrors(errors);
    if (errors.firstName) return;

    setSavingProfile(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const candidateChanges = {};
      if (candidate.fullName !== fullName) candidateChanges.fullName = fullName;
      if ((candidate.phone || "") !== profile.phone) {
        candidateChanges.phone = profile.phone.trim() || null;
      }
      if ((candidate.location || "") !== profile.country) {
        candidateChanges.location = profile.country.trim() || null;
      }

      const updatedCandidate = Object.keys(candidateChanges).length
        ? await updateMyCandidateRecord(candidateChanges, candidate.version)
        : candidate;
      const saved = toEditableProfile(updatedCandidate);
      setCandidate(updatedCandidate);
      setProfile(saved);
      setSavedProfile(saved);
      showToast("Changes saved.");
    } catch (error) {
      setProfileErrors((current) => ({
        ...current,
        api: error.message || "Unable to save your candidate profile.",
      }));
    } finally {
      setSavingProfile(false);
    }
  }

  function cancelProfile() {
    setProfile(savedProfile);
    setProfileErrors({});
  }

  function setPasswordField(key, value) {
    setPasswords((current) => ({ ...current, [key]: value }));
    setPasswordErrors((current) => ({ ...current, [key]: "", api: "" }));
  }

  async function savePassword() {
    const { current, next, confirm } = passwords;
    const errors = {
      current: current ? "" : "Enter your current password.",
      next: !next
        ? "Enter a new password."
        : next.length < 10 || !(/[0-9]|[^A-Za-z0-9\s]/.test(next))
          ? "Use at least 10 characters with a number or symbol."
          : next === current
            ? "Choose a password different from your current one."
            : "",
      confirm: !confirm
        ? "Confirm your new password."
        : confirm !== next
          ? "Passwords don't match."
          : "",
    };
    setPasswordErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSavingPassword(true);
    try {
      await changeAccountPassword(current, next);
      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordErrors({});
      showToast("Password updated. Other sessions have been signed out.");
    } catch (error) {
      setPasswordErrors((current) => ({
        ...current,
        api: error.message || "Unable to change your password.",
      }));
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="settings-page app">
        <p className="loading-state">Loading candidate profile…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="settings-page app">
        <div className="wrap">
          <p className="api-error" role="alert">{loadError}</p>
          <button
            className="btn p"
            type="button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="settings-page app">
      <main className="wrap">
        <h1>Settings</h1>
        <p className="desc">Manage your candidate contact information and password.</p>

        <AccordionSection
          id="personal"
          icon="👤"
          title="Personal Information"
          subtitle="Name, email, phone and country"
          open={personalOpen}
          onToggle={() => setPersonalOpen((open) => !open)}
          dirty={profileDirty}
        >
          <div className="grid">
            <FormField id="fn" label="First name" error={profileErrors.firstName}>
              <input
                id="fn"
                autoComplete="given-name"
                value={profile.firstName}
                onChange={(event) => setProfileField("firstName", event.target.value)}
              />
            </FormField>
            <FormField id="ln" label="Last name">
              <input
                id="ln"
                autoComplete="family-name"
                value={profile.lastName}
                onChange={(event) => setProfileField("lastName", event.target.value)}
              />
            </FormField>
            <FormField
              id="em"
              label="Email address"
              full
              locked
              help="Your account email is read-only here."
            >
              <span aria-hidden="true">🔒</span>
              <input
                id="em"
                type="email"
                autoComplete="email"
                readOnly
                aria-readonly="true"
                value={profile.email}
              />
            </FormField>
            <FormField id="phone" label="Phone number">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                value={profile.phone}
                onChange={(event) => setProfileField("phone", event.target.value)}
                placeholder="Phone number"
              />
            </FormField>
            <FormField id="co" label="Country">
              <select
                id="co"
                value={countrySelectValue}
                onChange={(event) => setProfileField("country", event.target.value)}
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.isoCode} value={country.name}>
                    {country.name}
                  </option>
                ))}
                {profile.country && !matchingCountry && (
                  <option value={profile.country}>{profile.country}</option>
                )}
              </select>
            </FormField>
          </div>
          {profileErrors.api && <p className="api-error" role="alert">{profileErrors.api}</p>}
          <div className="actions">
            <button
              className="btn"
              type="button"
              disabled={!profileDirty || savingProfile}
              onClick={cancelProfile}
            >
              Cancel
            </button>
            <button
              className="btn p"
              type="button"
              disabled={!profileDirty || savingProfile}
              onClick={saveProfile}
            >
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>
        </AccordionSection>

        <AccordionSection
          id="security"
          icon="🔒"
          title="Security"
          subtitle="Change your password"
          open={securityOpen}
          onToggle={() => setSecurityOpen((open) => !open)}
        >
          <p className="security-intro">
            Verify your current password before choosing a new one.
          </p>
          <div className="grid">
            <FormField id="current-password" label="Current password" full error={passwordErrors.current}>
              <input
                id="current-password"
                type={visiblePasswords.current ? "text" : "password"}
                autoComplete="current-password"
                maxLength={128}
                value={passwords.current}
                onChange={(event) => setPasswordField("current", event.target.value)}
              />
              <EyeButton
                target="current-password"
                visible={Boolean(visiblePasswords.current)}
                onClick={() => setVisiblePasswords((current) => ({
                  ...current,
                  current: !current.current,
                }))}
              />
            </FormField>
            <FormField id="new-password" label="New password" error={passwordErrors.next}>
              <input
                id="new-password"
                type={visiblePasswords.next ? "text" : "password"}
                autoComplete="new-password"
                maxLength={128}
                value={passwords.next}
                onChange={(event) => setPasswordField("next", event.target.value)}
              />
              <EyeButton
                target="new-password"
                visible={Boolean(visiblePasswords.next)}
                onClick={() => setVisiblePasswords((current) => ({
                  ...current,
                  next: !current.next,
                }))}
              />
            </FormField>
            <FormField id="confirm-password" label="Confirm new password" error={passwordErrors.confirm}>
              <input
                id="confirm-password"
                type={visiblePasswords.confirm ? "text" : "password"}
                autoComplete="new-password"
                maxLength={128}
                value={passwords.confirm}
                onChange={(event) => setPasswordField("confirm", event.target.value)}
              />
              <EyeButton
                target="confirm-password"
                visible={Boolean(visiblePasswords.confirm)}
                onClick={() => setVisiblePasswords((current) => ({
                  ...current,
                  confirm: !current.confirm,
                }))}
              />
            </FormField>
          </div>
          <p className="help">Use at least 10 characters and include a number or symbol.</p>
          {passwordErrors.api && <p className="api-error" role="alert">{passwordErrors.api}</p>}
          <div className="actions">
            <button
              className="btn p"
              type="button"
              disabled={
                savingPassword
                || (!passwords.current && !passwords.next && !passwords.confirm)
              }
              onClick={savePassword}
            >
              {savingPassword ? "Changing…" : "Change password"}
            </button>
          </div>
        </AccordionSection>
      </main>
      <Toast message={message} />
    </div>
  );
}
