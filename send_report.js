const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

// Lista de destinatários
const listaEmails = [
  'franco.daffos@mercadolivre.com',
  'luciano.jaqueira@mercadolivre.com',
  'robson.hribeiro@mercadolivre.com',
  'sabrina.macedo@mercadolivre.com',
  'ignacio.anavalon@mercadolibre.cl',
  'renan.tisiani@mercadolivre.com'
];

async function run() {
  console.log('Iniciando captura do relatório...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  // Abre o relatório
  await page.goto('https://cargoops.netlify.app', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  const imageBuffer = await page.screenshot({ fullPage: true });
  await browser.close();

  console.log('Print capturado. Configurando envio pelo Gmail...');

  // Configuração do servidor de e-mail do Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const dataAtual = new Date().toLocaleDateString('pt-BR');

  // Envio do e-mail para toda a lista
  const info = await transporter.sendMail({
    from: `"CargoOps Relatórios" <${process.env.GMAIL_USER}>`,
    to: listaEmails.join(', '),
    subject: `CargoOps — Relatório Operacional GRU (${dataAtual})`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Relatório Operacional CargoOps GRU</h2>
        <p>Segue abaixo o status atualizado do estoque em GRU tirado automaticamente.</p>
        <div style="margin-top: 15px;">
          <img src="cid:screenshot" style="max-width: 100%; border: 1px solid #E5E7EB; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        </div>
        <p style="font-size: 11px; color: #777; margin-top: 20px;">Enviado automaticamente via CargoOps System.</p>
      </div>
    `,
    attachments: [
      {
        filename: `relatorio_gru_${dataAtual}.png`,
        content: imageBuffer,
        cid: 'screenshot', // Exibe a imagem dentro do corpo do e-mail
      },
    ],
  });

  console.log('E-mail enviado com sucesso para toda a lista! ID:', info.messageId);
}

run().catch(console.error);
