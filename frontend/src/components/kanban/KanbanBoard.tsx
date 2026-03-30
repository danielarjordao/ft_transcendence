import { useState, useEffect, useRef } from 'react';
import Navbar from '../layout/Navbar';
import { ProfilePanel } from '../ProfilePanel';
import { useParams } from 'react-router-dom';
import { KanbanColumn } from './KanbanColumn';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import type { Task, Subject } from './TaskCard';
import { useWorkspaceStore } from '../../store/workspace.store';
import ChatPanel from '../chat/ChatPanel';
import { useAuth } from '../../contexts/AuthContext';

const PRESET_COLORS = [
  '#7B68EE', '#4A90D9', '#50C878', '#FFA500',
  '#ff6b6b', '#E87D7D', '#9B8EC4', '#4ECDC4',
];

const MOCK_MEMBERS = ['ana_laura', 'lucas_dev', 'daniela_be', 'murilo_db'];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE_MB = 10;

type SortOption = 'none' | 'due_date' | 'priority' | 'created';

interface Filters {
  priority: string[];
  assignee: string[];
  subjectId: string[];
}

interface AttachedFile {
  file: File;
  previewUrl: string | null;
  error: string | null;
}

// ── file utils ────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Tipo não permitido. Use imagens, PDF ou documentos Word.';
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`;
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── attachment zone ───────────────────────────────────────────────────────────

function AttachmentZone({ files, onAdd, onRemove }: {
  files: AttachedFile[];
  onAdd: (files: AttachedFile[]) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFiles = (rawFiles: FileList | null) => {
    if (!rawFiles) return;
    const newFiles: AttachedFile[] = Array.from(rawFiles).map(file => {
      const error = validateFile(file);
      const previewUrl = !error && file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null;
      return { file, previewUrl, error };
    });
    onAdd(newFiles);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(',')}
        style={{ display: 'none' }}
        onChange={e => processFiles(e.target.files)}
      />

      {/* drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
        style={{
          border: `1px dashed ${dragOver ? '#7B68EE' : '#3A3A3A'}`,
          borderRadius: '8px', padding: '20px',
          textAlign: 'center', cursor: 'pointer',
          background: dragOver ? '#7B68EE11' : '#1A1A1A',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#555')}
        onMouseLeave={e => { if (!dragOver) e.currentTarget.style.borderColor = '#3A3A3A'; }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 6 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: 2 }}>Click or drag files here</p>
        <p style={{ color: '#555', fontSize: '11px' }}>Images, PDFs, docs — up to {MAX_SIZE_MB}MB each</p>
      </div>

      {/* file list */}
      {files.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: f.error ? '#2A1010' : '#222222',
              border: `1px solid ${f.error ? '#FF6B6B44' : '#3A3A3A'}`,
            }}>
              {/* preview ou ícone */}
              {f.previewUrl
                ? <img src={f.previewUrl} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 36, height: 36, borderRadius: 4, background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
              }

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: f.error ? '#FF6B6B' : '#F5F5F5', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.file.name}
                </p>
                <p style={{ color: f.error ? '#FF6B6B88' : '#666', fontSize: 11 }}>
                  {f.error ?? formatBytes(f.file.size)}
                </p>
              </div>

              <button
                onClick={() => onRemove(i)}
                style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0, padding: 2 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FF6B6B')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── filter panel ─────────────────────────────────────────────────────────────

function FilterPanel({ filters, subjects, onApply, onClose }: {
  filters: Filters;
  subjects: Subject[];
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Filters>({ ...filters });

  const toggle = (key: keyof Filters, val: string) => {
    setLocal(prev => ({
      ...prev,
      [key]: prev[key].includes(val)
        ? prev[key].filter(v => v !== val)
        : [...prev[key], val],
    }));
  };

  const activeCount = local.priority.length + local.assignee.length + local.subjectId.length;

  const chipStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 20,
    border: `1px solid ${active ? (color ?? '#7B68EE') : '#3A3A3A'}`,
    background: active ? (color ?? '#7B68EE') + '22' : 'transparent',
    color: active ? (color ?? '#F5F5F5') : '#888888',
    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div style={{
        position: 'absolute', top: 'calc(100% + 6px)', right: 0,
        width: 300, background: '#1A1A1A',
        border: '1px solid #3A3A3A', borderRadius: 10,
        zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#EEEEEE', fontSize: 13, fontWeight: 600 }}>Filter tasks</span>
          {activeCount > 0 && (
            <button onClick={() => setLocal({ priority: [], assignee: [], subjectId: [] })}
              style={{ color: '#7B68EE', fontSize: 12, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear all
            </button>
          )}
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <p style={{ color: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Priority</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[{ val: 'high', color: '#FF6B6B' }, { val: 'medium', color: '#FFA500' }, { val: 'low', color: '#888888' }].map(({ val, color }) => (
                <button key={val} onClick={() => toggle('priority', val)} style={chipStyle(local.priority.includes(val), color)}>
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Assignee</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MOCK_MEMBERS.map(m => (
                <button key={m} onClick={() => toggle('assignee', m)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: `1px solid ${local.assignee.includes(m) ? '#7B68EE' : '#2A2A2A'}`, background: local.assignee.includes(m) ? '#7B68EE22' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2A2A2A', border: '1px solid #3A3A3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#CCC', fontSize: 9, fontWeight: 700 }}>{m[0].toUpperCase()}</span>
                  </div>
                  <span style={{ color: local.assignee.includes(m) ? '#F5F5F5' : '#888', fontSize: 13 }}>{m}</span>
                  {local.assignee.includes(m) && <span style={{ marginLeft: 'auto', color: '#7B68EE', fontSize: 14 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {subjects.length > 0 && (
            <div>
              <p style={{ color: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Subject</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {subjects.map(s => (
                  <button key={s.id} onClick={() => toggle('subjectId', s.id)} style={chipStyle(local.subjectId.includes(s.id), s.color)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #2A2A2A', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #3A3A3A', background: 'transparent', color: '#CCC', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => { onApply(local); onClose(); }} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#7B68EE', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </>
  );
}

// ── task detail modal ────────────────────────────────────────────────────────

function TaskDetailModal({ task, subjects, onClose, onUpdate }: {
  task: Task;
  subjects: Subject[];
  onClose: () => void;
  onUpdate: (t: Task) => void;
}) {
  const [comment, setComment] = useState('');
  const [detailFiles, setDetailFiles] = useState<AttachedFile[]>([]);
  const subject = subjects.find(s => s.id === task.subjectId);

  const submitComment = () => {
    if (!comment.trim()) return;
    const updated: Task = {
      ...task,
      comments: [...task.comments, {
        id: `c${Date.now()}`,
        author: 'ana_laura',
        text: comment.trim(),
        ts: 'Just now',
      }],
    };
    onUpdate(updated);
    setComment('');
  };

  const handleAddFiles = (newFiles: AttachedFile[]) => setDetailFiles(prev => [...prev, ...newFiles]);
  const handleRemoveFile = (index: number) => {
    setDetailFiles(prev => {
      const f = prev[index];
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <Modal open onClose={onClose} width={580}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {subject && <span style={{ width: 9, height: 9, borderRadius: '50%', background: subject.color, flexShrink: 0 }} />}
          <span style={{ color: '#888888', fontSize: '12px' }}>{subject?.name}</span>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '18px' }}>✕</button>
      </div>

      <div style={{ padding: '20px 18px', overflowY: 'auto', maxHeight: '70vh' }}>
        <h2 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>{task.title}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#2A2A2A', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
          {[
            { label: 'PRIORITY', value: <Badge variant={task.priority} /> },
            { label: 'STATUS',   value: <Badge variant={task.status} /> },
            { label: 'ASSIGNEE', value: task.assignee
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={task.assignee} size="sm" /><span style={{ color: '#F5F5F5', fontSize: '13px' }}>{task.assignee}</span></div>
                : <span style={{ color: '#888888', fontSize: '13px' }}>Unassigned</span> },
            { label: 'DUE DATE', value: <span style={{ color: '#F5F5F5', fontSize: '13px' }}>{task.dueDate ?? 'No date'}</span> },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#1A1A1A', padding: '12px 14px' }}>
              <p style={{ color: '#888888', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</p>
              {value}
            </div>
          ))}
        </div>

        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
          <p style={{ color: '#888888', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '8px' }}>DESCRIPTION</p>
          <p style={{ color: task.description ? '#F5F5F5' : '#555555', fontSize: '13px', lineHeight: 1.6 }}>
            {task.description || 'No description provided.'}
          </p>
        </div>

        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
          <p style={{ color: '#888888', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '10px' }}>
            ATTACHMENTS {detailFiles.length > 0 && `(${detailFiles.length})`}
          </p>
          <AttachmentZone files={detailFiles} onAdd={handleAddFiles} onRemove={handleRemoveFile} />
        </div>

        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '12px 14px' }}>
          <p style={{ color: '#888888', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '10px' }}>
            COMMENTS ({task.comments.length})
          </p>
          {task.comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <Avatar name={c.author} size="sm" />
              <div>
                <span style={{ color: '#888888', fontSize: '11px' }}>{c.author} · {c.ts}</span>
                <p style={{ color: '#F5F5F5', fontSize: '13px', marginTop: '2px' }}>{c.text}</p>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
              placeholder="Add a comment... (Enter to submit)"
              style={{ flex: 1, background: '#222222', border: '1px solid #3A3A3A', borderRadius: '6px', padding: '8px 12px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
            />
            <button onClick={submitComment} style={{ width: 36, height: 36, borderRadius: '6px', border: 'none', background: '#7B68EE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── create task modal ────────────────────────────────────────────────────────

function CreateTaskModal({ initialStatus, subjects, fields, onClose, onCreate }: {
  initialStatus: string;
  subjects: Subject[];
  fields: { id: string; label: string; color: string }[];
  onClose: () => void;
  onCreate: (task: Task) => void;
}) {
  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [priority, setPriority]   = useState<Task['priority']>('medium');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [assignee, setAssignee]   = useState('');
  const [status, setStatus]       = useState(initialStatus);
  const [dueDate, setDueDate]     = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#888888',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: '6px',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', background: '#222222', border: '1px solid #3A3A3A',
    borderRadius: '8px', padding: '9px 12px', color: '#F5F5F5',
    fontSize: '13px', fontFamily: 'inherit', outline: 'none',
    cursor: 'pointer', appearance: 'none',
  };

  const handleAddFiles = (newFiles: AttachedFile[]) => setAttachedFiles(prev => [...prev, ...newFiles]);
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => {
      const f = prev[index];
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const validFiles = attachedFiles.filter(f => !f.error);
    onCreate({
      id: `t${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      subjectId: subjectId || undefined,
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      attachments: validFiles.map(f => ({ name: f.file.name, type: f.file.type })),
      comments: [],
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Create Task" width={600}>
      <div style={{ padding: '20px 20px 0', overflowY: 'auto', maxHeight: '72vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ ...labelStyle }}>TITLE <span style={{ color: '#FF6B6B' }}>*</span></label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." autoFocus
            style={{ width: '100%', background: '#222222', border: `1px solid ${!title.trim() ? '#3A3A3A' : '#7B68EE'}`, borderRadius: '8px', padding: '10px 12px', color: '#F5F5F5', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Add context..." rows={3}
            style={{ width: '100%', background: '#222222', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>SUBJECT</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} style={selectStyle}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>ASSIGNEE</label>
            <select value={assignee} onChange={e => setAssignee(e.target.value)} style={selectStyle}>
              <option value="">Unassigned</option>
              {MOCK_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>PRIORITY</label>
            <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])} style={selectStyle}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>FIELD</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
              {fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>DUE DATE</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...selectStyle, colorScheme: 'dark' }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>
            ATTACHMENTS {attachedFiles.length > 0 && `(${attachedFiles.filter(f => !f.error).length} válido${attachedFiles.filter(f => !f.error).length !== 1 ? 's' : ''})`}
          </label>
          <AttachmentZone files={attachedFiles} onAdd={handleAddFiles} onRemove={handleRemoveFile} />
        </div>
        <div>
          <label style={labelStyle}>COMMENTS</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder="Add a comment..." style={{ flex: 1, background: '#222222', border: '1px solid #3A3A3A', borderRadius: '6px', padding: '8px 12px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
            <button style={{ width: 36, height: 36, borderRadius: '6px', border: 'none', background: '#2A2A2A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2A2A2A', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} disabled={!title.trim()}>Create Task</Button>
      </div>
    </Modal>
  );
}

// ── add subject modal ────────────────────────────────────────────────────────

function AddSubjectModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (subject: Subject) => void;
}) {
  const [name, setName]   = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ id: `s${Date.now()}`, name: name.trim(), color });
  };

  return (
    <Modal open onClose={onClose} title="New Subject" width={360}>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Design, QA, DevOps..." autoFocus
            style={{ width: '100%', background: '#222222', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F5F5F5', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #F5F5F5' : '3px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: '#F5F5F5', fontSize: '12px', fontWeight: 600 }}>{name || 'Subject name'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create Subject</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── add field modal ──────────────────────────────────────────────────────────

function AddFieldModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (field: { id: string; label: string; color: string }) => void;
}) {
  const [name, setName]   = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ id: name.trim().toLowerCase().replace(/\s+/g, '_'), label: name.trim(), color });
  };

  return (
    <Modal open onClose={onClose} title="New Field" width={360}>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. In Review, Blocked..." autoFocus
            style={{ width: '100%', background: '#222222', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F5F5F5', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #F5F5F5' : '3px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <div style={{ width: 32, height: 3, borderRadius: 2, background: color }} />
            <span style={{ color: '#F5F5F5', fontSize: '12px', fontWeight: 600 }}>{name || 'Field name'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create Field</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── sort utils ────────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  if (sortBy === 'none') return tasks;
  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
    }
    if (sortBy === 'due_date') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'created') {
      const aId = parseInt(a.id.replace('t', ''));
      const bId = parseInt(b.id.replace('t', ''));
      return bId - aId;
    }
    return 0;
  });
}

