import type { Metadata } from 'next';
import { AuthProvider } from '../components/AuthProvider';

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'Manage your tasks with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
