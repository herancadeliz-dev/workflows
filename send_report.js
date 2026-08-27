const puppeteer = require('puppeteer');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function run() {
  console.log('Iniciando captura do relatório...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  // Substitua pela URL exata onde seu HTML está hospedado (ex: Netlify)
  await page.goto('https://cargoops.netlify.app', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  const imageBuffer = await page.screenshot({ fullPage: true });
  await browser.close();

  console.log('Print capturado. Enviando e-mail via Resend...');

  const data = await resend.emails.send({
    from: 'onboarding@resend.dev', // Use este remetente padrão se não configurou domínio próprio
    to: ['SEU_EMAIL_AQUI@dominio.com'], // Insira os e-mails de destino aqui
    subject: `CargoOps — Relatório Operacional GRU (${new Date().toLocaleDateString('pt-BR')})`,
    html: `
      <h2>Relatório Operacional CargoOps GRU</h2>
      <p>Segue abaixo o print atualizado do estoque.</p>
      <img src="cid:screenshot" style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px;" />
    `,
    attachments: [
      {
        filename: 'relatorio.png',
        content: imageBuffer,
        cid: 'screenshot',
      },
    ],
  });

  console.log('E-mail enviado com sucesso:', data);
}

run().catch(console.error);
