# Cloudflare R2

O backend gera URLs assinadas de curta duração para que o navegador envie fotos diretamente ao bucket. As credenciais do R2 ficam somente no serviço da API no Railway.

## Variáveis no Railway

Configure no serviço da API:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET=exporta-brasil-assets`
- `R2_PUBLIC_URL=https://assets.seudominio.com`

Crie um token de API do R2 com permissão **Object Read & Write**, limitado ao bucket `exporta-brasil-assets`.

## Domínio público

Associe um domínio público ao bucket, como `assets.seudominio.com`, e informe a mesma URL em `R2_PUBLIC_URL`, sem barra ao final. As fotos são gravadas em `profiles/<id-do-usuario>/`.

## CORS do bucket

No bucket, permita o domínio do client para `PUT` e `GET`. Substitua os domínios abaixo pelos ambientes reais:

```json
[
  {
    "AllowedOrigins": ["https://app.seudominio.com", "http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

A API aceita somente imagens JPG, PNG ou WebP de até 1 MB. A URL assinada permite um único destino e expira em dois minutos.
