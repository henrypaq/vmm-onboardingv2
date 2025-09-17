'use client';

import { Button } from '@/components 2/ui/button';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components 2/ui/input';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64"
            />
          </div>
          
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
