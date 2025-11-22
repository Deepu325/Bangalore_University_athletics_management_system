/**
 * BU Header & Footer - Single Source of Truth
 * Used across: Website UI, PDFs, Print Sheets, All Stages
 * 
 * Logo location: frontend/public/Bangalore_University_logo.png
 * Use `/Bangalore_University_logo.png` to reference this asset from the app
 */

// HTML versions for print/PDF (template strings)
export const BU_HEADER_HTML = `
  <div class="page-header" style="display:flex;align-items:center;justify-content:flex-start;gap:12px;margin-bottom:10px;border-bottom:2px solid #000;padding-bottom:8px;">
    <img src="/Bangalore_University_logo.png" alt="BU Logo" style="height:60px;width:auto;object-fit:contain;flex-shrink:0;"/>
    <div style="text-align:left;flex:1;">
      <h1 style="margin:0;font-size:18px;font-weight:700;color:#1f2937;">BANGALORE UNIVERSITY</h1>
      <div style="font-size:12px;color:#374151;font-weight:600;">Directorate of Physical Education & Sports</div>
      <div style="font-size:11px;color:#4b5563;">UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056</div>
      <div style="font-size:11px;font-weight:600;color:#1f2937;">61st Inter-Collegiate Athletic Championship 2025–26</div>
      <div style="font-size:9px;font-style:italic;color:#6b7280;">(Developed by SIMS)</div>
    </div>
  </div>
`;

export const BU_FOOTER_HTML = (pageNum = '', totalPages = '') => `
  <div class="page-footer" style="text-align:center;margin-top:12px;font-size:10px;color:#1f2937;border-top:1px solid #d1d5db;padding-top:8px;">
    <p style="margin:2px 0;font-weight:700;">© 2025 Bangalore University | Athletic Meet Management System</p>
    <p style="margin:2px 0;">Developed by: <strong>Deepu K C</strong> | Soundarya Institute of Management and Science (SIMS)</p>
    <p style="margin:2px 0;">Guided By: Dr. Harish P M & Lt. Suresh Reddy M S, PED, SIMS</p>
    <p style="margin:2px 0;">Dr. Venkata Chalapathi | Mr. Chidananda | Dr. Manjanna B P</p>
    ${pageNum && totalPages ? `<p style="margin:3px 0;font-size:9px;color:#6b7280;">Page ${pageNum} of ${totalPages}</p>` : ''}
  </div>
`;

// React component version for website UI
export const BUHeader = () => (
  <header
    style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#fff",
      padding: "20px 30px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      marginBottom: "20px"
    }}
  >
    <img
      src="/Bangalore_University_logo.png"
      alt="BU Logo"
      style={{
        height: "70px",
        width: "auto",
        objectFit: "contain"
      }}
    />
    <div>
      <h1 style={{ margin: "0 0 5px 0", fontSize: "28px", fontWeight: "700" }}>
        BANGALORE UNIVERSITY
      </h1>
      <p style={{ margin: "0 0 3px 0", fontSize: "14px", opacity: "0.95" }}>
        Directorate of Physical Education & Sports
      </p>
      <p style={{ margin: "0 0 3px 0", fontSize: "13px", opacity: "0.9" }}>
        UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056
      </p>
      <p style={{ margin: "0 0 2px 0", fontSize: "13px", fontWeight: "600" }}>
        61st Inter-Collegiate Athletic Championship 2025–26
      </p>
      <p style={{ margin: "0", fontSize: "11px", fontStyle: "italic", opacity: "0.85" }}>
        (Developed by SIMS)
      </p>
    </div>
  </header>
);

export const BUFooter = () => (
  <footer
    style={{
      background: "#1f2937",
      color: "#fff",
      textAlign: "center",
      padding: "20px 15px",
      fontSize: "12px",
      lineHeight: "1.6",
      marginTop: "30px",
      borderTop: "1px solid #374151"
    }}
  >
    <p style={{ margin: "5px 0", fontWeight: "700" }}>
      © 2025 Bangalore University | Athletic Meet Management System
    </p>
    <p style={{ margin: "5px 0" }}>
      Developed by: <strong>Deepu K C</strong> | Soundarya Institute of Management and Science (SIMS)
    </p>
    <p style={{ margin: "5px 0" }}>
      Guided By: Dr. Harish P M & Lt. Suresh Reddy M S, PED, SIMS
    </p>
    <p style={{ margin: "5px 0" }}>
      Dr. Venkata Chalapathi | Mr. Chidananda | Dr. Manjanna B P
    </p>
  </footer>
);

/**
 * Utility to get header HTML (for print functions)
 */
export function getHeaderHTML() {
  return BU_HEADER_HTML;
}

/**
 * Utility to get footer HTML with page numbers (for print functions)
 */
export function getFooterHTML(pageNum = '', totalPages = '') {
  return BU_FOOTER_HTML(pageNum, totalPages);
}
