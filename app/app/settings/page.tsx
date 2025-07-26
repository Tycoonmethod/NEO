
'use client';

import { Settings, User, Globe, Palette, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/language-context';
import { useState } from 'react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleSaveProfile = () => {
    // Implementar guardado de perfil
    console.log('Guardando perfil...');
  };

  const handleChangePassword = () => {
    // Implementar cambio de contraseña
    console.log('Cambiando contraseña...');
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'es' | 'en');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
          <Settings className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t('nav.settings')}
          </h1>
          <p className="text-gray-400">
            Personaliza tu experiencia en NEO
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perfil de Usuario */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <User className="w-5 h-5" />
              <span>Perfil</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Información de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                {t('auth.name')}
              </Label>
              <Input
                id="name"
                defaultValue={session?.user?.name || ''}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue={session?.user?.email || ''}
                className="bg-gray-700 border-gray-600 text-white"
                disabled
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
              {t('common.save')}
            </Button>
          </CardContent>
        </Card>

        {/* Preferencias de Idioma */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Globe className="w-5 h-5" />
              <span>Idioma</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Selecciona tu idioma preferido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">
                Idioma de la interfaz
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="es" className="text-white">Español</SelectItem>
                  <SelectItem value="en" className="text-white">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Apariencia */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Palette className="w-5 h-5" />
              <span>Apariencia</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Personaliza la apariencia de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-gray-300">
                  Modo Oscuro
                </Label>
                <p className="text-sm text-gray-400">
                  Interfaz oscura para mayor comodidad
                </p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-gray-300">
                  Notificaciones
                </Label>
                <p className="text-sm text-gray-400">
                  Recibir alertas y recordatorios
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Shield className="w-5 h-5" />
              <span>Seguridad</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configuración de seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">
                Cambiar Contraseña
              </Label>
              <p className="text-sm text-gray-400 mb-2">
                Actualiza tu contraseña para mayor seguridad
              </p>
              <Button onClick={handleChangePassword} variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                Cambiar Contraseña
              </Button>
            </div>
            <Separator className="bg-gray-600" />
            <div className="space-y-2">
              <Label className="text-gray-300">
                Último acceso
              </Label>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
