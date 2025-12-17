import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { LogOut, Upload, X } from 'lucide-react';

export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [originalUsername, setOriginalUsername] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme management
  const { theme, setTheme } = useTheme();

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0].toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setProfileImage(base64);
        // Save to localStorage for persistence
        localStorage.setItem('userProfileImage', base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    localStorage.removeItem('userProfileImage');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername);
    setHasChanges(newUsername !== originalUsername);
  };

  const handleSaveChanges = () => {
    localStorage.setItem('userUsername', username);
    setOriginalUsername(username);
    setHasChanges(false);
    // Could add a toast notification here if needed
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  // Load profile image and username from localStorage on mount
  useEffect(() => {
    const savedImage = localStorage.getItem('userProfileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }

    const savedUsername = localStorage.getItem('userUsername') || '';
    setUsername(savedUsername);
    setOriginalUsername(savedUsername);
  }, []);

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Avatar className="h-8 w-8 cursor-pointer">
          {profileImage ? (
            <AvatarImage src={profileImage} alt={user?.email} />
          ) : null}
          <AvatarFallback className="bg-blue-500 text-white font-semibold">
            {getInitials(user?.email)}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 shadow-lg z-50 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
          <div className="p-4">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Profile</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Info Section */}
            <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
              {/* Avatar - Clickable for photo upload */}
              <div className="relative">
                <Avatar
                  className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={user?.email} />
                  ) : null}
                  <AvatarFallback className="bg-blue-500 text-white text-2xl font-semibold">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                {/* Upload indicator */}
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                  <Upload size={12} />
                </div>
              </div>

              {/* User Email */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white break-words">{user?.email}</p>
              </div>

              {/* Username Input */}
              <div className="w-full">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Username</p>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="w-full"
                  maxLength={50}
                />
              </div>

              {/* Theme Preference */}
              <div className="w-full">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Theme</p>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex-1"
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex-1"
                  >
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="flex-1"
                  >
                    System
                  </Button>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />

              {/* Instructions */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Click on your avatar to upload a photo (Max 5MB. JPG, PNG or GIF)
              </p>
            </div>

            {/* Update Button */}
            {hasChanges && (
              <Button
                onClick={handleSaveChanges}
                className="w-full flex items-center justify-center gap-2 mb-3"
              >
                Update Profile
              </Button>
            )}

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </Card>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
