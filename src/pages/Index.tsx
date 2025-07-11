
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

  // Placeholder functions for required props
  const handleNewContent = () => {
    // Navigate to content creation or open modal
    console.log('New content creation');
  };

  const handleDeletePlatform = (platformId: string) => {
    console.log('Delete platform:', platformId);
    // Implementation for deleting platform
  };

  const handleDownloadSlides = (entryId: string, slidesURL: string) => {
    console.log('Download slides:', entryId, slidesURL);
    // Implementation for downloading slides
  };

  const handleGenerateImage = (platformId: string, platform: string, topic: string, description: string) => {
    console.log('Generate image:', platformId, platform, topic, description);
    // Implementation for generating image
  };

  const handleUploadImage = (platformId: string, file: File) => {
    console.log('Upload image:', platformId, file);
    // Implementation for uploading image
  };

  const handleDeleteImage = (platformId: string, imageUrl: string, isUploaded: boolean) => {
    console.log('Delete image:', platformId, imageUrl, isUploaded);
    // Implementation for deleting image
  };

  const handleUpdateImage = async (entryId: string, imageUrl: string | null) => {
    console.log('Update image:', entryId, imageUrl);
    // Implementation for updating image
    return Promise.resolve();
  };

  return (
    <DashboardContent 
      entries={entries} 
      selectedPlatforms={['instagram', 'linkedin', 'wordpress', 'twitter']}
      loading={loading} 
      onNewContent={handleNewContent}
      onUpdateContent={handleUpdateContent}
      onDeletePlatform={handleDeletePlatform}
      onDownloadSlides={handleDownloadSlides}
      onGenerateImage={handleGenerateImage}
      onUploadImage={handleUploadImage}
      onDeleteImage={handleDeleteImage}
      onReloadEntries={loadEntries}
      onUpdateImage={handleUpdateImage}
    />
  );
};

export default Index;
