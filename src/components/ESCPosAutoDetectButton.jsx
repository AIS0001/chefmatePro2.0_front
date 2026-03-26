import React, { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
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
  buttonType = 'primary' 
}) {
  const [loading, setLoading] = useState(false);

  const handlePrintClick = async () => {
    try {
      // Validate table selection
      if (!orderData || !orderData.table_number) {
        message.error('❌ Please select a table first!');
        return;
      }

      // Validate order data
      if (!orderData.items || orderData.items.length === 0) {
        message.error('❌ No items to print!');
        return;
      }

      setLoading(true);
      message.loading({
        content: '🖨️ Sending KOT to printer...',
        key: 'printing',
        duration: 0
      });

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
        message.error('Print function not configured');
        return;
      }

      if (success) {
        message.success({
          content: '✅ KOT sent successfully!',
          key: 'printing',
          duration: 3
        });
        if (onPrintSuccess) {
          onPrintSuccess();
        }
      } else {
        message.error({
          content: '❌ Failed to send KOT',
          key: 'printing',
          duration: 3
        });
      }

    } catch (error) {
      console.error('Print error:', error);
      message.error({
        content: `❌ Error: ${error.message || 'Failed to print'}`,
        key: 'printing',
        duration: 4
      });
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
          borderColor: '#1890ff'
        }}
      >
        {size === 'small' ? '' : 'ESC POS'}
      </Button>
    </Tooltip>
  );
}
