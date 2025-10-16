  // Fetch assets for a platform
  const fetchPlatformAssets = async (platformId: string) => {
    setIsLoadingAssets(prev => ({ ...prev, [platformId]: true }));
    
    try {
      // Get client ID from onboarding request
      const requestResponse = await fetch(`/api/onboarding/request?token=${token}`);
      
      if (!requestResponse.ok) {
        throw new Error('Failed to get client information');
      }
      
      const requestData = await requestResponse.json();
      
      const latestRequest = requestData.requests && requestData.requests.length > 0 
        ? requestData.requests[0] 
        : null;
      
      if (!latestRequest || !latestRequest.id) {
        throw new Error('Client ID not found');
      }

      // Fetch assets from platform API
      const assetsUrl = `/api/platforms/assets?platform=${platformId}&clientId=${latestRequest.id}`;
      const assetsResponse = await fetch(assetsUrl);
      
      if (!assetsResponse.ok) {
        throw new Error('Failed to fetch platform assets');
      }

      const assetsData = await assetsResponse.json();
      
      setPlatformAssets(prev => ({
        ...prev,
        [platformId]: assetsData.assets || []
      }));
      
    } catch (error) {
      console.error('Failed to fetch assets for', platformId, ':', error);
      toast.error(`Failed to load ${platformId} assets`);
    } finally {
      setIsLoadingAssets(prev => ({ ...prev, [platformId]: false }));
    }
  };