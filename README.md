# 🤖 LIA - Chatbot IA WhatsApp Business

> Assistente virtual inteligente com **Google Gemini 3.1 Flash Lite**, transcrição e interpretação multimodal de **áudio de voz**, respostas instantâneas (< 20ms) via base de conhecimento e integração completa com a **Meta WhatsApp Cloud API**.

---

## 🚀 Como subir este projeto no GitHub

Se você já possui o Git instalado na sua máquina, siga estes passos simples no terminal dentro da pasta do projeto:

```bash
# 1. Inicialize o repositório git (caso ainda não esteja inicializado)
git init

# 2. Adicione todos os arquivos
git add .

# 3. Crie o seu commit inicial
git commit -m "feat: setup completo da LIA com Vercel Serverless e WhatsApp Cloud API"

# 4. Renomeie a branch para main
git branch -M main

# 5. Conecte ao seu repositório no GitHub (substitua pela sua URL do GitHub)
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git

# 6. Envie o código
git push -u origin main
```

---

## ⚡ Como fazer Deploy na Vercel (Em menos de 2 minutos)

O projeto já está 100% configurado para a Vercel com o arquivo `vercel.json` e as Serverless Functions prontas em `/api`.

### Passo a Passo na Vercel:

1. Acesse **[vercel.com](https://vercel.com)** e faça login com sua conta do GitHub.
2. Clique no botão **"Add New..."** > **"Project"**.
3. Selecione o repositório que você acabou de subir no GitHub e clique em **"Import"**.
4. Nas configurações do projeto:
   - **Framework Preset**: O Vercel detectará automaticamente **Vite**.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Na seção **Environment Variables** (Variáveis de Ambiente), adicione:
   - **`GEMINI_API_KEY`**: Sua chave de API do Google Gemini (obtenha gratuitamente em [Google AI Studio](https://aistudio.google.com/app/apikey)).
   - **`WHATSAPP_VERIFY_TOKEN`**: Pode usar `lia_token_whatsapp_2026` ou qualquer token seguro que preferir.
   - *(Opcional)* **`WHATSAPP_ACCESS_TOKEN`**: Token permanente do Meta Developers (caso queira que a Lia responda clientes no número oficial da sua empresa).
   - *(Opcional)* **`WHATSAPP_PHONE_NUMBER_ID`**: ID do número de telefone no painel da Meta.
   - *(Opcional)* **`BUSINESS_PHONE`**: `+55 67 99317-4612` (ou o número de atendimento humano).
6. Clique em **"Deploy"**!

Em cerca de 30 a 60 segundos, seu chatbot estará no ar com uma URL HTTPS segura (exemplo: `https://seu-projeto.vercel.app`).

---

## 🔗 Configuração do Webhook na Meta (WhatsApp Cloud API)

Assim que o deploy na Vercel finalizar:

1. Acesse o **[Meta for Developers](https://developers.facebook.com/)**.
2. Abra seu App > Menu lateral **WhatsApp** > **Configuration**.
3. No campo **Webhook**, clique em **Edit** e preencha:
   - **Callback URL**: `https://seu-projeto.vercel.app/api/webhook/whatsapp`
   - **Verify Token**: `lia_token_whatsapp_2026` (ou o mesmo que você colocou nas variáveis da Vercel).
4. Clique em **Verify and Save**.
5. No bloco **Webhook Fields**, clique em **Manage** e ative a caixa de seleção do campo **`messages`**.

Pronto! Agora qualquer cliente que mandar mensagem de texto ou áudio para o seu WhatsApp oficial receberá respostas automáticas da LIA em tempo real.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Motion.
- **Backend**: Node.js, Express, Vercel Serverless Functions (`/api/index.ts`).
- **Inteligência Artificial**: Google GenAI SDK (`gemini-3.1-flash-lite` com latência mínima e processamento de áudio).
- **Mecanismo de Contingência**: Casamento de termos locais sub-20ms garantindo 100% de disponibilidade mesmo sem conexão com a IA.
- **Áudio**: Gravação de áudio no navegador via MediaRecorder e reprodução em balões idênticos ao WhatsApp.
