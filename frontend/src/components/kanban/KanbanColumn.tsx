import { useState } from 'react';
import { TaskCard } from './TaskCard';
import type { Task, Subject } from './TaskCard';

interface KanbanColumnProps {
  fieldId: string;
  label: string;
  color: string;
  tasks: Task[];
  subjects: Subject[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (status: string) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: string) => void;
}

export function KanbanColumn({
  fieldId,
  label,
  color,
  tasks,
  subjects,
  draggingId,
  onDragStart,
  onDragEnd,
  onDrop,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => { setIsDragOver(false); onDrop(fieldId); }}
      style={{
        width: '300px',
        minWidth: '300px',
        background: isDragOver ? '#1F1F2E' : '#111111',
        border: `1px solid ${isDragOver ? '#7B68EE' : '#2A2A2A'}`,
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* barra de cor no topo */}
      <div style={{
        height: '3px',
        background: color,
        borderRadius: '10px 10px 0 0',
        flexShrink: 0,
      }} />

      {/* header da coluna */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px 10px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#F5F5F5', fontSize: '13px', fontWeight: 600 }}>
            {label}
          </span>
          <span style={{
            background: '#2A2A2A',
            color: '#888888',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '10px',
            padding: '1px 7px',
          }}>
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(fieldId)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888888',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: '4px',
          }}
        >
          +
        </button>
      </div>

      {/* lista de tasks */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '0 10px 12px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            subject={subjects.find(s => s.id === task.subjectId)}
            onClick={onTaskClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggingId === task.id}
          />
        ))}

        {tasks.length === 0 && (
          <div style={{
            padding: '20px 0',
            textAlign: 'center',
            color: '#3A3A3A',
            fontSize: '12px',
          }}>
            No tasks here
          </div>
        )}
      </div>
    </div>
  );
}