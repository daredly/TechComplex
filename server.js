require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const Order = require('./models/Order');
const Contact = require('./models/Contact');

const app = express();

// Настройка CORS
const corsOptions = {
    origin: ['https://*.onrender.com', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Настройка парсеров
app.use(express.json()); // для application/json
app.use(express.urlencoded({ extended: true })); // для application/x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Настройка статических файлов
app.use(express.static(path.join(__dirname)));

// Настройка Telegram бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Функция отправки уведомления в Telegram
async function sendTelegramNotification(data, type) {
    try {
        const adminId = process.env.TELEGRAM_ADMIN_ID;
        let message = '';

        if (type === 'order') {
            message = `🛍 Новый заказ!\n\n` +
                     `Имя: ${data.name}\n` +
                     `Фамилия: ${data.surname}\n` +
                     `Email: ${data.email}\n` +
                     `Телефон: ${data.phone}\n` +
                     `Компания: ${data.company || 'Не указана'}\n` +
                     `Услуга: ${data.service}\n` +
                     `Сообщение: ${data.message || 'Нет'}\n\n` +
                     `Дата: ${new Date().toLocaleString()}`;
        } else if (type === 'contact') {
            message = `📞 Новое сообщение!\n\n` +
                     `Имя: ${data.name}\n` +
                     `Email: ${data.email}\n` +
                     `Сообщение: ${data.message}\n\n` +
                     `Дата: ${new Date().toLocaleString()}`;
        }

        await bot.sendMessage(adminId, message);
        return true;
    } catch (error) {
        console.error('Telegram notification error:', error);
        return false;
    }
}

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Маршруты
app.post('/api/orders', async (req, res) => {
    try {
        console.log('Received order request:', req.body); // для отладки

        // Проверка наличия всех обязательных полей
        const requiredFields = ['name', 'surname', 'email', 'phone', 'service'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`
            });
        }

        const { name, surname, email, phone, service, company, message } = req.body;

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный формат email'
            });
        }

        // Валидация телефона
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный формат телефона'
            });
        }

        // Создание и сохранение заказа
        const order = new Order({
            name,
            surname,
            email,
            phone,
            service,
            company,
            message,
            createdAt: new Date()
        });

        await order.save();
        
        // Отправка уведомления в Telegram
        const notificationSent = await sendTelegramNotification(req.body, 'order');
        
        res.status(201).json({
            success: true,
            message: 'Заказ успешно создан',
            order,
            notificationSent
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при создании заказа',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        console.log('Received contact request:', req.body); // для отладки

        // Проверка наличия всех полей
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Все поля обязательны для заполнения'
            });
        }

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный формат email'
            });
        }

        // Создание и сохранение контакта
        const contact = new Contact({
            name,
            email,
            message,
            createdAt: new Date()
        });

        await contact.save();
        
        // Отправка уведомления в Telegram
        const notificationSent = await sendTelegramNotification({ name, email, message }, 'contact');
        
        res.status(201).json({
            success: true,
            message: 'Сообщение успешно отправлено',
            contact,
            notificationSent
        });
    } catch (error) {
        console.error('Contact message error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при отправке сообщения',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении заказов',
            error: error.message
        });
    }
});

app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении сообщений',
            error: error.message
        });
    }
});

// Добавляем обработчик быстрого заказа
app.post('/api/quick-order', async (req, res) => {
    try {
        console.log('Received quick order request:', req.body);

        // Проверка наличия всех обязательных полей
        const { name, phone, service } = req.body;
        
        if (!name || !phone || !service) {
            return res.status(400).json({
                success: false,
                message: 'Все поля обязательны для заполнения'
            });
        }

        // Валидация телефона
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный формат телефона'
            });
        }

        // Создание и сохранение быстрого заказа
        const quickOrder = new Order({
            name,
            phone,
            service,
            createdAt: new Date()
        });

        await quickOrder.save();
        
        // Отправка уведомления в Telegram
        const notificationSent = await sendTelegramNotification({
            name,
            phone,
            service,
            type: 'quick-order'
        }, 'order');
        
        res.status(201).json({
            success: true,
            message: 'Быстрый заказ успешно создан',
            order: quickOrder,
            notificationSent
        });
    } catch (error) {
        console.error('Quick order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при создании быстрого заказа',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Добавляем обработку корневого маршрута
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка всех остальных маршрутов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 