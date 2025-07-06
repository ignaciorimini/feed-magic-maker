
import { FileText, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatsOverview from '@/components/StatsOverview';
import PlatformCard from '@/components/PlatformCard';

interface DashboardContentProps {
  entries: any[];
  selectedPlatforms: string[];
  loading: boolean;
  onNewContent: () => void;
  onUpdateContent: (entryId: string, platform: string, content: any) => Promise<void>;
  onDeletePlatform: (platformId: string) => void;
  onDownloadSlides: (entryId: string, slidesURL: string) => void;
  onGenerateImage: (platformId: string, platform: string, topic: string, description: string) => void;
  onUploadImage: (platformId: string, file: File) => void;
  onDeleteImage: (platformId: string, imageUrl: string, isUploaded: boolean) => void;
  onReloadEntries?: () => void;
  onUpdateImage: (entryId: string, imageUrl: string | null) => Promise<void>;
}

const DashboardContent = ({
  entries,
  selectedPlatforms,
  loading,
  onNewContent,
  onUpdateContent,
  onDeletePlatform,
  onDownloadSlides,
  onGenerateImage,
  onUploadImage,
  onDeleteImage,
  onReloadEntries,
  onUpdateImage
}: DashboardContentProps) => {
  // Transform entries to create individual platform cards only for platforms that have content
  const platformCards = entries.flatMap(entry => {
    const cards = [];
    
    // Only create cards for platforms that actually have content in this entry
    if (entry.platformContent) {
      Object.keys(entry.platformContent).forEach(platform => {
        const platformKey = platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
        const platformContent = entry.platformContent[platformKey];
        
        // For WordPress, check if we have content or title (WordPress posts)
        // For other platforms, check if we have text or images
        const hasContent = platformKey === 'wordpress' 
          ? (platformContent && (platformContent.title || platformContent.content || platformContent.text))
          : (platformContent && (platformContent.text || (platformContent.images && platformContent.images.length > 0)));
        
        if (hasContent) {
          // Get slide images for this platform from the entry data
          const platformSlideImages = entry.platforms?.find(p => p.platform === platformKey)?.slide_images || [];
          
          // Convert content_type to display format
          let displayType = entry.type;
          if (platformContent.contentType === 'simple') {
            displayType = 'Simple Post';
          } else if (platformContent.contentType === 'slide') {
            displayType = 'Slide Post';
          } else if (platformContent.contentType === 'article') {
            displayType = 'Article';
          }
          
          cards.push({
            ...entry,
            platform: platformKey,
            id: `${entry.id}__${platform}`, // Use __ separator to avoid UUID conflicts
            // Override the type with the platform-specific content type for display
            type: displayType,
            // Keep the original content type for logic
            contentType: platformContent.contentType || 'simple',
            // Add slide images from database
            slideImages: platformSlideImages.sort((a, b) => a.position - b.position).map(img => img.image_url)
          });
        }
      });
    }
    
    return cards;
  });

  const handleDownloadSlides = async (entryId: string, slidesURL: string) => {
    // Extract the original entry ID and get the topic
    const originalEntryId = entryId.split('__')[0];
    const entry = entries.find(e => e.id === originalEntryId);
    
    if (!entry) {
      console.error('Entry not found for slides download');
      return;
    }

    console.log('=== DASHBOARD DOWNLOAD SLIDES ===');
    console.log('Entry ID:', entryId);
    console.log('Slides URL:', slidesURL);
    console.log('Topic:', entry.topic);
    
    if (onDownloadSlides) {
      onDownloadSlides(entryId, slidesURL);
    }
  };

  const handleUpdateStatus = async (entryId: string, platform: string, newStatus: 'published' | 'pending' | 'error') => {
    // Extract the original entry ID using the new separator
    const originalEntryId = entryId.split('__')[0];
    console.log('=== UPDATE STATUS DEBUG ===');
    console.log('Entry ID received:', entryId);
    console.log('Extracted original entry ID:', originalEntryId);
    console.log('Original ID length:', originalEntryId.length);
    console.log('Platform:', platform, 'Status:', newStatus);
    
    // Validate extracted ID is a complete UUID
    if (!originalEntryId || originalEntryId.length !== 36 || !originalEntryId.includes('-')) {
      console.error('Invalid extracted entry ID format:', originalEntryId);
      return;
    }
    
    // Status updates would need to be handled by the parent component
  };

  const handleUpdateLink = async (entryId: string, platform: string, link: string) => {
    // Extract the original entry ID using the new separator
    const originalEntryId = entryId.split('__')[0];
    console.log('=== UPDATE LINK DEBUG ===');
    console.log('Entry ID received:', entryId);
    console.log('Extracted original entry ID:', originalEntryId);
    console.log('Original ID length:', originalEntryId.length);
    console.log('Platform:', platform, 'Link:', link);
    
    // Validate extracted ID is a complete UUID
    if (!originalEntryId || originalEntryId.length !== 36 || !originalEntryId.includes('-')) {
      console.error('Invalid extracted entry ID format:', originalEntryId);
      return;
    }
    
    // Link updates would need to be handled by the parent component
  };

  // Handle platform deletion instead of entry deletion
  const handleDeletePlatform = (platformId: string, platform: string) => {
    console.log('=== DELETE PLATFORM DEBUG ===');
    console.log('Platform ID received:', platformId);
    console.log('Platform:', platform);
    
    // Validate platform ID format
    if (!platformId || !platformId.includes('__')) {
      console.error('Invalid platform ID format:', platformId);
      return;
    }
    
    console.log('✅ Passing platform ID to delete function:', platformId);
    onDeletePlatform(platformId);
  };

  const handleUpdateImage = async (entryId: string, imageUrl: string | null) => {
    // Extract the original entry ID using the new separator
    const originalEntryId = entryId.split('__')[0];
    console.log('=== UPDATE IMAGE DEBUG ===');
    console.log('Entry ID received:', entryId);
    console.log('Extracted original entry ID:', originalEntryId);
    console.log('Original ID length:', originalEntryId.length);
    console.log('Image URL:', imageUrl);
    
    // Validate extracted ID is a complete UUID
    if (!originalEntryId || originalEntryId.length !== 36 || !originalEntryId.includes('-')) {
      console.error('Invalid extracted entry ID format:', originalEntryId);
      return Promise.resolve();
    }
    
    // Image updates would need to be handled by the parent component
    return Promise.resolve();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Prominent Generate Content Button */}
      <div className="text-center">
        <Button 
          onClick={onNewContent}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-6 h-6 mr-3" />
          Generar Contenido
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          Crea contenido automático para todas tus redes sociales
        </p>
      </div>

      <div>
        <StatsOverview entries={entries} selectedPlatforms={selectedPlatforms} />
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contenido Creado</h2>
            <p className="text-sm sm:text-base text-gray-600">Gestiona tu contenido por red social</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {platformCards.length} tarjetas
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando contenido...</p>
          </div>
        ) : platformCards.length === 0 ? (
          <Card className="text-center py-12 bg-white/60 backdrop-blur-sm border-dashed border-2 border-gray-300">
            <CardContent className="pt-6">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay contenido aún
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza creando tu primer contenido para redes sociales
              </p>
              <Button 
                onClick={onNewContent}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Contenido
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformCards.map((platformEntry) => (
              <PlatformCard
                key={platformEntry.id}
                entry={platformEntry}
                platform={platformEntry.platform}
                onUpdateContent={onUpdateContent}
                onDeleteEntry={onDeletePlatform}
                onDownloadSlides={onDownloadSlides}
                onUpdateStatus={(entryId, platform, newStatus) => {
                  // Handle status updates here if needed
                }}
                onUpdateLink={(entryId, platform, link) => {
                  // Handle link updates here if needed
                }}
                onUpdateImage={onUpdateImage}
                onReloadEntries={onReloadEntries}
                onStatsUpdate={onReloadEntries} // Use onReloadEntries to refresh stats
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;
