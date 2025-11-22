/**
 * PDF Formatter & Generator
 * Creates PDF sheets with global header/footer for all events
 */

const {
  GLOBAL_HEADER,
  GLOBAL_FOOTER
} = require('../shared/constants');

class PDFFormatter {
  constructor(eventName, category) {
    this.eventName = eventName;
    this.category = category;
  }

  /**
   * Generate PDF header with logo and event details
   */
  generateHeader() {
    return `
╔════════════════════════════════════════════════════════════════════════════╗
║                          [BU LOGO - TOP LEFT]                              ║
║                       BANGALORE UNIVERSITY                                  ║
║              Directorate of Physical Education & Sports                     ║
║         UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056              ║
║         61st Inter-Collegiate Athletic Championship 2025–26                 ║
║                         (Developed by SIMS)                                ║
╚════════════════════════════════════════════════════════════════════════════╝
    `.trim();
  }

  /**
   * Generate PDF footer
   */
  generateFooter() {
    return `
╔════════════════════════════════════════════════════════════════════════════╗
║     © 2025 Bangalore University | Athletic Meet Management System          ║
║         Developed by: Deepu K C | Soundarya Institute of                   ║
║                    Management and Science (SIMS)                            ║
║     Guided By: Dr. Harish P M & Lt. Suresh Reddy M S, PED, SIMS           ║
║           Dr. Venkata Chalapathi | Mr. Chidananda | Dr. Manjanna B P        ║
╚════════════════════════════════════════════════════════════════════════════╝
    `.trim();
  }

  /**
   * Format table for PDF display
   */
  formatTable(headers, rows, maxCellWidth = 15) {
    let table = '';

    // Header row
    const headerRow = headers.map(h => 
      String(h).substring(0, maxCellWidth).padEnd(maxCellWidth)
    ).join(' | ');
    
    table += headerRow + '\n';
    table += '-'.repeat(headerRow.length) + '\n';

    // Data rows
    rows.forEach(row => {
      const dataRow = headers.map(header => {
        const value = row[header.toLowerCase().replace(/\s+/g, '')] || '';
        return String(value).substring(0, maxCellWidth).padEnd(maxCellWidth);
      }).join(' | ');
      
      table += dataRow + '\n';
    });

    return table;
  }

  /**
   * Generate Call Room PDF
   */
  generateCallRoomPDF(callRoomData) {
    let pdf = this.generateHeader();
    pdf += '\n\nCALL ROOM SHEET\n';
    pdf += `Event: ${this.eventName}\n`;
    pdf += `Category: ${this.category}\n`;
    pdf += `Date: ${new Date().toLocaleDateString()}\n\n`;

    const headers = ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'REMARKS'];
    pdf += this.formatTable(headers, callRoomData);

    pdf += '\n\n' + this.generateFooter();
    return pdf;
  }

  /**
   * Generate Track Officials Sheet PDF
   */
  generateTrackOfficialsPDF(eventSheetData) {
    let pdf = this.generateHeader();
    pdf += '\n\nTRACK OFFICIALS SHEET\n';
    pdf += `Event: ${this.eventName}\n`;
    pdf += `Category: ${this.category}\n`;
    pdf += `Time Format: HH:MM:SS:ML\n`;
    pdf += `Date: ${new Date().toLocaleDateString()}\n\n`;

    const headers = ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'LANE', 'PERFORMANCE', 'REMARKS'];
    pdf += this.formatTable(headers, eventSheetData);

    pdf += '\n\n' + this.generateFooter();
    return pdf;
  }

  /**
   * Generate Field Officials Sheet PDF
   */
  generateFieldOfficialsPDF(eventSheetData, attemptCount = 6) {
    let pdf = this.generateHeader();
    pdf += '\n\nFIELD OFFICIALS SHEET\n';
    pdf += `Event: ${this.eventName}\n`;
    pdf += `Category: ${this.category}\n`;
    pdf += `Attempts: ${attemptCount}\n`;
    pdf += `Date: ${new Date().toLocaleDateString()}\n\n`;

    const headers = ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE'];
    for (let i = 1; i <= attemptCount; i++) {
      headers.push(`A${i}`);
    }
    headers.push('BEST', 'REMARKS');

    pdf += this.formatTable(headers, eventSheetData, 8);

    pdf += '\n\n' + this.generateFooter();
    return pdf;
  }

  /**
   * Generate Relay Officials Sheet PDF
   */
  generateRelayOfficialsPDF(eventSheetData) {
    let pdf = this.generateHeader();
    pdf += '\n\nRELAY OFFICIALS SHEET\n';
    pdf += `Event: ${this.eventName}\n`;
    pdf += `Category: ${this.category}\n`;
    pdf += `Time Format: HH:MM:SS:ML\n`;
    pdf += `Date: ${new Date().toLocaleDateString()}\n\n`;

    const headers = ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'LANE', 'TIME', 'TEAM #', 'LEG POS'];
    pdf += this.formatTable(headers, eventSheetData);

    pdf += '\n\n' + this.generateFooter();
    return pdf;
  }

  /**
   * Generate Results PDF
   */
  generateResultsPDF(results) {
    let pdf = this.generateHeader();
    pdf += '\n\nFINAL RESULTS\n';
    pdf += `Event: ${this.eventName}\n`;
    pdf += `Category: ${this.category}\n`;
    pdf += `Published: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;

    const headers = ['POSITION', 'CHEST NO', 'NAME', 'COLLEGE', 'PERFORMANCE', 'POINTS'];
    pdf += this.formatTable(headers, results);

    pdf += '\n\n' + this.generateFooter();
    return pdf;
  }

  /**
   * Generate Heats Sheet PDF
   */
  generateHeatsPDF(heatsData) {
    let pdf = this.generateHeader();
    pdf += '\n\nHEATS SHEET\n';
    pdf += `Event: ${this.eventName}\n`;
    pdf += `Category: ${this.category}\n`;
    pdf += `Date: ${new Date().toLocaleDateString()}\n\n`;

    heatsData.forEach((heat, idx) => {
      pdf += `\n--- HEAT ${heat.heatNumber || idx + 1} ---\n`;
      const headers = ['LANE', 'CHEST NO', 'NAME', 'COLLEGE'];
      pdf += this.formatTable(headers, heat.athletes || []);
    });

    pdf += '\n\n' + this.generateFooter();
    return pdf;
  }

  /**
   * Generate Combined Event Day Sheet
   */
  generateCombinedEventPDF(sheetData, day = 1, structure = 'Decathlon') {
    let pdf = this.generateHeader();
    pdf += `\n\n${structure.toUpperCase()} - DAY ${day} SHEET\n`;
    pdf += `Event: ${this.eventName}\n`;
    pdf += `Date: ${new Date().toLocaleDateString()}\n\n`;

    const headers = ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'POINTS'];
    pdf += this.formatTable(headers, sheetData);

    pdf += '\n\n' + this.generateFooter();
    return pdf;
  }
}

module.exports = PDFFormatter;
