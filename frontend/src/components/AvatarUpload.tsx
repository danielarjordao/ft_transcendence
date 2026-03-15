import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';

// Configuração de validação
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_LABELS = 'JPG, PNG, WEBP ou GIF';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  username?: string;
  onFileSelect: (file: File, previewUrl: string) => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

interface ValidationError {
  type: 'size' | 'format';
  message: string;
}

function validateFile(file: File): ValidationError | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { type: 'format', message: `Formato inválido. Use ${ALLOWED_LABELS}.` };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { type: 'size', message: `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.` };
  }
  return null;
}

function getInitials(username?: string): string {
  if (!username) return '?';
  return username
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const sizeMap = {
  sm: { container: 'w-16 h-16', text: 'text-lg', icon: 16 },
  md: { container: 'w-24 h-24', text: 'text-2xl', icon: 20 },
  lg: { container: 'w-32 h-32', text: 'text-3xl', icon: 24 },
};

export function AvatarUpload({
  currentAvatar,
  username,
  onFileSelect,
  onRemove,
  size = 'lg',
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<ValidationError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { container, text, icon } = sizeMap[size];

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelect(file, url);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onRemove?.();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Área de drop / avatar */}
      <div
        className={`relative ${container} rounded-full cursor-pointer group`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload avatar"
      >
        {/* Avatar ou iniciais */}
        {preview ? (
          <img
            src={preview}
            alt="Avatar preview"
            className={`${container} rounded-full object-cover border-2 ${
              isDragging ? 'border-indigo-400 opacity-60' : 'border-gray-700'
            } transition-all`}
          />
        ) : (
          <div
            className={`${container} rounded-full flex items-center justify-center bg-gray-700 border-2 ${
              isDragging ? 'border-indigo-400' : 'border-gray-600'
            } transition-all`}
          >
            <span className={`${text} font-semibold text-gray-300 select-none`}>
              {getInitials(username)}
            </span>
          </div>
        )}

        {/* Overlay de hover */}
        <div
          className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 transition-opacity ${
            isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {/* Ícone de câmera inline SVG */}
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      </div>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleChange}
        className="hidden"
      />

      {/* Ações */}
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          {preview ? 'Trocar foto' : 'Enviar foto'}
        </button>
        {preview && onRemove && (
          <>
            <span className="text-gray-600">·</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              Remover
            </button>
          </>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="text-xs text-red-400 text-center max-w-[200px]">{error.message}</p>
      )}

      {/* Dica */}
      {!error && (
        <p className="text-xs text-gray-500 text-center">
          Arraste uma imagem ou clique para selecionar
          <br />
          {ALLOWED_LABELS} · máx. {MAX_SIZE_MB}MB
        </p>
      )}
    </div>
  );
}