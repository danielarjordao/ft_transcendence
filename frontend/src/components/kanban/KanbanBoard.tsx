import { useState } from 'react';
import Navbar from '../layout/Navbar';
import { ProfilePanel } from '../ProfilePanel';
import { useParams } from 'react-router-dom';
import { KanbanColumn } from './KanbanColumn';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import type { Task, Subject } from './TaskCard';

// ── mock data ────────────────────────────────────────────────────────────────

const MOCK_SUBJECTS: Subject[] = [
  { id: 's1', name: 'Backend',  color: '#4A90D9' },
  { id: 's2', name: 'Frontend', color: '#7B68EE' },
  { id: 's3', name: 'DevOps',   color: '#50C878' },
];

const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Setup NestJS project',      subjectId: 's1', status: 'done',        priority: 'high',   assignee: 'murilo_db',  dueDate: '2025-03-10', attachments: [],                                           comments: [{ id: 'c1', author: 'murilo_db', text: 'Done!', ts: 'Mar 10' }], description: 'Initialize NestJS with TypeScript config.' },
  { id: 't2', title: 'Design Prisma schema',       subjectId: 's1', status: 'done',        priority: 'high',   assignee: 'murilo_db',  dueDate: '2025-03-12', attachments: [],                                           comments: [], description: '' },
  { id: 't3', title: 'JWT authentication',         subjectId: 's1', status: 'in_progress', priority: 'high',   assignee: 'daniela_be', dueDate: '2025-03-20', attachments: [{ name: 'auth-flow.png', type: 'image' }],   comments: [{ id: 'c2', author: 'daniela_be', text: 'Working on refresh token logic.', ts: 'Mar 18' }], description: '' },
  { id: 't4', title: 'Kanban board component',     subjectId: 's2', status: 'in_progress', priority: 'medium', assignee: 'lucas_dev',  dueDate: '2025-03-22', attachments: [],                                           comments: [], description: '' },
  { id: 't5', title: 'Login page wireframe',       subjectId: 's2', status: 'done',        priority: 'low',    assignee: 'ana_laura',  dueDate: '2025-03-08', attachments: [{ name: 'wireframe-v1.png', type: 'image' }], comments: [], description: '' },
  { id: 't6', title: 'Docker Compose setup',       subjectId: 's3', status: 'todo',        priority: 'high',   assignee: 'murilo_db',  dueDate: '2025-03-25', attachments: [],                                           comments: [], description: '' },
  { id: 't7', title: 'Socket.io real-time events', subjectId: 's1', status: 'todo',        priority: 'high',   assignee: 'daniela_be', dueDate: '2025-03-28', attachments: [],                                           comments: [], description: '' },
  { id: 't8', title: 'Profile page UI',            subjectId: 's2', status: 'todo',        priority: 'medium', assignee: 'ana_laura',  dueDate: '2025-03-30', attachments: [],                                           comments: [], description: '' },
  { id: 't9', title: 'CI/CD pipeline',             subjectId: 's3', status: 'todo',        priority: 'low',    assignee: undefined,    dueDate: undefined,    attachments: [],                                           comments: [], description: '' },
];

const INITIAL_FIELDS = [
  { id: 'todo',        label: 'To Do',       color: '#888888' },
  { id: 'in_progress', label: 'In Progress', color: '#FFA500' },
  { id: 'done',        label: 'Done',        color: '#50C878' },
];

const PRESET_COLORS = [
  '#7B68EE', '#4A90D9', '#50C878', '#FFA500',
  '#ff6b6b', '#E87D7D', '#9B8EC4', '#4ECDC4',
];

// ── task detail modal ────────────────────────────────────────────────────────

function TaskDetailModal({ task, subjects, onClose, onUpdate }: {
  task: Task;
  subjects: Subject[];
  onClose: () => void;
  onUpdate: (t: Task) => void;
}) {
  const [comment, setComment] = useState('');
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

  return (
    <Modal open onClose={onClose} width={580}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {subject && <span style={{ width: 9, height: 9, borderRadius: '50%', background: subject.color, flexShrink: 0 }} />}
          <span style={{ color: '#888888', fontSize: '12px' }}>{subject?.name}</span>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '18px' }}>✕</button>
      </div>

      <div style={{ padding: '20px 18px', overflowY: 'auto' }}>
        <h2 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
          {task.title}
        </h2>

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
          <p style={{ color: '#888888', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '10px' }}>ATTACHMENTS</p>
          <div style={{ border: '1px dashed #3A3A3A', borderRadius: '6px', padding: '18px', textAlign: 'center', color: '#555555', fontSize: '12px' }}>
            ↑ Click or drag files to attach
          </div>
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
            <Button size="sm" onClick={submitComment}>➤</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── create task modal ────────────────────────────────────────────────────────

