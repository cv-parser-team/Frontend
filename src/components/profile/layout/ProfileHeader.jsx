import { Camera, Check, Clock, Mail, MapPin, Pencil, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Badge from '../ui/Badge';
import InIcon from '../ui/InIcon';
import CompletionCard from './CompletionCard';

export default function ProfileHeader({ profile: pr, hasIssues, comp, onEdit, onAct }) {
  const fileInputRef = useRef(null);
  const [photo, setPhoto] = useState('');
  const [photoError, setPhotoError] = useState('');
  const initials = pr.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const liHref = /^https?:\/\//i.test(pr.linkedin) ? pr.linkedin : `https://${pr.linkedin}`;

  useEffect(() => {
    const savedPhoto = window.localStorage.getItem('lumina:profile-photo');
    if (savedPhoto) setPhoto(savedPhoto);
  }, []);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Choose an image smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result || '');
      setPhoto(image);
      setPhotoError('');
      window.localStorage.setItem('lumina:profile-photo', image);
      window.dispatchEvent(new CustomEvent('lumina:profile-photo-updated', {
        detail: { photo: image },
      }));
    };
    reader.onerror = () => setPhotoError('Unable to read this image.');
    reader.readAsDataURL(file);
  };

  return (
    <header className="card hdr">
      <button className="ib edit" aria-label="Edit profile" title="Edit profile" onClick={onEdit}><Pencil size={18} /></button>
      <div className="profile-photo-wrap">
        {photo
          ? <img className="avatar profile-photo" src={photo} alt={pr.fullName || 'Profile'} />
          : <div className="avatar" aria-label={pr.fullName || 'Profile'}>{initials}</div>}
        <button
          type="button"
          className="profile-photo-upload"
          aria-label="Change profile photo"
          title="Change profile photo"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera size={14}/>
        </button>
        <input
          ref={fileInputRef}
          className="profile-photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
        />
        {photoError && <span className="profile-photo-error" role="alert">{photoError}</span>}
      </div>
      <div>
        <div className="nm">
          <h1>{pr.fullName}</h1>
          {hasIssues
            ? <Badge icon={<Clock size={14} />}>Needs Review</Badge>
            : <Badge tone="green" icon={<Check size={14} />}>Reviewed</Badge>}
        </div>
        <p className="role">{pr.title}</p>
        <div className="contact">
          {pr.email && (
            <a href={`mailto:${pr.email}`} className="contact-link">
              <Mail size={16} />
              <span>{pr.email}</span>
            </a>
          )}
          {pr.location && (
            <span>
              <MapPin size={16} />
              <span>{pr.location}</span>
            </span>
          )}
          {pr.phone && (
            <a href={`tel:${pr.phone.replace(/\s+/g, '')}`} className="contact-link">
              <Phone size={16} />
              <span>{pr.phone}</span>
            </a>
          )}
        </div>
        {pr.linkedin && <a className="li" href={liHref} target="_blank" rel="noopener noreferrer"><InIcon />{pr.linkedin}</a>}
        <div className="tags">{[pr.employment, ...(pr.tags || [])].filter(Boolean).map((t) => <span key={t}>{t}</span>)}</div>
      </div>
      <CompletionCard comp={comp} onAct={onAct} />
    </header>
  );
}
