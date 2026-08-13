# JB Finance

Sistema financeiro pessoal com API em FastAPI e interface web em React + TypeScript.

## Problema

Controles financeiros pessoais em planilhas ficam dificeis de filtrar, visualizar e manter ao longo do tempo. Um sistema proprio permite organizar receitas, despesas, categorias e status com uma experiencia mais proxima de um produto real.

## Solucao

O JB Finance combina backend Python com frontend React para registrar movimentacoes, visualizar saldos e acompanhar o resultado mensal em uma interface com filtros, grafico e tema claro/escuro.

## Tecnologias

- Python
- FastAPI
- SQLAlchemy
- SQLite
- React
- TypeScript
- Vite
- Axios
- Recharts
- Lucide React

## Funcionalidades presentes no codigo

- Dashboard com saldo, receitas, despesas e resultado mensal.
- Cadastro, edicao, duplicacao e exclusao de movimentacoes.
- Categorias editaveis.
- Filtros por mes, tipo, categoria e status.
- Grafico de receitas x despesas.
- Tema claro e escuro.
- API FastAPI com banco SQLite local.
- Frontend React + TypeScript.

## Estrutura

```text
backend/   API, modelos e banco local
frontend/  interface web em React
```

## Executar no Windows

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Observacao de seguranca

Banco local e dependencias instaladas nao fazem parte desta publicacao. O banco `finance.db` e criado automaticamente pelo backend.