function CreateTaskModal({ initialStatus, subjects, onClose, onCreate }: {
  initialStatus: string;
  subjects: Subject[];
  onClose: () => void;
  onCreate: (task: Task) => void;
}) {
  const [title, setTitle]         = useState('');
  const [priority, setPriority]   = useState<Task['priority']>('medium');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [dueDate, setDueDate]     = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      id: `t${Date.now()}`,
      title: title.trim(),
      status: initialStatus,
      priority,
      subjectId,
      dueDate: dueDate || undefined,
      assignee: undefined,
      attachments: [],
      comments: [],
      description: '',
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="New Task" width={420}>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input
          label="Title"
          placeholder="Task title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />

        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Priority</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['high', 'medium', 'low'] as Task['priority'][]).map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${priority === p ? '#7B68EE' : '#3A3A3A'}`, background: priority === p ? '#2D2A4A' : 'transparent', cursor: 'pointer' }}
              >
                <Badge variant={p} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Subject</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSubjectId(s.id)}
                style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${subjectId === s.id ? s.color : '#3A3A3A'}`, background: subjectId === s.id ? '#1A1A2A' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                <span style={{ color: '#F5F5F5', fontSize: '12px' }}>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>Create Task</Button>
        </div>
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
        <Input
          label="Name"
          placeholder="e.g. Design, QA, DevOps..."
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #F5F5F5' : '3px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: '#888888', fontSize: '12px' }}>Preview: </span>
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
    onCreate({
      id: name.trim().toLowerCase().replace(/\s+/g, '_'),
      label: name.trim(),
      color,
    });
  };

  return (
    <Modal open onClose={onClose} title="New Field" width={360}>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Name"
          placeholder="e.g. In Review, Blocked..."
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
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

// ── main page ────────────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const { workspaceId } = useParams();
  const [tasks, setTasks]               = useState<Task[]>(MOCK_TASKS);
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddField, setShowAddField]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [fields, setFields]     = useState(INITIAL_FIELDS);

  const visibleTasks = tasks
    .filter(t => activeSubject ? t.subjectId === activeSubject : true)
    .filter(t => search.trim() ? t.title.toLowerCase().includes(search.toLowerCase()) : true);

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

    return (
    <>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#111111', overflow: 'hidden' }}>
        <Navbar onOpenProfile={() => setProfileOpen(true)} />

        {/* workspace header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ color: '#F5F5F5', fontSize: '16px', fontWeight: 700 }}>{workspaceId ?? 'ft_transcendence'}</h1>
            <p style={{ color: '#888888', fontSize: '12px', marginTop: '2px' }}>42 School final project</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '6px', padding: '7px 12px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'inherit', outline: 'none', width: '200px' }}
            />
            <Button variant="ghost" size="sm">Filter</Button>
            <Button variant="ghost" size="sm">Members</Button>
            <Button size="sm" onClick={() => setCreateStatus('todo')}>+ New Task</Button>
          </div>
        </div>

        {/* subject tabs */}
        <div style={{ padding: '0 20px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => setActiveSubject(null)}
            style={{ padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeSubject === null ? '#7B68EE' : 'transparent'}`, color: activeSubject === null ? '#F5F5F5' : '#888888', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            All
          </button>
          {subjects.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setActiveSubject(activeSubject === s.id ? null : s.id)}
                style={{ padding: '10px 8px 10px 12px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeSubject === s.id ? s.color : 'transparent'}`, color: activeSubject === s.id ? '#F5F5F5' : '#888888', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                {s.name}
              </button>
              <button
                onClick={() => { setSubjects(prev => prev.filter(sub => sub.id !== s.id)); if (activeSubject === s.id) setActiveSubject(null); }}
                style={{ background: 'transparent', border: 'none', color: '#555555', cursor: 'pointer', fontSize: '12px', padding: '0 8px 0 2px', lineHeight: 1 }}>
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowAddSubject(true)}
            style={{ padding: '10px 12px', background: 'transparent', border: 'none', color: '#555555', fontSize: '13px', cursor: 'pointer' }}>
            + Add Subject
          </button>
          <button
            onClick={() => setShowAddField(true)}
            style={{ padding: '10px 12px', background: 'transparent', border: 'none', color: '#555555', fontSize: '13px', cursor: 'pointer' }}>
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
              />
            ))}
          </div>
        </div>

        {/* modals */}
        {showAddSubject && (
          <AddSubjectModal
            onClose={() => setShowAddSubject(false)}
            onCreate={subject => { setSubjects(prev => [...prev, subject]); setShowAddSubject(false); }}
          />
        )}
        {showAddField && (
          <AddFieldModal
            onClose={() => setShowAddField(false)}
            onCreate={field => { setFields(prev => [...prev, field]); setShowAddField(false); }}
          />
        )}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            subjects={subjects}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdate}
          />
        )}
        {createStatus && (
          <CreateTaskModal
            initialStatus={createStatus}
            subjects={subjects}
            onClose={() => setCreateStatus(null)}
            onCreate={handleCreate}
          />
        )}
      </div>
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}