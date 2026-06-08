# CryptoViz: Детальное описание реализации

> Служебное примечание: файл является черновым техническим описанием и не заменяет `DIPLOM_STATE.md`, `AGENTS.md` и фактический код проекта. При подготовке текста ВКР сверять детали с `CryptoViz/front/src/pages/GraphPage/GraphPage.jsx`, `CryptoViz/front/src/utils/graphMetrics.js`, `CryptoViz/front/src/components/GraphAnalysisPanel.jsx` и `CryptoViz/front/src/utils/tronscanClient.js`.

## Глава 4. Реализация программы CryptoViz

### 4.1 Backend на Node.js/Express

Backend приложения CryptoViz реализован с использованием Node.js и фреймворка Express, что обеспечивает построение надежного REST API для взаимодействия с фронтенд-частью приложения и работы с базой данных.

#### 4.1.1 Архитектура сервера

Основной файл `server.js` инициализирует сервер Express и подключает необходимые промежуточные обработчики (middleware):

```javascript
const express = require('express');
const cors = require('cors');
const db = require('./models');
const app = express();

app.use(express.json());
app.use(cors());

// Регистрация маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

В коде сервера fallback-порт остается `5050`, но текущий frontend обращается к backend по `http://localhost:5555`. Поэтому для локального запуска CryptoViz в `.env` backend нужно задавать `PORT=5555`.

Сервер использует следующие ключевые компоненты:
- **Express** для создания API-эндпоинтов
- **CORS** для обеспечения кросс-доменных запросов
- **Sequelize ORM** для работы с базой данных PostgreSQL
- **JWT** для аутентификации и защиты маршрутов

#### 4.1.2 Модели данных

В проекте используется Sequelize ORM для определения моделей и работы с базой данных. Основные модели включают:

1. **User** - модель пользователя системы:
```javascript
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
```

2. **UserWallet** - модель для хранения адресов криптовалютных кошельков пользователей
3. **UserWalletImage** - модель для персонализации изображений кошельков
4. **UserWalletLabel** - модель для хранения пользовательских меток кошельков
5. **UserApiKey** - модель для хранения API-ключей пользователей для запросов к блокчейн-сервисам
6. **PasswordResetToken** - модель для хранения токенов сброса пароля

#### 4.1.3 Маршруты API

##### Аутентификация (`routes/auth.js`)

Обрабатывает регистрацию, вход и восстановление пароля:

