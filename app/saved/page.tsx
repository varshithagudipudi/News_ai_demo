import type { Metadata } from 'next';
import { SavedView } from '@/components/SavedView';

export const metadata: Metadata = {
  title: 'Saved articles',
};

export default function SavedPage() {
  return <SavedView />;
}
