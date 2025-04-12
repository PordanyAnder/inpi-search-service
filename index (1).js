
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.post('/consulta', async (req, res) => {
  const { nomeMarca } = req.body;

  console.log("🔍 Iniciando busca para:", nomeMarca);

  if (!nomeMarca) {
    return res.status(400).json({ erro: 'nomeMarca não informado' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 1. Acessa a página de pesquisa inicial
    await page.goto('https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_classe_basica.jsp', { waitUntil: 'domcontentloaded' });

    // 2. Clica no botão "Continuar"
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('input[type="submit"][value=" Continuar » "]')
    ]);

    // 3. Clica na imagem "Marcas" (área do mapa de imagem)
    await page.waitForSelector('area[href="/pePI/jsp/marcas/Pesquisa_num_processo.jsp"]', { timeout: 5000 });
    await page.evaluate(() => {
      document.querySelector('area[href="/pePI/jsp/marcas/Pesquisa_num_processo.jsp"]').click();
    });
    await page.waitForTimeout(1000); // pequena pausa

    // 4. Clica na opção "Marca"
    await page.waitForSelector('a[href="../marcas/Pesquisa_classe_basica.jsp"]', { timeout: 5000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('a[href="../marcas/Pesquisa_classe_basica.jsp"]')
    ]);

    // 5. Preenche o campo "Marca:" com o nome informado
    await page.waitForSelector('input[name="marca"]', { timeout: 5000 });
    await page.type('input[name="marca"]', nomeMarca);

    // 6. Retorna confirmação
    await browser.close();
    res.json({ status: "ok", mensagem: `Marca '${nomeMarca}' preenchida no campo com sucesso.` });

  } catch (error) {
    console.error("❌ Erro ao buscar no INPI:", error.message);
    res.status(500).json({ erro: 'Erro ao processar consulta no INPI', detalhe: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Microserviço INPI rodando na porta ${PORT}`);
});
