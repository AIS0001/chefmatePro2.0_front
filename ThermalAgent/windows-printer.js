const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Windows Printer Module
 * Prints raw data to Windows default printer or specified printer
 */

class WindowsPrinter {
  /**
   * Get default Windows printer name
   */
  getDefaultPrinter() {
    try {
      const output = execSync('powershell -Command "(Get-WmiObject -Query \\"SELECT * FROM Win32_Printer WHERE Default=$true\\").Name"', {
        encoding: 'utf8',
        timeout: 5000
      });
      return output.trim();
    } catch (error) {
      console.error('❌ Failed to get default printer:', error.message);
      return null;
    }
  }

  /**
   * List all Windows printers
   */
  listPrinters() {
    try {
      const output = execSync('powershell -Command "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | ConvertTo-Json"', {
        encoding: 'utf8',
        timeout: 5000
      });
      
      const printers = JSON.parse(output);
      return Array.isArray(printers) ? printers : [printers];
    } catch (error) {
      console.error('❌ Failed to list printers:', error.message);
      return [];
    }
  }

  /**
   * Print raw data using Windows Print Spooler API
   * @param {Buffer} data - Raw print data
   * @param {string} printerName - Printer name
   */
  async printViaSpooler(data, printerName) {
    const tempFile = path.join(os.tmpdir(), `print_${Date.now()}.prn`);
    const psScript = path.join(os.tmpdir(), `print_spooler_${Date.now()}.ps1`);
    
    try {
      fs.writeFileSync(tempFile, data);
      
      const psContent = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Printing

$printerName = "${printerName.replace(/"/g, '`"')}"
$filePath = "${tempFile.replace(/\\/g, '\\\\')}"

try {
    Write-Host "Initializing raw print job..."
    
    # Read the raw data
    $rawData = [System.IO.File]::ReadAllBytes($filePath)
    Write-Host "Data size: $($rawData.Length) bytes"
    
    # Create a print job using Windows Spooler
    $printerSettings = New-Object System.Drawing.Printing.PrinterSettings
    $printerSettings.PrinterName = $printerName
    
    # Check if printer exists
    if (-not $printerSettings.IsValid) {
        throw "Printer '$printerName' not found or not available"
    }
    
    Write-Host "Printer is valid and available"
    
    # Use .NET printing namespace for raw data
    $printQueue = New-Object System.Printing.LocalPrintServer
    $printer = $printQueue.GetPrintQueue($printerName)
    
    # Create print job
    $printJob = $printer.AddJob("RAW_Print_Job")
    $stream = $printJob.JobStream
    
    # Write raw bytes to the stream
    $stream.Write($rawData, 0, $rawData.Length)
    $stream.Close()
    
    Write-Host "Print job submitted successfully (Job ID: $($printJob.JobIdentifier))"
    exit 0
}
catch {
    Write-Error "Print error: $($_.Exception.Message)"
    exit 1
}
`;
      
      fs.writeFileSync(psScript, psContent);
      
      const output = execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, {
        encoding: 'utf8',
        timeout: 30000
      });
      
      console.log('📄 Spooler output:', output.trim());
      console.log('✅ Print job submitted via Windows Spooler');
      
      // Clean up
      try {
        fs.unlinkSync(tempFile);
        fs.unlinkSync(psScript);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return {
        success: true,
        method: 'windows-spooler',
        printer: printerName
      };
      
    } catch (error) {
      // Clean up on error
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        if (fs.existsSync(psScript)) fs.unlinkSync(psScript);
      } catch (e) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Print raw data to Windows printer
   * @param {Buffer} data - Raw print data
   * @param {string} printerName - Printer name (optional, uses default if not specified)
   */
  async print(data, printerName = null) {
    try {
      const targetPrinter = printerName || this.getDefaultPrinter();
      
      if (!targetPrinter) {
        throw new Error('No printer specified and no default printer found');
      }

      console.log(`🖨️  Printing to: ${targetPrinter}`);
      console.log(`📦 Data size: ${data.length} bytes`);

      // Method 1: Try Windows Print Spooler API (most reliable for thermal printers)
      try {
        console.log('🔧 Method 1: Windows Print Spooler API...');
        return await this.printViaSpooler(data, targetPrinter);
      } catch (spoolerError) {
        console.log('⚠️  Spooler method failed:', spoolerError.message);
      }

      // Method 2: Try direct copy to printer port
      const tempFile = path.join(os.tmpdir(), `print_${Date.now()}.prn`);
      fs.writeFileSync(tempFile, data);

      try {
        console.log('🔧 Method 2: Direct port access...');
        const printerInfo = execSync(`powershell -Command "(Get-Printer -Name '${targetPrinter.replace(/'/g, "''")}').PortName"`, {
          encoding: 'utf8',
          timeout: 5000
        }).trim();

        if (printerInfo) {
          console.log(`📌 Printer port: ${printerInfo}`);
          
          // Use copy command for raw printing
          const copyOutput = execSync(`cmd /c copy /b "${tempFile}" "${printerInfo}"`, {
            encoding: 'utf8',
            timeout: 30000
          });
          
          console.log('📄 Copy output:', copyOutput.trim());
          console.log('✅ Print job sent successfully to printer port');
          
          // Clean up temp file
          try {
            fs.unlinkSync(tempFile);
          } catch (e) {
            // Ignore cleanup errors
          }

          return {
            success: true,
            method: 'windows-raw',
            printer: targetPrinter,
            port: printerInfo
          };
        }

      } catch (printError) {
        console.log('⚠️  Direct port method failed:', printError.message);
        
        // Method 3: Use PowerShell with proper escaping
        console.log('🔧 Method 3: PowerShell file write...');
        const psScript = path.join(os.tmpdir(), `print_${Date.now()}.ps1`);
        const psContent = `
$ErrorActionPreference = 'Stop'
$printerName = "${targetPrinter.replace(/"/g, '`"')}"
$filePath = "${tempFile.replace(/\\/g, '\\')}"

try {
    # Get printer port
    $printer = Get-Printer -Name $printerName
    $port = $printer.PortName
    
    Write-Host "Printer: $printerName"
    Write-Host "Port: $port"
    
    # Read file as bytes
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    Write-Host "Data size: $($bytes.Length) bytes"
    
    # Write directly to printer port
    [System.IO.File]::WriteAllBytes($port, $bytes)
    
    Write-Host "Print sent successfully"
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
`;
        
        fs.writeFileSync(psScript, psContent);
        
        try {
          const psOutput = execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, {
            encoding: 'utf8',
            timeout: 30000
          });

          console.log('📄 PowerShell output:', psOutput.trim());
          console.log('✅ Print job sent via PowerShell method');
          
          // Clean up temp files
          try {
            fs.unlinkSync(tempFile);
            fs.unlinkSync(psScript);
          } catch (e) {
            // Ignore cleanup errors
          }

          return {
            success: true,
            method: 'windows-powershell',
            printer: targetPrinter
          };
        } catch (psError) {
          console.error('❌ PowerShell method also failed:', psError.message);
          
          // Clean up temp files
          try {
            fs.unlinkSync(tempFile);
            fs.unlinkSync(psScript);
          } catch (e) {
            // Ignore cleanup errors
          }
          throw psError;
        }
      }

    } catch (error) {
      console.error('❌ All Windows print methods failed:', error.message);
      throw error;
    }
  }
}

module.exports = WindowsPrinter;
