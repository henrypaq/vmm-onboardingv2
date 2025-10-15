import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function GoogleLogo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function MetaLogo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="#0866FF"
      />
    </svg>
  );
}

export function TikTokLogo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
        fill="#000000"
      />
    </svg>
  );
}

export function ShopifyLogo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.337 2.531c-.092 0-.184.046-.276.092-.046 0-.415.184-.461.23-.276-.184-.645-.322-1.015-.322-.046 0-.092 0-.138.046-.046-.138-.138-.23-.23-.368-.368-.414-.875-.598-1.428-.552-.967.092-1.934.782-2.717 1.888-.553.782-.967 1.749-1.106 2.578-.875.276-1.474.46-1.52.46-.46.138-.46.138-.506.598C6.894 7.457 5.098 20.845 5.098 20.845l11.132 2.118 5.467-1.288S15.475 2.531 15.337 2.531zm-2.901 1.059c-.092.046-.184.046-.322.092v-.092c0-.368-.046-.69-.138-.967.414.092.737.46.46.967zm-.967-.966c.092.23.138.552.138.967v.046c-.46.138-1.014.322-1.612.506.276-.92.783-1.428 1.474-1.52zm-.644-1.059c.092 0 .184.046.322.092-.828.322-1.612 1.152-1.98 2.761-.506.138-1.014.322-1.474.46.368-1.38 1.382-3.175 3.132-3.313z"
        fill="#95BF47"
      />
      <path
        d="M15.061 2.623s-.046 0-.046.046c0-.046 0-.046.046-.046zm.276-.092l-3.59 20.845 5.467-1.288S15.475 2.531 15.337 2.531c-.092.046-.138 0 0 0z"
        fill="#5E8E3E"
      />
      <path
        d="M11.424 9.062l-.783 2.302s-.874-.414-1.934-.414c-1.566 0-1.658.967-1.658 1.198 0 1.336 3.5 1.842 3.5 4.97 0 2.486-1.566 4.05-3.682 4.05-2.532 0-3.868-1.566-3.868-1.566l.69-2.256s1.382 1.198 2.532 1.198c.736 0 1.06-.598 1.06-1.014 0-1.75-2.9-1.842-2.9-4.694 0-2.44 1.704-4.786 5.19-4.786 1.336-.046 1.842.23 1.842.23l.011-.218z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// Utility function to get the right logo component
export function getPlatformLogo(platformId: string, props?: LogoProps) {
  switch (platformId.toLowerCase()) {
    case 'google':
      return <GoogleLogo {...props} />;
    case 'meta':
    case 'facebook':
      return <MetaLogo {...props} />;
    case 'tiktok':
      return <TikTokLogo {...props} />;
    case 'shopify':
      return <ShopifyLogo {...props} />;
    default:
      return null;
  }
}