// ── main page ────────────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const { getBoard, updateBoard, workspaces } = useWorkspaceStore();

  const board = getBoard(workspaceId ?? '');
  const workspace = workspaces.find(w => w.id === workspaceId);

  const [tasks, setTasks]                   = useState<Task[]>(board.tasks);
  const [subjects, setSubjects]             = useState<Subject[]>(board.subjects);
  const [fields, setFields]                 = useState(board.fields);
  const [draggingId, setDraggingId]         = useState<string | null>(null);
  const [selectedTask, setSelectedTask]     = useState<Task | null>(null);
  const [createStatus, setCreateStatus]     = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [activeSubject, setActiveSubject]   = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddField, setShowAddField]     = useState(false);
  const [profileOpen, setProfileOpen]       = useState(false);
  const [chatOpen, setChatOpen]             = useState(false);
  const [filterOpen, setFilterOpen]         = useState(false);
  const [sortBy, setSortBy]                 = useState<SortOption>('none');
  const [sortOpen, setSortOpen]             = useState(false);
  const [filters, setFilters]               = useState<Filters>({ priority: [], assignee: [], subjectId: [] });

  useEffect(() => {
    if (!workspaceId) return;
    updateBoard(workspaceId, { tasks, subjects, fields });
  }, [tasks, subjects, fields, workspaceId]);

  const activeFilterCount = filters.priority.length + filters.assignee.length + filters.subjectId.length;

  const SORT_LABELS: Record<SortOption, string> = {
    none: 'Sort by',
    due_date: 'Due date',
    priority: 'Priority',
    created: 'Created date',
  };

  const filteredTasks = tasks
    .filter(t => activeSubject ? t.subjectId === activeSubject : true)
    .filter(t => search.trim() ? t.title.toLowerCase().includes(search.toLowerCase()) : true)
    .filter(t => filters.priority.length > 0 ? filters.priority.includes(t.priority) : true)
    .filter(t => filters.assignee.length > 0 ? (t.assignee ? filters.assignee.includes(t.assignee) : false) : true)
    .filter(t => filters.subjectId.length > 0 ? (t.subjectId ? filters.subjectId.includes(t.subjectId) : false) : true);

  const visibleTasks = sortTasks(filteredTasks, sortBy);

  const handleDrop = (newStatus: string) => {
    if (!draggingId) return;
    setTasks(prev => prev.map(t => t.id === draggingId ? { ...t, status: newStatus } : t));
    setDraggingId(null);
  };

  const handleCreate = (task: Task) => setTasks(prev => [...prev, task]);

  const handleUpdate = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const removeFilter = (key: keyof Filters, val: string) => {
    setFilters(prev => ({ ...prev, [key]: prev[key].filter(v => v !== val) }));
  };

  return (
    <>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#111111', overflow: 'hidden' }}>
        <Navbar onOpenProfile={() => setProfileOpen(true)} onOpenChat={() => setChatOpen(true)} />

        {/* workspace header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ color: '#F5F5F5', fontSize: '16px', fontWeight: 700 }}>
              {workspace?.name ?? workspaceId ?? 'Workspace'}
            </h1>
            <p style={{ color: '#888888', fontSize: '12px', marginTop: '2px' }}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '6px', padding: '7px 12px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'inherit', outline: 'none', width: '200px' }}
            />

            {/* filter */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setFilterOpen(o => !o); setSortOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 7, border: `1px solid ${filterOpen || activeFilterCount > 0 ? '#7B68EE' : '#2A2A2A'}`, background: filterOpen ? '#7B68EE22' : activeFilterCount > 0 ? '#7B68EE11' : 'transparent', color: activeFilterCount > 0 ? '#7B68EE' : '#888', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              {filterOpen && <FilterPanel filters={filters} subjects={subjects} onApply={setFilters} onClose={() => setFilterOpen(false)} />}
            </div>

            {/* sort */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setSortOpen(o => !o); setFilterOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 7, border: `1px solid ${sortOpen || sortBy !== 'none' ? '#7B68EE' : '#2A2A2A'}`, background: sortOpen ? '#7B68EE22' : sortBy !== 'none' ? '#7B68EE11' : 'transparent', color: sortBy !== 'none' ? '#7B68EE' : '#888', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
                </svg>
                {SORT_LABELS[sortBy]}
              </button>

              {sortOpen && (
                <>
                  <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 180, background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 10, zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    {(['none', 'due_date', 'priority', 'created'] as SortOption[]).map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setSortBy(opt); setSortOpen(false); }}
                        style={{ width: '100%', padding: '10px 14px', background: sortBy === opt ? '#7B68EE22' : 'transparent', border: 'none', color: sortBy === opt ? '#7B68EE' : '#CCC', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit', textAlign: 'left' }}
                        onMouseEnter={e => { if (sortBy !== opt) e.currentTarget.style.background = '#222'; }}
                        onMouseLeave={e => { if (sortBy !== opt) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {SORT_LABELS[opt]}
                        {sortBy === opt && <span style={{ fontSize: 12 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Button variant="ghost" size="sm">Members</Button>
            <Button size="sm" onClick={() => setCreateStatus('todo')}>+ New Task</Button>
          </div>
        </div>

        {/* active filter tags */}
        {activeFilterCount > 0 && (
          <div style={{ padding: '8px 20px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            <span style={{ color: '#555', fontSize: 11, marginRight: 2 }}>Filtered by:</span>
            {filters.priority.map(p => (
              <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, background: '#2A2A2A', border: '1px solid #3A3A3A', fontSize: 11, color: '#CCC' }}>
                {p}
                <button onClick={() => removeFilter('priority', p)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 12 }}>✕</button>
              </span>
            ))}
            {filters.assignee.map(a => (
              <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, background: '#2A2A2A', border: '1px solid #3A3A3A', fontSize: 11, color: '#CCC' }}>
                @{a}
                <button onClick={() => removeFilter('assignee', a)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 12 }}>✕</button>
              </span>
            ))}
            {filters.subjectId.map(sid => {
              const s = subjects.find(s => s.id === sid);
              return s ? (
                <span key={sid} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, background: '#2A2A2A', border: `1px solid ${s.color}44`, fontSize: 11, color: '#CCC' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                  {s.name}
                  <button onClick={() => removeFilter('subjectId', sid)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 12 }}>✕</button>
                </span>
              ) : null;
            })}
            <button onClick={() => setFilters({ priority: [], assignee: [], subjectId: [] })} style={{ marginLeft: 4, color: '#7B68EE', fontSize: 11, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear all
            </button>
          </div>
        )}

        {/* subject tabs */}
        <div style={{ padding: '0 20px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button onClick={() => setActiveSubject(null)}
            style={{ padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeSubject === null ? '#7B68EE' : 'transparent'}`, color: activeSubject === null ? '#F5F5F5' : '#888888', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            All
          </button>
          {subjects.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setActiveSubject(activeSubject === s.id ? null : s.id)}
                style={{ padding: '10px 8px 10px 12px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeSubject === s.id ? s.color : 'transparent'}`, color: activeSubject === s.id ? '#F5F5F5' : '#888888', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                {s.name}
              </button>
              <button onClick={() => { setSubjects(prev => prev.filter(sub => sub.id !== s.id)); if (activeSubject === s.id) setActiveSubject(null); }}
                style={{ background: 'transparent', border: 'none', color: '#555555', cursor: 'pointer', fontSize: '12px', padding: '0 8px 0 2px', lineHeight: 1 }}>
                ✕
              </button>
            </div>
          ))}
          <button onClick={() => setShowAddSubject(true)} style={{ padding: '10px 12px', background: 'transparent', border: 'none', color: '#555555', fontSize: '13px', cursor: 'pointer' }}>
            + Add Subject
          </button>
          <button onClick={() => setShowAddField(true)} style={{ padding: '10px 12px', background: 'transparent', border: 'none', color: '#555555', fontSize: '13px', cursor: 'pointer' }}>
            + Add Field
          </button>
        </div>

        {/* columns */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', minWidth: 'max-content', height: '100%' }}>
            {fields.map(f => (
              <KanbanColumn
                key={f.id}
                fieldId={f.id}
                label={f.label}
                color={f.color}
                tasks={visibleTasks.filter(t => t.status === f.id)}
                subjects={subjects}
                draggingId={draggingId}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
                onDrop={handleDrop}
                onTaskClick={setSelectedTask}
                onAddTask={setCreateStatus}
                onDeleteField={id => setFields(prev => prev.filter(f => f.id !== id))}
                onDeleteTask={id => setTasks(prev => prev.filter(t => t.id !== id))}
              />
            ))}
          </div>
        </div>

        {showAddSubject && <AddSubjectModal onClose={() => setShowAddSubject(false)} onCreate={subject => { setSubjects(prev => [...prev, subject]); setShowAddSubject(false); }} />}
        {showAddField && <AddFieldModal onClose={() => setShowAddField(false)} onCreate={field => { setFields(prev => [...prev, field]); setShowAddField(false); }} />}
        {selectedTask && <TaskDetailModal task={selectedTask} subjects={subjects} onClose={() => setSelectedTask(null)} onUpdate={handleUpdate} />}
        {createStatus !== null && <CreateTaskModal initialStatus={createStatus} subjects={subjects} fields={fields} onClose={() => setCreateStatus(null)} onCreate={handleCreate} />}
      </div>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} currentUserId={user?.id || '1'} />
    </>
  );
}