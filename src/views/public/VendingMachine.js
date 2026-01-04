import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import './VendingMachine.css';

const VendingMachine = () => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('qr');
    const [isProcessing, setIsProcessing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connected, error
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [selectedPort, setSelectedPort] = useState('COM1');
    const [availablePorts, setAvailablePorts] = useState(['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8']);
    const [showPortSelector, setShowPortSelector] = useState(false);
    const [connectionConfig, setConnectionConfig] = useState({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
    });
    
    // Sample vending machine items (prices in Thai Baht)
    const [vendingItems] = useState([
        { id: 1, name: 'Water Bottle', price: 15, stock: 10, slot: 'A1', category: 'Beverages' },
        { id: 2, name: 'Ice Cold Water', price: 18, stock: 8, slot: 'A2', category: 'Beverages' },
        { id: 3, name: 'Soft Drink', price: 25, stock: 12, slot: 'A3', category: 'Beverages' },
        { id: 4, name: 'Energy Drink', price: 35, stock: 6, slot: 'A4', category: 'Beverages' },
        { id: 5, name: 'Ice Cream', price: 30, stock: 15, slot: 'B1', category: 'Frozen' },
        { id: 6, name: 'Ice Bar', price: 22, stock: 20, slot: 'B2', category: 'Frozen' },
        { id: 7, name: 'Chocolate Bar', price: 40, stock: 18, slot: 'B3', category: 'Snacks' },
        { id: 8, name: 'Chips Packet', price: 28, stock: 14, slot: 'B4', category: 'Snacks' },
        { id: 9, name: 'Cookies', price: 32, stock: 11, slot: 'C1', category: 'Snacks' },
        { id: 10, name: 'Sandwich', price: 55, stock: 5, slot: 'C2', category: 'Food' },
        { id: 11, name: 'Instant Noodles', price: 45, stock: 9, slot: 'C3', category: 'Food' },
        { id: 12, name: 'Fruit Juice', price: 28, stock: 16, slot: 'C4', category: 'Beverages' }
    ]);

    // Group items by category
    const itemsByCategory = vendingItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    // Fetch available ports on component mount
    useEffect(() => {
        fetchAvailablePorts();
    }, []);

    // Generate transaction ID
    const generateTransactionId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `VM${timestamp}${random}`;
    };

    // Generate QR code data
    const generateQRData = (item, transId) => {
        return JSON.stringify({
            transactionId: transId,
            itemId: item.id,
            itemName: item.name,
            slot: item.slot,
            price: item.price,
            currency: 'THB',
            timestamp: new Date().toISOString(),
            vendingMachine: 'VM001'
        });
    };

    // Handle buy item
    const handleBuyItem = (item) => {
        if (item.stock <= 0) {
            toast.error(`${item.name} is out of stock!`, {
                duration: 3000,
                position: 'top-center',
            });
            return;
        }

        toast.success(`Selected: ${item.name} - ฿${item.price}`, {
            duration: 2000,
            position: 'top-center',
        });

        const transId = generateTransactionId();
        setTransactionId(transId);
        setSelectedItem(item);
        setQrData(generateQRData(item, transId));
        setShowQRModal(true);
    };

    // Health check API
    const checkHealthStatus = async () => {
        try {
            const response = await axios.get('/vending/health');
            
            // axios automatically parses JSON, so we can directly use response.data
            const result = response.data;
            
            if (response.status === 200) {
                toast.success(`Vending Machine API v${result.version || '1.0.0'} is running`, {
                    duration: 3000,
                    position: 'top-center',
                });
                console.log('Health check successful:', result);
                return true;
            } else {
                toast.error('Vending Machine API health check failed', {
                    duration: 4000,
                    position: 'top-center',
                });
                console.error('Health check failed:', result);
                return false;
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                toast.error('API endpoint not found - Check if backend server is running on port 4402', {
                    duration: 5000,
                    position: 'top-center',
                });
                console.error('API endpoint not found (404):', error.response.statusText);
            } else if (error.code === 'ERR_NETWORK') {
                toast.error('Cannot connect to backend server - Check if server is running', {
                    duration: 5000,
                    position: 'top-center',
                });
                console.error('Network error - Backend server not running:', error.message);
            } else {
                toast.error('Failed to connect to Vending Machine API', {
                    duration: 4000,
                    position: 'top-center',
                });
                console.error('Health check error:', error);
            }
            return false;
        }
    };

    // Fetch available COM ports from backend
    const fetchAvailablePorts = async () => {
        try {
            const response = await axios.get('/vending/available-ports');
            const result = response.data;
            
            if (response.status === 200 && result.success && result.ports) {
                const portNames = result.ports.map(port => port.path);
                setAvailablePorts(portNames);
                toast.success(`Found ${portNames.length} available ports`, {
                    duration: 2000,
                    position: 'top-center',
                });
                console.log('Available ports:', result.ports);
            } else {
                // Fallback to default COM ports if API fails
                setAvailablePorts(['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8']);
                toast('Using default COM ports list', {
                    duration: 2000,
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('Error fetching available ports:', error);
            // Fallback to default ports
            setAvailablePorts(['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8']);
            toast('Using default COM ports list', {
                duration: 2000,
                position: 'top-center',
            });
        }
    };

    // Update port configuration on backend and test connection
    const updatePortConfigAndConnect = async () => {
        try {
            setConnectionStatus('connecting');
            toast.loading('Updating port configuration...', {
                duration: 2000,
                position: 'top-center',
            });

            const response = await axios.post('/vending/port-config', {
                port: selectedPort,
                baudRate: connectionConfig.baudRate,
                dataBits: connectionConfig.dataBits,
                stopBits: connectionConfig.stopBits,
                parity: connectionConfig.parity
            });

            const result = response.data;

            if (response.status === 200 && result.success) {
                toast.success(`Port configuration updated to ${selectedPort}`, {
                    duration: 2000,
                    position: 'top-center',
                });
                
                // Now test the connection
                const connectionSuccess = await testRS485Connection();
                if (connectionSuccess) {
                    setConnectionStatus('connected');
                }
            } else {
                setConnectionStatus('error');
                toast.error(`Failed to update port configuration: ${result.message}`, {
                    duration: 4000,
                    position: 'top-center',
                });
            }
        } catch (error) {
            setConnectionStatus('error');
            toast.error('Error updating port configuration', {
                duration: 4000,
                position: 'top-center',
            });
            console.error('Port config update error:', error);
        }
    };

    // Load available ports on component mount
    useEffect(() => {
        fetchAvailablePorts();
    }, []);

    // Test RS485 connection via selected USB Port
    const testRS485Connection = async () => {
        try {
            const response = await axios.get('/vending/test-connection');
            const result = response.data;
            
            if (response.status === 200 && result.success) {
                setConnectionStatus('connected');
                toast.success(`RS485 connection established on ${result.port_config?.path || selectedPort}`, {
                    duration: 3000,
                    position: 'top-center',
                });
                console.log('RS485 connection test successful:', result);
                return true;
            } else {
                setConnectionStatus('error');
                toast.error(`RS485 connection failed: ${result.message || 'Unknown error'}`, {
                    duration: 4000,
                    position: 'top-center',
                });
                console.error('RS485 connection test failed:', result);
                return false;
            }
        } catch (error) {
            setConnectionStatus('error');
            toast.error(`RS485 connection error - Check ${selectedPort} port and hardware`, {
                duration: 4000,
                position: 'top-center',
            });
            console.error('RS485 connection error:', error);
            return false;
        }
    };

    // Get machine status
    const getMachineStatus = async (machineId = 'VM001') => {
        try {
            const response = await axios.get(`/vending/machine/${machineId}/status`);
            const result = response.data;
            
            if (response.status === 200 && result.success) {
                toast.success(`Machine ${machineId} status updated`, {
                    duration: 2000,
                    position: 'top-center',
                });
                console.log('Machine status:', result);
                return result;
            } else {
                toast.error(`Failed to get status for machine ${machineId}: ${result.message || 'Unknown error'}`, {
                    duration: 3000,
                    position: 'top-center',
                });
                console.error('Failed to get machine status:', result);
                return null;
            }
        } catch (error) {
            toast.error('Machine status check failed', {
                duration: 3000,
                position: 'top-center',
            });
            console.error('Machine status error:', error);
            return null;
        }
    };

    // Connect to vending machine
    const connectToVendingMachine = async () => {
        setConnectionStatus('connecting');
        toast.loading('Connecting to vending machine...', {
            duration: 2000,
            position: 'top-center',
        });
        
        // Check health first
        const healthOk = await checkHealthStatus();
        if (!healthOk) {
            setConnectionStatus('error');
            return;
        }
        
        // Test RS485 connection
        const connectionSuccess = await testRS485Connection();
        
        if (connectionSuccess) {
            // Get machine status if connection successful
            const status = await getMachineStatus();
            if (status) {
                setConnectionStatus('connected');
                toast.success('🎉 Successfully connected to vending machine via USB COM5!', {
                    duration: 4000,
                    position: 'top-center',
                });
            }
        } else {
            toast.error(`❌ Failed to connect to vending machine on ${selectedPort}. Please check USB cable and port.`, {
                duration: 5000,
                position: 'top-center',
            });
        }
    };

    // Handle purchase confirmation
    const handleConfirmPurchase = async () => {
        if (!selectedItem) return;

        setIsProcessing(true);
        toast.loading('Processing your purchase...', {
            duration: 3000,
            position: 'top-center',
        });
        
        try {
            // Test connection before processing
            const isConnected = await testRS485Connection();
            
            if (!isConnected) {
                toast.error(`❌ Vending machine USB connection failed on ${selectedPort}. Please check port.`, {
                    duration: 4000,
                    position: 'top-center',
                });
                return;
            }

            // Process payment and dispensing
            console.log('Processing purchase:', {
                transactionId: transactionId,
                item: selectedItem,
                paymentMethod: paymentMethod,
                timestamp: new Date().toISOString()
            });

            // Simulate RS485 communication to dispense item
            console.log(`Dispensing ${selectedItem.name} from slot ${selectedItem.slot}`);
            toast.success(`🤖 Dispensing ${selectedItem.name} from slot ${selectedItem.slot}`, {
                duration: 3000,
                position: 'top-center',
            });
            
            // Log the successful transaction to the database
            try {
                const transactionData = {
                    machine_id: 'VM001', // You can make this configurable
                    product_id: selectedItem.slot || selectedItem.id || 'P001',
                    quantity: 1,
                    amount: selectedItem.price,
                    user_id: null, // Add user ID if available
                    payment_method: paymentMethod || 'cash'
                };

                console.log('Logging transaction:', transactionData);
                
                const logResponse = await axios.post('/vending/transactions/log', transactionData);
                
                if (logResponse.data.success) {
                    console.log('✅ Transaction logged successfully:', logResponse.data);
                    toast.success(`📝 Transaction logged: ${logResponse.data.data.transaction_id}`, {
                        duration: 2000,
                        position: 'top-right',
                    });
                } else {
                    console.warn('⚠️ Transaction logging failed:', logResponse.data.message);
                }
            } catch (logError) {
                console.error('❌ Failed to log transaction:', logError);
                // Don't show error to user as the purchase was successful
            }
            
            // Get machine status after dispensing
            await getMachineStatus();
            
            toast.success(`🎉 Purchase successful! ${selectedItem.name} - ฿${selectedItem.price}`, {
                duration: 5000,
                position: 'top-center',
            });
            setShowQRModal(false);
            setSelectedItem(null);
            
        } catch (error) {
            console.error('Purchase failed:', error);
            toast.error('❌ Purchase failed. Please try again.', {
                duration: 4000,
                position: 'top-center',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Close QR modal
    const handleCloseModal = () => {
        setShowQRModal(false);
        setSelectedItem(null);
    };

    return (
        <div className="vending-machine-page">
            <div className="page-header">
                <h1 className="page-title">🏪 Vending Machine</h1>
                <p className="page-subtitle">Select items and make your purchase</p>
            </div>

            <div className="vending-container">
                <div className="items-section">
                    <h2>Available Items</h2>
                    {Object.entries(itemsByCategory).map(([category, items]) => (
                        <div key={category} className="category-section">
                            <h3 className="category-title">{category}</h3>
                            <div className="items-grid">
                                {items.map(item => (
                                    <div 
                                        key={item.id} 
                                        className={`item-card ${item.stock <= 0 ? 'out-of-stock' : ''}`}
                                    >
                                        <div className="item-slot">{item.slot}</div>
                                        <div className="item-info">
                                            <h4 className="item-name">{item.name}</h4>
                                            <p className="item-price">฿{item.price}</p>
                                            <p className="item-stock">Stock: {item.stock}</p>
                                        </div>
                                        <button 
                                            className="buy-item-btn"
                                            onClick={() => handleBuyItem(item)}
                                            disabled={item.stock <= 0 || isProcessing}
                                        >
                                            {item.stock <= 0 ? 'Out of Stock' : `Buy - ฿${item.price}`}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="info-section">
                    <h2>How to Purchase</h2>
                    <div className="info-content">
                        <div className="instruction-step">
                            <div className="step-number">1</div>
                            <div className="step-text">Select an item you want to buy</div>
                        </div>
                        <div className="instruction-step">
                            <div className="step-number">2</div>
                            <div className="step-text">Scan the QR code for payment</div>
                        </div>
                        <div className="instruction-step">
                            <div className="step-number">3</div>
                            <div className="step-text">Confirm purchase to dispense item</div>
                        </div>
                        <div className="instruction-step">
                            <div className="step-number">4</div>
                            <div className="step-text">Collect your item from the machine</div>
                        </div>
                        
                        <div className="payment-info">
                            <h3>Payment Methods</h3>
                            <div className="payment-methods">
                                <span className="payment-method">💳 Credit/Debit Card</span>
                                <span className="payment-method">📱 Mobile Banking</span>
                                <span className="payment-method">💰 Digital Wallet</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="connection-control-card">
                    <h2>🔧 Machine Connection</h2>
                    <div className="connection-status-card">
                        <div className="status-display">
                            <span className={`status-indicator ${connectionStatus}`}></span>
                            <span className="status-text">
                                {connectionStatus === 'connected' && `Connected to ${selectedPort}`}
                                {connectionStatus === 'disconnected' && 'Not Connected'}
                                {connectionStatus === 'connecting' && 'Connecting...'}
                                {connectionStatus === 'error' && 'Connection Error'}
                            </span>
                        </div>
                        
                        {/* Port Selection */}
                        <div className="port-selection">
                            <button 
                                className="port-selector-btn"
                                onClick={() => setShowPortSelector(!showPortSelector)}
                                disabled={connectionStatus === 'connecting'}
                            >
                                📡 Port: {selectedPort} {showPortSelector ? '▲' : '▼'}
                            </button>
                            
                            {showPortSelector && (
                                <div className="port-dropdown">
                                    <div className="port-options">
                                        <h4>Select COM Port:</h4>
                                        <div className="port-list">
                                            {availablePorts.map(port => (
                                                <button
                                                    key={port}
                                                    className={`port-option ${selectedPort === port ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedPort(port);
                                                        setShowPortSelector(false);
                                                        if (connectionStatus === 'connected') {
                                                            setConnectionStatus('disconnected');
                                                            toast(`Switched to ${port}. Please reconnect.`, {
                                                                duration: 2000,
                                                                position: 'top-center',
                                                            });
                                                        }
                                                    }}
                                                    disabled={connectionStatus === 'connecting'}
                                                >
                                                    {port}
                                                    {selectedPort === port && ' ✓'}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="connection-settings">
                                            <h5>Connection Settings:</h5>
                                            <div className="settings-grid">
                                                <div className="setting-item">
                                                    <label>Baud Rate:</label>
                                                    <select 
                                                        value={connectionConfig.baudRate}
                                                        onChange={(e) => setConnectionConfig({...connectionConfig, baudRate: parseInt(e.target.value)})}
                                                        disabled={connectionStatus === 'connecting'}
                                                    >
                                                        <option value={9600}>9600</option>
                                                        <option value={19200}>19200</option>
                                                        <option value={38400}>38400</option>
                                                        <option value={57600}>57600</option>
                                                        <option value={115200}>115200</option>
                                                    </select>
                                                </div>
                                                <div className="setting-item">
                                                    <label>Data Bits:</label>
                                                    <select 
                                                        value={connectionConfig.dataBits}
                                                        onChange={(e) => setConnectionConfig({...connectionConfig, dataBits: parseInt(e.target.value)})}
                                                        disabled={connectionStatus === 'connecting'}
                                                    >
                                                        <option value={7}>7</option>
                                                        <option value={8}>8</option>
                                                    </select>
                                                </div>
                                                <div className="setting-item">
                                                    <label>Stop Bits:</label>
                                                    <select 
                                                        value={connectionConfig.stopBits}
                                                        onChange={(e) => setConnectionConfig({...connectionConfig, stopBits: parseInt(e.target.value)})}
                                                        disabled={connectionStatus === 'connecting'}
                                                    >
                                                        <option value={1}>1</option>
                                                        <option value={2}>2</option>
                                                    </select>
                                                </div>
                                                <div className="setting-item">
                                                    <label>Parity:</label>
                                                    <select 
                                                        value={connectionConfig.parity}
                                                        onChange={(e) => setConnectionConfig({...connectionConfig, parity: e.target.value})}
                                                        disabled={connectionStatus === 'connecting'}
                                                    >
                                                        <option value="none">None</option>
                                                        <option value="even">Even</option>
                                                        <option value="odd">Odd</option>
                                                        <option value="mark">Mark</option>
                                                        <option value="space">Space</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                className="test-connection-btn"
                                                onClick={() => {
                                                    setShowPortSelector(false);
                                                    updatePortConfigAndConnect();
                                                }}
                                                disabled={connectionStatus === 'connecting'}
                                            >
                                                🔧 Test Connection
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="connection-buttons">
                            <button 
                                className="health-check-btn"
                                onClick={checkHealthStatus}
                                disabled={isProcessing}
                            >
                                🏥 Health Check
                            </button>
                            <button 
                                className="refresh-ports-btn"
                                onClick={fetchAvailablePorts}
                                disabled={connectionStatus === 'connecting'}
                            >
                                🔄 Refresh Ports
                            </button>
                            {connectionStatus !== 'connected' && (
                                <button 
                                    className="connect-btn"
                                    onClick={connectToVendingMachine}
                                    disabled={connectionStatus === 'connecting'}
                                >
                                    {connectionStatus === 'connecting' ? 'Connecting...' : `Connect ${selectedPort}`}
                                </button>
                            )}
                            {connectionStatus === 'connected' && (
                                <button 
                                    className="disconnect-btn"
                                    onClick={() => {
                                        setConnectionStatus('disconnected');
                                        toast('Disconnected from vending machine', {
                                            duration: 2000,
                                            position: 'top-center',
                                        });
                                    }}
                                    disabled={connectionStatus === 'connecting'}
                                >
                                    🔌 Disconnect
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="machine-status">
                <h3>Machine Status</h3>
                <div className="status-info">
                    <div className="status-item">
                        <span className="status-label">Connection:</span>
                        <span className={`status-value ${connectionStatus}`}>
                            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">USB Port:</span>
                        <span className="status-value">{selectedPort}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Baud Rate:</span>
                        <span className="status-value">{connectionConfig.baudRate}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Settings:</span>
                        <span className="status-value">
                            {connectionConfig.dataBits}-{connectionConfig.parity.charAt(0).toUpperCase()}-{connectionConfig.stopBits}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Last Updated:</span>
                        <span className="status-value">{format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Total Items Available:</span>
                        <span className="status-value">{vendingItems.reduce((sum, item) => sum + item.stock, 0)}</span>
                    </div>
                </div>
            </div>

            {/* QR Code Payment Modal */}
            {showQRModal && selectedItem && (
                <div className="qr-modal-overlay">
                    <div className="qr-modal">
                        <div className="qr-modal-header">
                            <h2>💳 Payment Required</h2>
                            <button className="close-modal-btn" onClick={handleCloseModal}>✕</button>
                        </div>
                        
                        <div className="qr-modal-content">
                            <div className="selected-item-info">
                                <h3>{selectedItem.name}</h3>
                                <p className="item-slot">Slot: {selectedItem.slot}</p>
                                <p className="item-price-large">฿{selectedItem.price}</p>
                            </div>
                            
                            <div className="qr-code-section">
                                <p className="qr-instruction">Scan QR code to pay</p>
                                <div className="qr-code-container">
                                    <QRCodeSVG 
                                        value={qrData}
                                        size={200}
                                        level="M"
                                        includeMargin={true}
                                    />
                                </div>
                                <p className="transaction-id">Transaction ID: {transactionId}</p>
                            </div>
                            
                            <div className="payment-actions">
                                <button 
                                    className="cancel-btn"
                                    onClick={handleCloseModal}
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="confirm-payment-btn"
                                    onClick={handleConfirmPurchase}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : 'Confirm Payment & Dispense'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .vending-machine-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    color: #333;
                }
                
                .page-header {
                    text-align: center;
                    margin-bottom: 30px;
                    color: white;
                }
                
                .page-title {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                
                .page-subtitle {
                    font-size: 1.2em;
                    opacity: 0.9;
                    margin-bottom: 20px;
                }
                
                .connection-status {
                    background: rgba(255,255,255,0.15);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px auto;
                    max-width: 800px;
                    backdrop-filter: blur(10px);
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.2);
                    z-index: 1000;
                }
                
                .status-text {
                    color: white;
                    font-weight: 500;
                    font-size: 16px;
                }
                     .status-text1 {
                    color: black;
                    font-weight: 500;
                    font-size: 16px;
                }
                .status-indicator {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                
                .status-indicator.connected { background-color: #4CAF50; }
                .status-indicator.disconnected { background-color: #9E9E9E; }
                .status-indicator.connecting { 
                    background-color: #FF9800; 
                    animation: pulse 1.5s infinite;
                }
                .status-indicator.error { background-color: #F44336; }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .port-selection {
                    margin: 15px 0;
                    position: relative;
                    z-index: 99999;
                }
                
                .port-selector-btn {
                    background: rgba(255,255,255,0.25);
                    border: 2px solid rgba(255,255,255,0.4);
                    color: black;
                    padding: 8px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    width: 100%;
                    text-align: center;
                }
                    min-width: 150px;
                }
                
                .port-selector-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.35);
                    border-color: rgba(255,255,255,0.6);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                .port-selector-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .port-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    z-index: 99998;
                    padding: 20px;
                    margin-top: 5px;
                    color: #333;
                    border: 2px solid rgba(255,255,255,0.8);
                }
                
                .port-options h4 {
                    margin: 0 0 15px 0;
                    color: #333;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .port-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
                    gap: 8px;
                    margin-bottom: 20px;
                }
                
                .port-option {
                    background: #f8f9fa;
                    border: 2px solid #dee2e6;
                    padding: 10px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    text-align: center;
                    color: #495057;
                }
                
                .port-option:hover:not(:disabled) {
                    background: #e3f2fd;
                    border-color: #2196F3;
                    color: #1976D2;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(33,150,243,0.2);
                }
                
                .port-option.selected {
                    background: #4CAF50;
                    color: white;
                    border-color: #4CAF50;
                    font-weight: 600;
                    box-shadow: 0 4px 8px rgba(76,175,80,0.3);
                }
                
                .connection-settings {
                    border-top: 2px solid #e9ecef;
                    padding-top: 20px;
                    margin-top: 20px;
                }
                
                .connection-settings h5 {
                    margin: 0 0 15px 0;
                    color: #343a40;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 10px;
                    margin-bottom: 15px;
                }
                
                .setting-item {
                    display: flex;
                    flex-direction: column;
                }
                
                .setting-item label {
                    font-size: 13px;
                    color: #495057;
                    margin-bottom: 6px;
                    font-weight: 500;
                }
                
                .setting-item select {
                    padding: 8px 10px;
                    border: 2px solid #ced4da;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #495057;
                    background-color: white;
                    transition: border-color 0.2s ease;
                }
                
                .setting-item select:focus {
                    outline: none;
                    border-color: #2196F3;
                    box-shadow: 0 0 0 3px rgba(33,150,243,0.1);
                }
                
                .test-connection-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    width: 100%;
                    margin-top: 10px;
                }
                
                .test-connection-btn:hover:not(:disabled) {
                    background: #1976D2;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(33,150,243,0.3);
                }
                
                .connection-buttons {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    justify-content: center;
                    margin-top: 15px;
                }
                
                .health-check-btn, .refresh-ports-btn, .connect-btn, .disconnect-btn {
                    background: rgba(255,255,255,0.25);
                    border: 2px solid rgba(255,255,255,0.4);
                    color: black;
                    padding: 12px 18px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                
                .health-check-btn:hover:not(:disabled), 
                .refresh-ports-btn:hover:not(:disabled),
                .connect-btn:hover:not(:disabled),
                .disconnect-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.35);
                    border-color: rgba(255,255,255,0.6);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                }
                    transition: all 0.3s ease;
                    min-width: 120px;
                }
                
                .connect-btn {
                    background: #4CAF50;
                    border-color: #4CAF50;
                }
                
                .disconnect-btn {
                    background: #f44336;
                    border-color: #f44336;
                }
                
                .health-check-btn:hover:not(:disabled),
                .refresh-ports-btn:hover:not(:disabled),
                .connect-btn:hover:not(:disabled),
                .disconnect-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                .vending-container {
                    display: grid;
                    grid-template-columns: 60% 20% 20%;
                    gap: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .items-section {
                    background: rgba(255,255,255,0.95);
                    padding: 25px;
                    border-radius: 15px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                }
                
                .info-section {
                    background: rgba(255,255,255,0.95);
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    height: fit-content;
                }
                
                .info-section h2 {
                    margin: 0 0 15px 0;
                    font-size: 1.1em;
                    color: #333;
                }
                
                .instruction-step {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                
                .step-number {
                    background: #2196F3;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    flex-shrink: 0;
                }
                
                .step-text {
                    font-size: 12px;
                    color: #555;
                    line-height: 1.4;
                }
                
                .payment-info h3 {
                    margin: 15px 0 8px 0;
                    font-size: 0.95em;
                    color: #333;
                }
                
                .payment-methods {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .payment-method {
                    font-size: 11px;
                    color: #666;
                    background: rgba(33, 150, 243, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                
                .connection-control-card {
                    background: rgba(255,255,255,0.95);
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    border: 2px solid rgba(33, 150, 243, 0.2);
                    height: fit-content;
                }
                
                .connection-control-card h2 {
                    margin: 0 0 15px 0;
                    color: #2196F3;
                    font-size: 1.1em;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                
                .connection-status-card {
                    background: rgba(248, 249, 250, 0.8);
                    padding: 15px;
                    border-radius: 12px;
                    border: 1px solid rgba(0,0,0,0.1);
                }
                
                .status-display {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 15px;
                    padding: 8px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid rgba(0,0,0,0.1);
                    flex-wrap: wrap;
                }
                
                .status-text {
                    color: #333;
                    font-weight: 600;
                    font-size: 12px;
                    word-break: break-word;
                }
                
                .connection-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-top: 15px;
                }
                
                .connection-buttons button {
                    padding: 8px 12px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 12px;
                    transition: all 0.3s ease;
                    text-align: center;
                }
                
                .health-check-btn {
                    background: #28a745;
                    color: white;
                }
                
                .refresh-ports-btn {
                    background: #17a2b8;
                    color: white;
                }
                
                .connect-btn {
                    background: #2196F3;
                    color: white;
                }
                
                .disconnect-btn {
                    background: #dc3545;
                    color: white;
                }
                
                .connection-buttons button:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                
                .connection-buttons button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                
                .items-section {
                    background: rgba(255,255,255,0.95);
                    padding: 25px;
                    border-radius: 15px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                }
                
                .category-section {
                    margin-bottom: 25px;
                }
                
                .category-title {
                    color: #333;
                    margin-bottom: 15px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e0e0e0;
                    font-size: 1.2em;
                }
                
                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                
                .item-card {
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .item-card:hover:not(.out-of-stock) {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                    border-color: #2196F3;
                }
                
                .item-card.out-of-stock {
                    opacity: 0.6;
                    background: #f5f5f5;
                    border-color: #ccc;
                }
                
                .item-slot {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #2196F3;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .item-name {
                    font-size: 16px;
                    margin: 10px 0;
                    color: #333;
                }
                
                .item-price {
                    font-size: 18px;
                    font-weight: bold;
                    color: #4CAF50;
                    margin: 5px 0;
                }
                
                .item-stock {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 10px;
                }
                
                .buy-item-btn {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    width: 100%;
                }
                
                .buy-item-btn:hover:not(:disabled) {
                    background: #45a049;
                    transform: translateY(-1px);
                }
                
                .buy-item-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .info-section {
                    background: rgba(255,255,255,0.95);
                    padding: 25px;
                    border-radius: 15px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    height: fit-content;
                }
                
                .instruction-step {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .step-number {
                    background: #2196F3;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin-right: 12px;
                    flex-shrink: 0;
                }
                
                .step-text {
                    color: #333;
                    font-size: 14px;
                }
                
                .payment-info {
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                }
                
                .payment-methods {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .payment-method {
                    background: #f0f0f0;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #333;
                }
                
                .machine-status {
                    background: rgba(255,255,255,0.95);
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    margin-top: 20px;
                    max-width: 800px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .status-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                
                .status-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 6px;
                }
                
                .status-label {
                    font-weight: 600;
                    color: #333;
                    font-size: 14px;
                }
                
                .status-value {
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .status-value.connected { color: #4CAF50; }
                .status-value.disconnected { color: #9E9E9E; }
                .status-value.connecting { color: #FF9800; }
                .status-value.error { color: #F44336; }
                
                .qr-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .qr-modal {
                    background: white;
                    border-radius: 15px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                
                .qr-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 25px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .close-modal-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .qr-modal-content {
                    padding: 25px;
                    text-align: center;
                }
                
                .selected-item-info h3 {
                    margin: 0 0 10px 0;
                    color: #333;
                }
                
                .item-slot {
                    color: #666;
                    font-size: 14px;
                }
                
                .item-price-large {
                    font-size: 28px;
                    font-weight: bold;
                    color: #4CAF50;
                    margin: 10px 0;
                }
                
                .qr-instruction {
                    color: #666;
                    margin: 20px 0 10px 0;
                }
                
                .qr-code-container {
                    display: flex;
                    justify-content: center;
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                
                .transaction-id {
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                }
                
                .payment-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-top: 25px;
                }
                
                .cancel-btn, .confirm-payment-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    min-width: 120px;
                }
                
                .cancel-btn {
                    background: #f5f5f5;
                    color: #333;
                    border: 1px solid #ddd;
                }
                
                .confirm-payment-btn {
                    background: #4CAF50;
                    color: white;
                }
                
                .cancel-btn:hover:not(:disabled) {
                    background: #e0e0e0;
                }
                
                .confirm-payment-btn:hover:not(:disabled) {
                    background: #45a049;
                    transform: translateY(-1px);
                }
                
                @media (max-width: 768px) {
                    .vending-container {
                        grid-template-columns: 1fr;
                    }
                    
                    .items-grid {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    }
                    
                    .status-info {
                        grid-template-columns: 1fr;
                    }
                    
                    .connection-buttons {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .settings-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .port-list {
                        grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
                    }
                }
            `}</style>
            
            {/* Toast Notifications */}
            <Toaster
                position="top-center"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                    // Define default options
                    className: '',
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        fontSize: '14px',
                        borderRadius: '8px',
                        padding: '12px 16px',
                    },
                    // Default options for specific types
                    success: {
                        duration: 4000,
                        style: {
                            background: '#48bb78',
                        },
                    },
                    error: {
                        duration: 5000,
                        style: {
                            background: '#f56565',
                        },
                    },
                    loading: {
                        style: {
                            background: '#4299e1',
                        },
                    },
                }}
            />
        </div>
    );
};

export default VendingMachine;
