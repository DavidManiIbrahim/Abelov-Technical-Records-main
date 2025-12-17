import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LogOut, Upload, X } from 'lucide-react';

export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [username, setUsername] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    localStorage.setItem('userUsername', newUsername);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  // Load profile image and username from localStorage on mount
  if (profileImage === null) {
    const saved = localStorage.getItem('userProfileImage');
    if (saved) {
      setProfileImage(saved);
    }
  }

  if (username === '') {
    const savedUsername = localStorage.getItem('userUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }

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
              {/* Avatar */}
              <Avatar className="h-20 w-20">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={user?.email} />
                ) : null}
                <AvatarFallback className="bg-blue-500 text-white text-2xl font-semibold">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>

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

              {/* Image Upload Section */}
              <div className="w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  {profileImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isUploading}
                      className="px-3"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Max 5MB. JPG, PNG or GIF.
                </p>
              </div>
            </div>

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
