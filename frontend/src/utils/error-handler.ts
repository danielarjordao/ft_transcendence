export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  // Erro Axios com resposta do backend
  if (isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg[0]; // NestJS validation errors
    
    // Erros HTTP conhecidos sem mensagem do backend
    switch (err.response?.status) {
      case 400: return 'Invalid request.';
      case 401: return 'Session expired. Please log in again.';
      case 403: return 'You don\'t have permission to do this.';
      case 404: return 'Not found.';
      case 409: return 'Conflict: this already exists.';
      case 429: return 'Too many requests. Wait a moment.';
      case 500: return 'Server error. Try again later.';
    }
  }
  
  // Erro JS normal
  if (err instanceof Error) return err.message;
  
  return fallback;
}