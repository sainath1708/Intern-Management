import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · Qubenix AI` : 'Qubenix AI · Intern Management System';
  }, [title]);
};
