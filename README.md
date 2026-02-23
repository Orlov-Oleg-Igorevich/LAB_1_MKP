# LAB 1 (МАИ 604) — Возмущающее ускорение (геопотенциал)

Монорепозиторий: `NestJS API` + `React/Vite UI` + `shared` (константы/типы).

## Что реализовано

- Расчёт по методичке:
  - уравнение Кеплера (итерации \(E_{i+1}=M+e\sin E_i\))
  - координаты точки орбиты (формула (6))
  - переход АГЭСК → ГСК (формула (7), упрощённо \(S(t)=\omega_e t\))
  - полиномы Лежандра \(P_n^k\) (рекуррентно) и производные по \(q=\sin\varphi\)
  - ускорения \(j_r, j_\varphi, j_\lambda\) (формула (11))
  - проекции \(S,T,W\) (формула (5))
- API:
  - `POST /api/calculate`
  - `POST /api/compare`
  - `GET /api/presets` и `GET /api/presets/:id` (варианты 1–27)
  - `GET /api/constants`
  - `POST /api/export/csv`, `POST /api/export/pdf`
  - Swagger: `/api/docs`
- Web UI (одна страница):
  - выбор варианта/ввод элементов
  - графики Plotly: \(|j|(h)\), \(|j|/|g|\)
  - таблица первых точек
  - экспорт CSV/PDF кнопками

## Быстрый старт (dev)

В корне:

```bash
npm install
```

Запуск API:

```bash
npm run dev:api
```

Запуск Web:

```bash
npm run dev:web
```

По умолчанию:
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`
- Web: `http://localhost:5173`

Если API на другом адресе, можно задать в web:

```bash
VITE_API_BASE="http://localhost:3000/api" npm run dev -w @lab/web
```

## Docker

```bash
docker compose up --build
```

- Web будет на `http://localhost:8080`
- API на `http://localhost:3000/api`

