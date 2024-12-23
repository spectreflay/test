export const isSubscriptionExpired = (endDate: string | undefined): boolean => {
    if (!endDate) return true;
    return new Date(endDate) < new Date();
  };
  
  export const isNearExpiration = (endDate: string | undefined, daysThreshold = 7): boolean => {
    if (!endDate) return false;
    const expirationDate = new Date(endDate);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + daysThreshold);
    return expirationDate <= warningDate;
  };
  