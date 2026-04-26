export function checkAuth(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@theraease.vn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  return email === adminEmail && password === adminPassword;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('admin_authenticated') === 'true';
}

export function setAuthenticated(value: boolean) {
  if (typeof window === 'undefined') return;
  if (value) {
    localStorage.setItem('admin_authenticated', 'true');
  } else {
    localStorage.removeItem('admin_authenticated');
  }
}
