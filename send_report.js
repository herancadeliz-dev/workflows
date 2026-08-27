const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

// Lista de e-mails da equipe
const listaEmails = [
  'franco.daffos@mercadolivre.com',
  'luciano.jaqueira@mercadolivre.com',
  'robson.hribeiro@mercadolivre.com',
  'sabrina.macedo@mercadolivre.com',
  'ignacio.anavalon@mercadolibre.cl',
  'renan.tisiani@mercadolivre.com'
];

async function run() {
  console.log('Iniciando o navegador invisível...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  // Define o tamanho da tela para capturar todo o relatório
  await page.setViewport({ width: 1280, height: 1024 });

  console.log('Acessando o sistema CargoOps...');
  await page.goto('https://reportestoque.netlify.app', { waitUntil: 'networkidle2' });

  // Aguarda 4 segundos para a primeira carga do Firebase
  await new Promise(r => setTimeout(r, 4000));

  console.log('Acionando o botão Gerar snapshot...');
  await page.evaluate(() => {
    // Localiza e clica no botão "Gerar snapshot" no topo da página
    const botoes = Array.from(document.querySelectorAll('button'));
    const btnSnapshot = botoes.find(b => 
      b.textContent.includes('Gerar snapshot') || 
      b.getAttribute('onclick')?.includes('tirarSnapshot')
    );
    if (btnSnapshot) {
      btnSnapshot.click();
    }
  });

  // Aguarda 5 segundos para o Firebase atualizar e desenhar as tabelas na tela
  console.log('Aguardando processamento e atualização das tabelas...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('Capturando imagem da tela...');
  const imageBuffer = await page.screenshot({ fullPage: true });
  await browser.close();

  console.log('Autenticando no Gmail e enviando mensagem...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const dataAtual = new Date().toLocaleDateString('pt-BR');

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
        cid: 'screenshot',
      },
    ],
  });

  console.log('E-mail enviado com sucesso! ID da mensagem:', info.messageId);
}

run().catch(console.error);
