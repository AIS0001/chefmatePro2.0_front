import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

/**
 * ESC/POS Auto-Detect Printer Button Component
 * Simple button that sends KOT to cloud-agent endpoint
 * Backend manages printer detection and routing
 */
export default function ESCPosAutoDetectButton({ 
  orderData = null, 
  sendPrintCommand = null,
  onPrintSuccess = null, 
  size = 'middle', 
  buttonType = 'primary',
  buttonText = null,
  buttonTextStyle = {}
}) {
  const [loading, setLoading] = useState(false);

  const handlePrintClick = async () => {
    try {
      setLoading(true);

      // 🔍 DEBUG: Log complete orderData structure
      // console.log('📤 ===== ESCPosAutoDetectButton DEBUG =====');
      // console.log('📦 Complete orderData received:', JSON.stringify(orderData, null, 2));
      // console.log('📊 Items breakdown:');
      // orderData.items.forEach((item, idx) => {
      //   console.log(`  [Item ${idx}]:`, {
      //     item_name: item.item_name,
      //     quantity: item.quantity,
      //     quantity_type: typeof item.quantity,
      //     price: item.price,
      //     item_group: item.item_group,
      //     category: item.category
      //   });
      // });
      // console.log('📤 Total amount:', orderData.total);
      // console.log('📤 Table number:', orderData.table_number);
      // console.log('📤 ===== END DEBUG =====\n');

      // Call the send print command function passed from parent
      let success = false;
      if (typeof sendPrintCommand === 'function') {
        // console.log('🔄 Calling sendPrintCommand(handleESCPosOrderFlow)...');
        success = await sendPrintCommand(orderData);
        // console.log('✅ sendPrintCommand returned:', success);
      } else {
        console.error('Print function not configured');
        return;
      }

      if (success) {
        if (onPrintSuccess) {
          onPrintSuccess();
        }
      }

    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Send KOT to ESC/POS printer (auto-detected by backend)">
      <Button
        type={buttonType}
        size={size}
        icon={<PrinterOutlined />}
        loading={loading}
        onClick={handlePrintClick}
        style={{
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          color: '#fff',
          fontWeight: 'bold',
          ...buttonTextStyle
        }}
      >
        {buttonText !== null ? buttonText : (size === 'small' ? '' : 'ESC POS')}
      </Button>
    </Tooltip>
  );
}
