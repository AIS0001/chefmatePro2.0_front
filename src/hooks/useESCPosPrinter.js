import { useState } from 'react';
import escPosAutoDetectService from '../services/escPosAutoDetectPrinter';

/**
 * Custom Hook for ESC/POS Auto-Detect Printer
 * Provides printing functionality with state management
 */
export const useESCPosPrinter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPrintedData, setLastPrintedData] = useState(null);

  const printKOT = async (orderData, location = 'kitchen') => {
    try {
      setLoading(true);
      setError(null);

      if (!orderData || !orderData.items || orderData.items.length === 0) {
        throw new Error('No items to print');
      }

      const kotData = escPosAutoDetectService.prepareKOTData(orderData);
      const success = await escPosAutoDetectService.printKOT(kotData, location);

      if (success) {
        setLastPrintedData({
          orderData,
          location,
          timestamp: new Date(),
          kotData
        });
      }

      return success;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const printKOTByMac = async (orderData, macAddress) => {
    try {
      setLoading(true);
      setError(null);

      if (!orderData || !orderData.items || orderData.items.length === 0) {
        throw new Error('No items to print');
      }

      const kotData = escPosAutoDetectService.prepareKOTData(orderData);
      const success = await escPosAutoDetectService.printKOTByMac(kotData, macAddress);

      if (success) {
        setLastPrintedData({
          orderData,
          macAddress,
          timestamp: new Date(),
          kotData
        });
      }

      return success;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => setError(null);
  const clearHistory = () => setLastPrintedData(null);

  return {
    loading,
    error,
    lastPrintedData,
    printKOT,
    printKOTByMac,
    resetError,
    clearHistory
  };
};

export default useESCPosPrinter;
