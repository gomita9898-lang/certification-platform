import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return new NextResponse(renderPage(false, null), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const admin = await createAdminClient();

    const { data: certificate } = await admin
      .from("certificates")
      .select("*")
      .eq("certificate_code", code.toUpperCase())
      .single();

    if (!certificate) {
      return new NextResponse(renderPage(false, null), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", certificate.user_id)
      .single();

    const { data: course } = await admin
      .from("courses")
      .select("title_pt, title_en")
      .eq("id", certificate.course_id)
      .single();

    const issuedDate = new Intl.DateTimeFormat("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(certificate.issued_at));

    return new NextResponse(
      renderPage(true, {
        studentName: profile?.full_name ?? "",
        courseTitlePt: course?.title_pt ?? "",
        courseTitleEn: course?.title_en ?? "",
        score: Math.round(certificate.score_percentage),
        issuedDate,
        certCode: certificate.certificate_code,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Certificate verification error:", error);
    return new NextResponse(renderPage(false, null), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

interface CertInfo {
  studentName: string;
  courseTitlePt: string;
  courseTitleEn: string;
  score: number;
  issuedDate: string;
  certCode: string;
}

function renderPage(verified: boolean, cert: CertInfo | null): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!verified || !cert) {
    return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificação de Certificado</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
  <style>${sharedStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header header-error">
        <div class="icon-circle icon-error">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h1>Certificado Não Encontrado</h1>
        <p class="header-sub">Certificate Not Found</p>
      </div>
      <div class="body">
        <p class="message">O código de certificação fornecido não corresponde a nenhum certificado válido no nosso sistema.</p>
        <p class="message-en">The certification code provided does not match any valid certificate in our system.</p>
      </div>
      <div class="footer">
        <a href="${appUrl}" class="link">Universidade da Beira Interior — Plataforma de Certificação</a>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado Verificado — ${cert.studentName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
  <style>${sharedStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header header-success">
        <div class="icon-circle icon-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h1>Certificado Verificado</h1>
        <p class="header-sub">Certificate Verified</p>
      </div>

      <div class="body">
        <div class="verified-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Este certificado é autêntico e foi emitido pela Universidade da Beira Interior.
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Titular / Holder</span>
            <span class="info-value name">${cert.studentName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Curso / Course</span>
            <span class="info-value">${cert.courseTitlePt}</span>
            <span class="info-value-secondary">${cert.courseTitleEn}</span>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">Pontuação / Score</span>
              <span class="info-value score">${cert.score}%</span>
            </div>
            <div class="info-item">
              <span class="info-label">Data de Emissão / Issue Date</span>
              <span class="info-value">${cert.issuedDate}</span>
            </div>
          </div>
          <div class="info-item">
            <span class="info-label">ID de Certificação / Certification ID</span>
            <span class="info-value code">${cert.certCode}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <img src="https://lugaresdapaisagem.ubi.pt/page-2/files/logo_ubi_vhorizontalb.png" alt="UBI" class="footer-logo" />
        <a href="${appUrl}" class="link">Universidade da Beira Interior — Plataforma de Certificação</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function sharedStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #f0f2f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container { width: 100%; max-width: 540px; }
    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      padding: 32px 24px;
      text-align: center;
      color: #fff;
    }
    .header-success { background: linear-gradient(135deg, #1a3a6b, #2a5298); }
    .header-error { background: linear-gradient(135deg, #8B1A1A, #c0392b); }
    .icon-circle {
      width: 56px; height: 56px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .icon-success { background: rgba(255,255,255,0.15); color: #4ade80; }
    .icon-error { background: rgba(255,255,255,0.15); color: #fca5a5; }
    .header h1 {
      font-family: 'Merriweather', serif;
      font-size: 22px; font-weight: 700;
      margin-bottom: 4px;
    }
    .header-sub {
      font-size: 14px;
      opacity: 0.8;
      font-style: italic;
    }
    .body { padding: 28px 24px; }
    .verified-badge {
      display: flex; align-items: center; gap: 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
      color: #166534;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .verified-badge svg { flex-shrink: 0; color: #16a34a; }
    .info-grid { display: flex; flex-direction: column; gap: 20px; }
    .info-row { display: flex; gap: 20px; }
    .info-row .info-item { flex: 1; }
    .info-item { }
    .info-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .info-value {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    .info-value.name {
      font-family: 'Merriweather', serif;
      font-size: 20px;
      color: #1a3a6b;
    }
    .info-value.score {
      font-size: 24px;
      color: #1a3a6b;
    }
    .info-value.code {
      font-family: monospace;
      font-size: 15px;
      letter-spacing: 2px;
      color: #475569;
    }
    .info-value-secondary {
      display: block;
      font-size: 14px;
      color: #64748b;
      font-style: italic;
      margin-top: 2px;
    }
    .message {
      font-size: 15px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .message-en {
      font-size: 14px;
      color: #94a3b8;
      font-style: italic;
      line-height: 1.6;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 20px 24px;
      text-align: center;
    }
    .footer-logo {
      height: 40px;
      margin-bottom: 8px;
    }
    .link {
      font-size: 12px;
      color: #94a3b8;
      text-decoration: none;
      display: block;
    }
    .link:hover { color: #1a3a6b; }
  `;
}