1. **Регистрация пользователя**
```javascript
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

2. **Аутентификация пользователя**
```javascript
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
```

3. **Восстановление пароля** через электронную почту с использованием nodemailer

##### Управление кошельками (`routes/wallets.js`)

Реализует функциональность для работы с кошельками:

1. **Middleware верификации JWT-токена**
```javascript
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};
```

2. **Добавление кошелька**
```javascript
router.post('/add', async (req, res) => {
  try {
    const { userId, walletAddress, cryptoType } = req.body;
    await UserWallet.findOrCreate({
      where: { userId, walletAddress, cryptoType },
      defaults: { userId, walletAddress, cryptoType },
    });
    res.status(201).json({ message: 'Wallet added successfully' });
  } catch (error) {
    console.error('Error adding wallet:', error);
    res.status(500).json({ error: 'Failed to add wallet' });
  }
});
```

3. **Персонализация кошельков** - управление метками и иконками для визуализации
4. **Получение списка кошельков** пользователя
5. **Управление API-ключами** для внешних сервисов

### 4.2 Frontend на React/vis-network

Frontend приложения построен на основе библиотеки React и использует vis-network для визуализации графов транзакций криптовалют.

#### 4.2.1 Структура компонентов

Основной компонент приложения - `GraphPage`, который объединяет весь функционал визуализации и анализа транзакций:

```jsx
function GraphPage() {
  const [userApiKey, setUserApiKey] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('usdt');
  const [walletInput, setWalletInput] = useState('');
  const [walletLabels, setWalletLabels] = useState({});
  const [addedWallets, setAddedWallets] = useState([]);
  const [nodes, setNodes] = useState(new DataSet([]));
  const [edges, setEdges] = useState(new DataSet([]));
  const networkRef = useRef(null);
  
  // ... остальной код
}
```

#### 4.2.2 Визуализация графа транзакций

Для создания и отображения графа используется библиотека vis-network, которая предоставляет возможности для отрисовки сложных сетевых графов:

```jsx
// Инициализация графа
useEffect(() => {
  const options = {
    nodes: {
      shape: 'dot',
      size: 30,
      font: { size: 14, color: '#ffffff' },
      borderWidth: 2,
      color: { border: '#222222', background: '#666666' },
      shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 5, y: 5 },
    },
    edges: {
      width: 2,
      length: 300,
      color: '#ffb347',
      shadow: true,
      font: { size: 12, color: '#131313' },
      smooth: { type: 'dynamic' },
    },
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      // ... другие параметры физики
    }
  };

  const container = document.getElementById('network');
  const data = { nodes, edges };
  networkRef.current = new Network(container, data, options);
  
  // ... обработчики событий графа
}, []);
```

#### 4.2.3 Алгоритм построения графа транзакций

Процесс построения графа включает следующие ключевые шаги:

1. **Получение транзакций** для указанного кошелька через API блокчейн-сервиса
2. **Построение узлов и рёбер** графа на основе полученных данных:
   - Узлы представляют кошельки или транзакции (в случае Bitcoin)
   - Рёбра представляют перемещение средств между кошельками
3. **Применение фильтрации** по дате и сумме транзакций
4. **Персонализация отображения** узлов с использованием пользовательских меток и иконок

Для Bitcoin используется особый алгоритм визуализации, учитывающий специфику UTXO-модели:
- Создаются виртуальные узлы для транзакций
- Кошельки связываются через эти узлы

#### 4.2.4 Контекстное меню для управления узлами

Для удобства работы с графом реализовано контекстное меню, позволяющее:
- Добавлять кошелек в список отслеживаемых
- Удалять кошелек из списка отслеживаемых
- Изменять метку кошелька
- Изменять иконку кошелька
- Исследовать транзакции кошелька

#### 4.2.5 Автоматический анализ графа

В текущей версии frontend содержит отдельный слой анализа построенного графа:

- `src/utils/graphMetrics.js` рассчитывает метрики видимого фрагмента графа и выбранной вершины;
- `src/components/GraphAnalysisPanel.jsx` показывает сводку по графу слева и свойства выбранной вершины справа;
- стили панели анализа находятся в `src/pages/GraphPage/GraphPage.css`;
- `src/utils/tronscanClient.js` выполняет Tronscan-запросы через очередь с паузой и обработкой ответа `429`;
- `scripts/checkGraphMetrics.mjs` проверяет сценарии классификации адресов без внешних API-запросов.

Анализ учитывает только видимую часть графа, поэтому фильтры суммы и глубины напрямую влияют на отображаемые метрики. Для ребер сохраняются отдельные поля `amount`, `asset`, `timestamp`, `txHash`, `networkType`; текстовая подпись `label` используется как fallback.

Текущие признаки адресов:

1. **Возможный сервисный адрес биржи или обменника** - внешний признак срабатывает при `rangeTotal/total >= 10000` или `transactions/totalTransactionCount >= 10000`; локальный массовый паттерн срабатывает при `1000` переводов и `100` контрагентов.
2. **Возможный депозитный адрес сервиса** - адрес имеет от `3` до `20` уникальных отправителей, не более `2` получателей и направляет не менее `80%` исходящего объема основному получателю.
3. **Обычный адрес** - адрес не проходит условия сервисного или депозитного паттерна.
4. **Связующий адрес между группами** - дополнительный структурный признак, основанный на точке сочленения в неориентированной проекции видимого графа.

Поле `transferCount` из токеновых балансов и внешние названия сервисов из API не используются как критерии. Объяснение результата строится только через количественные и графовые показатели.

### 4.3 Экспорт, импорт и персонализация данных

#### 4.3.1 Экспорт данных

Компонент `ExportData` позволяет пользователям сохранять свои настройки и данные графа в JSON-формате:

```jsx
const exportData = () => {
  const data = { addedWallets, walletLabels, selectedDate, nodeImages };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', 'exported_data.json');
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
```

Данные, сохраняемые при экспорте:
- Список отслеживаемых кошельков
- Пользовательские метки кошельков
- Выбранная дата для фильтрации
- Настройки визуализации узлов (иконки)

#### 4.3.2 Импорт данных

Компонент `ImportData` позволяет загружать ранее сохраненные данные:

```jsx
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const token = localStorage.getItem('token');

      if (data.addedWallets) {
        setAddedWallets(data.addedWallets);
        // Сохранение добавленных кошельков в базу данных
        for (const walletAddress of data.addedWallets) {
          await fetch('http://localhost:5555/api/wallets/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token,
            },
            body: JSON.stringify({
              userId: localStorage.getItem('userId'),
              walletAddress,
              cryptoType: selectedCrypto,
            }),
          });
        }
      }
      
      // Импорт других данных: меток, изображений, и т.д.
      // ...
    } catch (error) {
      console.error('Ошибка при чтении файла: ', error);
    }
  };
  reader.readAsText(file);
};
```

При импорте данных происходит не только обновление состояния компонентов, но и синхронизация с сервером для сохранения в базе данных.

#### 4.3.3 Персонализация визуализации

Система предоставляет богатые возможности для персонализации визуализации графа:

1. **Пользовательские метки** - возможность присвоить понятное имя любому кошельку:
```jsx
const updateLabel = async () => {
  // Код обновления метки
};
```

2. **Выбор иконок для узлов** - возможность назначать различные иконки для визуальной классификации кошельков:
   - Salary (Зарплата)
   - General (Общий)
   - Home (Домашний)
   - Exchange (Биржа)
   - Transaction (Транзакция, для Bitcoin)

3. **Фильтрация по дате и сумме** - возможность ограничить отображаемые транзакции по временному периоду и минимальной сумме

### 4.4 Развёртывание приложения

#### 4.4.1 Требования к окружению

Для успешного запуска приложения требуется:

**Backend:**
- Node.js (версия 14.0 или выше)
- PostgreSQL (версия 12.0 или выше)
- NPM или Yarn для управления зависимостями

**Frontend:**
- Node.js (версия 14.0 или выше)
- NPM или Yarn для управления зависимостями

#### 4.4.2 Процесс установки

**Backend:**
1. Клонирование репозитория
2. Установка зависимостей: `npm install`
3. Создание и настройка файла `.env` с переменными окружения:
   ```
   PORT=5555
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASS=password
   DB_NAME=cryptoviz
   JWT_SECRET=yoursecretkey
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```
4. Запуск сервера: `node server.js` или `npm start`

**Frontend:**
1. Переход в директорию frontend: `cd front`
2. Установка зависимостей: `npm install`
3. Запуск в режиме разработки: `npm run dev`
4. Для продакшн-сборки: `npm run build`

#### 4.4.3 Варианты деплоя

1. **Локальный запуск** для разработки и тестирования
   - Backend на порту 5555
   - Frontend на порту 5173 (Vite dev server)

2. **Продакшн-деплой:**
   - Backend может быть развернут на VPS или в облачных сервисах (Heroku, AWS, DigitalOcean)
   - Frontend можно разместить на статических хостингах (Netlify, Vercel, GitHub Pages)
   - Использование Nginx в качестве прокси-сервера для объединения backend и frontend под одним доменом

#### 4.4.4 Настройка безопасности

Для обеспечения безопасности приложения были реализованы:
1. Хеширование паролей с использованием bcrypt
2. JWT-аутентификация для защиты API-эндпоинтов
3. Защита от CORS-атак
4. Безопасное хранение API-ключей пользователей в базе данных
5. Защита от SQL-инъекций через использование ORM Sequelize

#### 4.4.5 Мониторинг и масштабирование

Для продакшн-окружения рекомендуется настроить:
1. PM2 или аналогичный менеджер процессов для управления Node.js-приложением
2. Логирование ошибок и аналитики с использованием ELK-стека или облачных решений
3. Настройку балансировки нагрузки при высоком трафике
4. Резервное копирование базы данных

## Заключение

Приложение CryptoViz представляет собой полноценное веб-решение для визуализации и анализа криптовалютных транзакций. Архитектура приложения обеспечивает высокую надежность, безопасность и масштабируемость, а интерфейс предоставляет пользователям интуитивно понятный инструмент для исследования блокчейн-данных с широкими возможностями персонализации.
