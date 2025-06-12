
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const platformIcons = {
    Instagram: Instagram,
    Facebook: Facebook,
    Twitter: Twitter,
    LinkedIn: Linkedin
  };

  const platformColors = {
    Instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    Facebook: 'bg-blue-600',
    Twitter: 'bg-sky-500',
    LinkedIn: 'bg-blue-700'
  };

  // Datos de ejemplo para posts programados
  const scheduledPosts = [
    {
      id: 1,
      title: 'Tips de productividad',
      platform: 'Instagram',
      date: new Date(2024, 5, 15, 9, 0),
      status: 'scheduled'
    },
    {
      id: 2,
      title: 'Novedad del producto',
      platform: 'Facebook',
      date: new Date(2024, 5, 15, 14, 30),
      status: 'scheduled'
    },
    {
      id: 3,
      title: 'Artículo de blog',
      platform: 'LinkedIn',
      date: new Date(2024, 5, 16, 10, 0),
      status: 'scheduled'
    },
    {
      id: 4,
      title: 'Meme del viernes',
      platform: 'Twitter',
      date: new Date(2024, 5, 17, 16, 0),
      status: 'scheduled'
    }
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Días del mes siguiente para completar la grilla
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let day = 1; days.length < totalCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => 
      post.date.toDateString() === date.toDateString()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Calendario de Publicaciones
            </h1>
            <p className="text-gray-600">
              Programa y gestiona tu contenido en todas las plataformas
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Publicación
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-purple-500" />
                    <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    const postsForDay = getPostsForDate(day.date);
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[80px] p-2 border border-gray-100 cursor-pointer transition-colors duration-200 ${
                          day.isCurrentMonth 
                            ? 'bg-white hover:bg-gray-50' 
                            : 'bg-gray-50 text-gray-400'
                        } ${isToday ? 'bg-purple-50 border-purple-200' : ''} ${
                          isSelected ? 'bg-purple-100 border-purple-300' : ''
                        }`}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-purple-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {postsForDay.slice(0, 2).map(post => {
                            const Icon = platformIcons[post.platform as keyof typeof platformIcons];
                            return (
                              <div
                                key={post.id}
                                className="text-xs bg-gray-100 rounded px-1 py-0.5 flex items-center space-x-1 truncate"
                              >
                                <Icon className="w-3 h-3" />
                                <span className="truncate">{post.title}</span>
                              </div>
                            );
                          })}
                          {postsForDay.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{postsForDay.length - 2} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Posts */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="text-lg">Próximas Publicaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scheduledPosts.slice(0, 4).map(post => {
                  const Icon = platformIcons[post.platform as keyof typeof platformIcons];
                  return (
                    <div key={post.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        platformColors[post.platform as keyof typeof platformColors]
                      }`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {post.date.toLocaleDateString()} - {post.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="text-lg">Esta Semana</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Posts Programados</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Posts Publicados</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Borradores</span>
                  <Badge variant="secondary">5</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;
