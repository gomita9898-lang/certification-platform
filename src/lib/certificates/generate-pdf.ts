import QRCode from "qrcode";

export interface CertificateData {
  studentName: string;
  courseTitlePt: string;
  courseTitleEn: string;
  scorePercentage: number;
  certificateCode: string;
  issuedAt: string;
  issuerName: string;
  institutionName: string;
  verificationUrl: string;
  locale: string;
}

export async function generateCertificateHTML(data: CertificateData): Promise<string> {
  const isPt = data.locale === "pt";
  const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
    width: 100,
    margin: 1,
    color: { dark: "#1a3a6b", light: "#ffffff" },
  });

  const courseTitle = isPt ? data.courseTitlePt : data.courseTitleEn;
  const issuedDate = new Intl.DateTimeFormat(isPt ? "pt-PT" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(data.issuedAt));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificate - ${data.studentName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400;1,700&family=Inter:wght@400;500;600;700&family=Dancing+Script:wght@400;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: A4 landscape;
          margin: 0;
        }

        body {
          font-family: 'Inter', sans-serif;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .certificate {
          width: 297mm;
          height: 210mm;
          position: relative;
          background: #ffffff;
          overflow: hidden;
        }

        /* Outer border — dark red like Harvard */
        .border-outer {
          position: absolute;
          top: 6mm;
          left: 6mm;
          right: 6mm;
          bottom: 6mm;
          border: 3px solid #8B1A1A;
        }

        /* Inner border — thinner dark red */
        .border-inner {
          position: absolute;
          top: 10mm;
          left: 10mm;
          right: 10mm;
          bottom: 10mm;
          border: 1px solid #8B1A1A;
        }

        .content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 18mm 30mm 15mm 30mm;
          height: 100%;
          text-align: center;
        }

        /* UBI Logo */
        .logo-section {
          margin-bottom: 4mm;
        }

        .logo-section img {
          height: 22mm;
          object-fit: contain;
        }

        /* Institution name */
        .institution-name {
          font-family: 'Merriweather', serif;
          font-size: 26pt;
          font-weight: 900;
          color: #1a1a1a;
          letter-spacing: 1px;
          margin-bottom: 2mm;
        }

        .institution-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 11pt;
          font-weight: 500;
          color: #444;
          letter-spacing: 1.5px;
          margin-bottom: 8mm;
        }

        /* "acknowledges that" */
        .acknowledges {
          font-family: 'Merriweather', serif;
          font-style: italic;
          font-size: 11pt;
          color: #666;
          margin-bottom: 4mm;
        }

        /* Student name */
        .student-name {
          font-family: 'Merriweather', serif;
          font-size: 24pt;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 5mm;
          padding: 2mm 8mm;
        }

        /* "has earned the" */
        .has-earned {
          font-family: 'Merriweather', serif;
          font-style: italic;
          font-size: 11pt;
          color: #666;
          margin-bottom: 4mm;
        }

        /* Course name */
        .course-name {
          font-family: 'Merriweather', serif;
          font-size: 18pt;
          font-weight: 700;
          font-style: italic;
          color: #8B1A1A;
          margin-bottom: 4mm;
          padding: 1mm 6mm;
        }

        /* Certificate of Achievement */
        .achievement-label {
          font-family: 'Dancing Script', cursive;
          font-size: 20pt;
          color: #444;
          margin-bottom: 6mm;
        }

        /* Signatures section */
        .signatures-section {
          position: absolute;
          bottom: 18mm;
          left: 25mm;
          right: 25mm;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .signature-block {
          text-align: center;
          min-width: 65mm;
        }

        .signature-line {
          font-family: 'Dancing Script', cursive;
          font-size: 18pt;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1mm;
        }

        .signature-name {
          font-family: 'Inter', sans-serif;
          font-size: 9pt;
          font-weight: 600;
          color: #333;
          border-top: 1px solid #333;
          padding-top: 2mm;
          margin-bottom: 1mm;
        }

        .signature-title {
          font-family: 'Inter', sans-serif;
          font-size: 7.5pt;
          font-style: italic;
          color: #666;
          line-height: 1.4;
        }

        /* Date centered at bottom */
        .date-section {
          position: absolute;
          bottom: 18mm;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }

        .date-text {
          font-family: 'Merriweather', serif;
          font-size: 10pt;
          color: #444;
        }

        /* QR code & cert ID — bottom right corner inside border */
        .qr-section {
          position: absolute;
          bottom: 14mm;
          right: 18mm;
          text-align: center;
        }

        .qr-section img {
          width: 18mm;
          height: 18mm;
        }

        .cert-code {
          font-family: 'Inter', sans-serif;
          font-size: 6.5pt;
          color: #999;
          letter-spacing: 1px;
          margin-top: 1mm;
        }

        /* Score badge */
        .score-badge {
          position: absolute;
          top: 14mm;
          right: 18mm;
          background: #f0f4f8;
          border: 1px solid #d0d8e0;
          border-radius: 3mm;
          padding: 2mm 4mm;
          text-align: center;
        }

        .score-label {
          font-size: 6.5pt;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .score-value {
          font-size: 14pt;
          font-weight: 700;
          color: #1a3a6b;
        }

        /* Print button - hidden when printing */
        .print-actions {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          gap: 10px;
        }

        .print-actions button {
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        .btn-print {
          background: #1a3a6b;
          color: white;
        }

        .btn-print:hover {
          background: #142d54;
        }

        @media print {
          .print-actions { display: none !important; }
          body { background: white; }
        }
      </style>
    </head>
    <body>
      <div class="print-actions">
        <button class="btn-print" onclick="window.print()">
          ${isPt ? "Imprimir / Guardar PDF" : "Print / Save PDF"}
        </button>
      </div>

      <div class="certificate">
        <div class="border-outer"></div>
        <div class="border-inner"></div>

        <!-- Score badge -->
        <div class="score-badge">
          <div class="score-label">${isPt ? "Pontuação" : "Score"}</div>
          <div class="score-value">${Math.round(data.scorePercentage)}%</div>
        </div>

        <div class="content">
          <!-- UBI Logo -->
          <div class="logo-section">
            <img src="https://lugaresdapaisagem.ubi.pt/page-2/files/logo_ubi_vhorizontalb.png" alt="Universidade da Beira Interior" crossorigin="anonymous" />
          </div>

          <!-- Institution -->
          <div class="institution-name">UNIVERSIDADE DA BEIRA INTERIOR</div>
          <div class="institution-subtitle">Faculdade de Ciências da Saúde</div>

          <!-- Acknowledges -->
          <div class="acknowledges">
            ${isPt ? "reconhece que" : "acknowledges that"}
          </div>

          <!-- Student Name -->
          <div class="student-name">${data.studentName}</div>

          <!-- Has earned -->
          <div class="has-earned">
            ${isPt ? "concluiu com sucesso o curso" : "has earned the"}
          </div>

          <!-- Course Name -->
          <div class="course-name">${courseTitle}</div>

          <!-- Certificate of Achievement -->
          <div class="achievement-label">
            ${isPt ? "Certificado de Conclusão" : "Certificate of Achievement"}
          </div>
        </div>

        <!-- Signatures -->
        <div class="signatures-section">
          <!-- Left signature — President -->
          <div class="signature-block">
            <div class="signature-line">Marcelo R. de Sousa</div>
            <div class="signature-name">Marcelo Rebelo de Sousa</div>
            <div class="signature-title">
              ${isPt ? "Presidente da República Portuguesa" : "President of the Portuguese Republic"}
            </div>
          </div>

          <!-- Date in center -->
          <div style="text-align: center; min-width: 50mm;">
            <div class="date-text">${issuedDate}</div>
          </div>

          <!-- Right signature — Prime Minister -->
          <div class="signature-block">
            <div class="signature-line">Luís Montenegro</div>
            <div class="signature-name">Luís Montenegro</div>
            <div class="signature-title">
              ${isPt ? "Primeiro-Ministro de Portugal" : "Prime Minister of Portugal"}
            </div>
          </div>
        </div>

        <!-- QR Code -->
        <div class="qr-section">
          <img src="${qrCodeDataUrl}" alt="QR Code" />
          <div class="cert-code">${data.certificateCode}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
