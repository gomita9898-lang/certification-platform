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
    width: 120,
    margin: 1,
    color: { dark: "#1a3a6b", light: "#ffffff" },
  });

  const courseTitle = isPt ? data.courseTitlePt : data.courseTitleEn;
  const issuedDate = new Intl.DateTimeFormat(isPt ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(data.issuedAt));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Inter:wght@400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', sans-serif;
          background: #ffffff;
        }

        .certificate {
          width: 297mm;
          height: 210mm;
          padding: 20mm;
          position: relative;
          background: #ffffff;
          overflow: hidden;
        }

        .border-frame {
          position: absolute;
          top: 10mm;
          left: 10mm;
          right: 10mm;
          bottom: 10mm;
          border: 2px solid #1a3a6b;
        }

        .border-frame-inner {
          position: absolute;
          top: 13mm;
          left: 13mm;
          right: 13mm;
          bottom: 13mm;
          border: 1px solid #c9a94e;
        }

        .content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
        }

        .institution {
          font-family: 'Inter', sans-serif;
          font-size: 12pt;
          font-weight: 600;
          color: #1a3a6b;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 8mm;
        }

        .title {
          font-family: 'Merriweather', serif;
          font-size: 28pt;
          font-weight: 700;
          color: #1a3a6b;
          margin-bottom: 6mm;
        }

        .subtitle {
          font-size: 11pt;
          color: #666;
          margin-bottom: 10mm;
        }

        .student-name {
          font-family: 'Merriweather', serif;
          font-size: 22pt;
          font-weight: 700;
          color: #1a3a6b;
          border-bottom: 2px solid #c9a94e;
          padding-bottom: 3mm;
          margin-bottom: 8mm;
          min-width: 120mm;
        }

        .course-label {
          font-size: 10pt;
          color: #666;
          margin-bottom: 3mm;
        }

        .course-name {
          font-family: 'Merriweather', serif;
          font-size: 14pt;
          font-weight: 400;
          color: #333;
          margin-bottom: 10mm;
        }

        .details {
          display: flex;
          justify-content: center;
          gap: 20mm;
          margin-bottom: 8mm;
        }

        .detail-item {
          text-align: center;
        }

        .detail-label {
          font-size: 8pt;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 2mm;
        }

        .detail-value {
          font-size: 11pt;
          font-weight: 600;
          color: #333;
        }

        .footer {
          position: absolute;
          bottom: 18mm;
          left: 25mm;
          right: 25mm;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .issuer {
          text-align: left;
        }

        .issuer-name {
          font-size: 11pt;
          font-weight: 600;
          color: #333;
          border-top: 1px solid #333;
          padding-top: 2mm;
        }

        .issuer-title {
          font-size: 9pt;
          color: #666;
        }

        .qr-section {
          text-align: center;
        }

        .qr-code img {
          width: 25mm;
          height: 25mm;
        }

        .cert-code {
          font-family: 'Inter', sans-serif;
          font-size: 8pt;
          color: #999;
          letter-spacing: 2px;
          margin-top: 2mm;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="border-frame"></div>
        <div class="border-frame-inner"></div>

        <div class="content">
          ${data.institutionName ? `<div class="institution">${data.institutionName}</div>` : ""}

          <div class="title">${isPt ? "Certificado de Conclusão" : "Certificate of Completion"}</div>

          <div class="subtitle">
            ${isPt ? "Este certificado é atribuído a" : "This certificate is awarded to"}
          </div>

          <div class="student-name">${data.studentName}</div>

          <div class="course-label">
            ${isPt ? "pela conclusão com sucesso do curso" : "for the successful completion of the course"}
          </div>

          <div class="course-name">${courseTitle}</div>

          <div class="details">
            <div class="detail-item">
              <div class="detail-label">${isPt ? "Data de Emissão" : "Issue Date"}</div>
              <div class="detail-value">${issuedDate}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">${isPt ? "Pontuação Final" : "Final Score"}</div>
              <div class="detail-value">${Math.round(data.scorePercentage)}%</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">${isPt ? "ID de Certificação" : "Certification ID"}</div>
              <div class="detail-value">${data.certificateCode}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="issuer">
            ${data.issuerName ? `<div class="issuer-name">${data.issuerName}</div>` : ""}
          </div>

          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
            </div>
            <div class="cert-code">${data.certificateCode}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
