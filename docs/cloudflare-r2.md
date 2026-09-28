# Cloudflare R2

O Exporta Brasil segue o mesmo padrão do Jinvo ERP: o navegador manda a foto para a API autenticada e somente a API escreve no R2. A aplicação e o banco guardam apenas a URL pública resultante.

## Criar o bucket

1. Abra o painel da Cloudflare e entre em **R2 Object Storage**.
2. Clique em **Create bucket**.
3. Use o nome `exporta-brasil-assets`.
4. Crie o bucket na localização padrão disponível para sua conta.
5. Em **Settings → Custom Domains**, associe `assets.exportabrasil.com.br` ou outro subdomínio que esteja na mesma zona Cloudflare. O painel cria o CNAME automaticamente.

## Criar o token do bucket

1. Em **R2 → Manage API Tokens**, clique em **Create API token**.
2. Selecione **Object Read & Write**.
3. Limite o token ao bucket `exporta-brasil-assets`.
4. Copie imediatamente o **Access Key ID**, **Secret Access Key** e o **S3 API Endpoint**. O segredo só é exibido uma vez.

## Configurar no Railway

No serviço da API, em staging e produção, informe:

```env
R2_ENDPOINT=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=exporta-brasil-assets
R2_PUBLIC_URL=https://assets.exportabrasil.com.br
```

O valor de `R2_PUBLIC_URL` deve ser o domínio público configurado no bucket, sem barra ao final.

## CORS

Não é necessário liberar CORS para `PUT` no bucket. Diferente de um upload direto por URL assinada, o client envia o arquivo à API e ela grava no R2, como no Jinvo. O domínio público serve as imagens normalmente em tags `<img>`.

A API aceita fotos JPG, PNG e WebP de até 1 MB e grava em `profiles/<id-do-usuario>/`.
