import { useState } from 'react';
import { AvatarUpload } from '../components/AvatarUpload';
import { useAuth } from '../contexts/AuthContext';

interface ProfileForm {
  fullName: string;
  username: string;
  bio: string;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  bio?: string;
}

function validate(form: ProfileForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.fullName.trim()) errors.fullName = 'Nome completo é obrigatório.';
  else if (form.fullName.trim().length < 3) errors.fullName = 'Mínimo 3 caracteres.';

  if (!form.username.trim()) errors.username = 'Username é obrigatório.';
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username))
    errors.username = 'Entre 3 e 20 caracteres. Apenas letras, números e _.';

  if (form.bio.length > 160) errors.bio = 'Máximo 160 caracteres.';

  return errors;
}

export default function Profile() {
  const { user } = useAuth();

  const [form, setForm] = useState<ProfileForm>({
    fullName: user?.fullName ?? '',
    username: user?.username ?? '',
    bio: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // limpa o erro do campo ao digitar
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setSaved(false);
  };

  const handleSubmit = () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // TODO: chamar PATCH /api/users/me com form + avatarFile
    // const formData = new FormData();
    // formData.append('fullName', form.fullName);
    // formData.append('username', form.username);
    // formData.append('bio', form.bio);
    // if (avatarFile) formData.append('avatar', avatarFile);
    // await api.patch('/users/me', formData);

    console.log('Salvar perfil:', { ...form, avatarFile });
    setSaved(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-8 text-white">Meu Perfil</h1>

        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <AvatarUpload
            username={form.username || user?.username}
            onFileSelect={(file) => {
              setAvatarFile(file);
              setSaved(false);
            }}
            onRemove={() => setAvatarFile(null)}
            size="lg"
          />
        </div>

        {/* Campos */}
        <div className="flex flex-col gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Seu nome"
              className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="seu_username"
              className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500 ${
                errors.username ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Bio
              <span className="ml-2 text-gray-600 font-normal">
                {form.bio.length}/160
              </span>
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Uma frase sobre você (opcional)"
              rows={3}
              className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none resize-none transition-colors focus:border-indigo-500 ${
                errors.bio ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-red-400">{errors.bio}</p>
            )}
          </div>

          {/* Botão */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Salvar alterações
          </button>

          {saved && (
            <p className="text-center text-sm text-green-400">Perfil salvo com sucesso.</p>
          )}
        </div>
      </div>
    </div>
  );
}