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
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function TaskCard({
  task,
  subject,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
}: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task)}
      style={{
        background: '#1A1A1A',
        border: `1px solid ${isDragging ? '#7B68EE' : '#2A2A2A'}`,
        borderRadius: '8px',
        padding: '12px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'border-color 0.15s, opacity 0.15s',
        position: 'relative',
      }}
    >
      {subject && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginBottom: '6px',
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: subject.color,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '11px', color: '#888888' }}>
            {subject.name}
          </span>
        </div>
      )}

      <p style={{
        color: '#F5F5F5',
        fontSize: '13px',
        lineHeight: 1.4,
        marginBottom: '10px',
        paddingRight: '4px',
      }}>
        {task.title}
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
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
          {task.assignee && (
            <Avatar name={task.assignee} size="sm" />
          )}
        </div>
      </div>

      {task.dueDate && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '8px',
        }}>
          <span style={{ fontSize: '10px', color: '#888888' }}>
            📅 {task.dueDate}
          </span>
        </div>
      )}
    </div>
  );
}