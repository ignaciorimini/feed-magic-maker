import { useState, useEffect } from 'react';
import { getUserContentEntries, updatePlatformContent } from '@/services/contentService';
import DashboardContent from '@/components/dashboard/DashboardContent';

const Index = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await getUserContentEntries();
      
      if (error) {
        throw error;
      }
      
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContent = async (entryId: string, content: any) => {
    try {
      const { error } = await updatePlatformContent(entryId, content);
      
      if (error) {
        throw error;
      }
      
      await loadEntries();
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  };

  return (
    <DashboardContent 
      entries={entries} 
      loading={loading} 
      onUpdateContent={handleUpdateContent}
      onRefresh={loadEntries}
    />
  );
};

export default Index;
