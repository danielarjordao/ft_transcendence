import { useState, useRef, useEffect } from 'react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: string;
  subjectId?: string;
  attachments: { name: string; type: string }[];
  comments: { id: string; author: string; text: string; ts: string }[];
  description?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

interface TaskCardProps {
  task: Task;
  subject?: Subject;
  onClick: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function TaskCard({
  task,
  subject,
  onClick,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [hov, setHov] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const handleMenuOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.top + 28,
      left: rect.right - 160,
    });
    setMenuOpen(o => !o);
  };

  return (
    <>
      <div
        draggable
        onDragStart={() => onDragStart(task.id)}
        onDragEnd={onDragEnd}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => { if (!menuOpen) onClick(task); }}
        style={{
          background: '#1A1A1A',
          border: `1px solid ${isDragging ? '#7B68EE' : hov ? '#3A3A3A' : '#2A2A2A'}`,
          borderRadius: '8px',
          padding: '12px',
          cursor: 'grab',
          opacity: isDragging ? 0.5 : 1,
          transition: 'border-color 0.15s, opacity 0.15s',
          position: 'relative',
        }}
      >
        {/* 3-dot menu button */}
        <button
          ref={btnRef}
          onClick={handleMenuOpen}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 24, height: 24,
            borderRadius: 5,
            border: 'none',
            background: menuOpen ? '#2A2A2A' : 'transparent',
            color: '#888',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hov || menuOpen ? 1 : 0,
            transition: 'opacity 0.15s',
            padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2A2A2A')}
          onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="12" cy="19" r="2"/>
          </svg>
        </button>

        {/* subject badge */}
        {subject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: subject.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#888888' }}>{subject.name}</span>
          </div>
        )}

        {/* title */}
        <p style={{
          color: '#F5F5F5', fontSize: '13px', lineHeight: 1.4,
          marginBottom: '10px', paddingRight: '20px',
        }}>
          {task.title}
        </p>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Badge variant={task.priority} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {task.attachments.length > 0 && (
              <span style={{ fontSize: '10px', color: '#888888', display: 'flex', alignItems: 'center', gap: '3px' }}>
                📎 {task.attachments.length}
              </span>
            )}
            {task.comments.length > 0 && (
              <span style={{ fontSize: '10px', color: '#888888', display: 'flex', alignItems: 'center', gap: '3px' }}>
                💬 {task.comments.length}
              </span>
            )}
            {task.assignee && <Avatar name={task.assignee} size="sm" />}
          </div>
        </div>

        {task.dueDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
            <span style={{ fontSize: '10px', color: '#888888' }}>📅 {task.dueDate}</span>
          </div>
        )}
      </div>

      {/* dropdown fora do card — escapa do overflow da coluna */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            width: 160,
            background: '#222222',
            border: '1px solid #3A3A3A',
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 9999,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(false); onClick(task); }}
            style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#CCCCCC', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2A2A2A')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Open task
          </button>

          <div style={{ height: 1, background: '#2A2A2A' }} />

          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(task.id); }}
            style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#FF6B6B', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2A1010')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </>
  );
}