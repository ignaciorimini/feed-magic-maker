
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
  onDeleteEntry: (entryId: string) => void;
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
  onDeleteEntry,
  onDownloadSlides,
  onGenerateImage,
  onUploadImage,
  onDeleteImage,
  onReloadEntries,
  onUpdateImage
}: DashboardContentProps) => {
  // Transform entries to create individual platform cards
  const platformCards = entries.flatMap(entry => {
    const cards = [];
    
    console.log('Processing entry:', entry);
    
    // Check if entry has platformContent (old format) or platforms (new format)
    if (entry.platforms) {
      // New format - direct from database
      entry.platforms.forEach((platform: any) => {
        console.log('Processing platform from new format:', platform);
        
        cards.push({
          id: `${entry.id}__${platform.platform}`, // Composite ID
          platform: platform.platform,
          contentType: platform.content_type || 'simple',
          topic: entry.topic,
          description: entry.description,
          text: platform.text || (platform.wordpress_post && platform.wordpress_post.length > 0 ? platform.wordpress_post[0].content : ''),
          createdAt: entry.created_at,
          status: platform.status || 'pending',
          imageUrl: platform.image_url,
          slidesUrl: platform.slides_url,
          slideImages: platform.slide_images || []
        });
      });
    } else if (entry.platformContent) {
      // Old format - from transformed data
      Object.entries(entry.platformContent).forEach(([platform, content]: [string, any]) => {
        console.log('Processing platform from old format:', platform, content);
        
        cards.push({
          id: `${entry.id}__${platform}`, // Composite ID
          platform: platform,
          contentType: content.contentType || 'simple',
          topic: entry.topic,
          description: entry.description,
          text: content.text || content.content || '',
          createdAt: entry.createdDate ? new Date(entry.createdDate).toISOString() : entry.created_at,
          status: entry.status?.[platform] || 'pending',
          imageUrl: content.image_url || (content.images && content.images.length > 0 ? content.images[0] : null),
          slidesUrl: content.slidesURL,
          slideImages: content.slideImages || []
        });
      });
    }
    
    return cards;
  });

  console.log('Generated platform cards:', platformCards);

  const handleDeleteEntry = (entryId: string) => {
    // Extract the original entry ID using the separator
    const originalEntryId = entryId.includes('__') ? entryId.split('__')[0] : entryId;
    console.log('=== DELETE ENTRY DEBUG ===');
    console.log('Entry ID received:', entryId);
    console.log('Extracted original entry ID:', originalEntryId);
    
    // Validate extracted ID is a complete UUID
    if (!originalEntryId || originalEntryId.length !== 36 || !originalEntryId.includes('-')) {
      console.error('Invalid extracted entry ID format:', originalEntryId);
      return;
    }
    
    console.log('✅ Passing complete UUID to delete function:', originalEntryId);
    onDeleteEntry(originalEntryId);
  };

  const handleEditEntry = (entryId: string) => {
    // For now, just log the edit action
    console.log('Edit entry:', entryId);
  };

  const handleRefreshEntries = () => {
    if (onReloadEntries) {
      onReloadEntries();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
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
                id={platformEntry.id}
                platform={platformEntry.platform}
                contentType={platformEntry.contentType}
                topic={platformEntry.topic}
                description={platformEntry.description}
                text={platformEntry.text}
                createdAt={platformEntry.createdAt}
                status={platformEntry.status}
                imageUrl={platformEntry.imageUrl}
                slidesUrl={platformEntry.slidesUrl}
                slideImages={platformEntry.slideImages}
                onEdit={() => handleEditEntry(platformEntry.id)}
                onDelete={() => handleDeleteEntry(platformEntry.id)}
                onRefresh={handleRefreshEntries}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;
