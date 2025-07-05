import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardContent from '@/components/dashboard/DashboardContent';
import ContentForm from '@/components/ContentForm';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showContentForm, setShowContentForm] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  useEffect(() => {
    // Check if create parameter is present in URL
    if (searchParams.get('create') === 'true') {
      setShowContentForm(true);
      // Remove the parameter from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await contentService.getUserContentEntries();
      
      if (error) {
        throw error;
      }
      
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Error al cargar contenido",
        description: "No se pudieron cargar las entradas de contenido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContent = async (entryId: string, platform: string, content: any) => {
    try {
      const { error } = await contentService.updatePlatformContent(entryId, content);
      
      if (error) {
        throw error;
      }
      
      await loadEntries();
      
      toast({
        title: "Contenido actualizado",
        description: "El contenido se ha actualizado correctamente",
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el contenido",
        variant: "destructive",
      });
    }
  };

  const handleUpdateImage = async (entryId: string, imageUrl: string | null) => {
    try {
      const { error } = await contentService.uploadCustomImage(entryId, imageUrl || '');
      
      if (error) {
        throw error;
      }
      
      await loadEntries();
      
      toast({
        title: "Imagen actualizada",
        description: "La imagen se ha actualizado correctamente",
      });
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error al actualizar imagen",
        description: "No se pudo actualizar la imagen",
        variant: "destructive",
      });
    }
  };

  const handleGenerateImage = async (entryId: string, platform: string, topic: string, description: string) => {
    try {
      const { error } = await contentService.generateImageForPlatform(entryId, platform, topic, description);
      
      if (error) {
        throw error;
      }
      
      await loadEntries();
      
      toast({
        title: "Imagen generada",
        description: "La imagen se ha generado correctamente",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error al generar imagen",
        description: "No se pudo generar la imagen",
        variant: "destructive",
      });
    }
  };

  const handleContentSubmit = async (newEntry: any) => {
    try {
      setLoading(true);
      const { error } = await contentService.createContentEntry(newEntry);
      
      if (error) {
        throw error;
      }
      
      await loadEntries();
      setShowContentForm(false);
      
      toast({
        title: "Contenido creado",
        description: "El contenido se ha creado correctamente",
      });
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Error al crear contenido",
        description: "No se pudo crear el contenido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewContent = () => {
    setShowContentForm(true);
  };

  const handleCancelContentForm = () => {
    setShowContentForm(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (showContentForm) {
    return (
      <ContentForm
        onSubmit={handleContentSubmit}
        onCancel={handleCancelContentForm}
      />
    );
  }

  return (
    <DashboardContent
      entries={entries}
      onUpdateContent={handleUpdateContent}
      onUpdateImage={handleUpdateImage}
      onGenerateImage={handleGenerateImage}
      onNewContent={handleNewContent}
    />
  );
};

export default Index;
