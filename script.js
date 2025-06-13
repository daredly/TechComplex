document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('contactModal');
    const contactBtn = document.querySelector('.contact-btn');
    const closeBtn = document.querySelector('.close-modal');

    // Открытие модального окна
    contactBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы
    });

    // Закрытие модального окна по клику на крестик
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Разблокируем прокрутку страницы
    });

    // Закрытие модального окна по клику вне его области
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Закрытие модального окна по нажатию Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Обработка отправки формы
    const contactForm = document.querySelector('.modal .contact-form');
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Здесь можно добавить код для отправки формы
        alert('Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        contactForm.reset();
    });
});

// Функция для отправки контактной формы
async function handleContactSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    try {
        // Блокируем кнопку и показываем загрузку
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';

        // Собираем данные формы
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Отправляем запрос
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ошибка при отправке формы');
        }

        // Показываем успешное сообщение
        alert('Сообщение успешно отправлено!');
        form.reset();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Произошла ошибка при отправке формы');
    } finally {
        // Восстанавливаем кнопку
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Функция для отправки формы заказа
async function handleOrderSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    try {
        // Блокируем кнопку и показываем загрузку
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';

        // Собираем данные формы
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Отправляем запрос
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ошибка при отправке заказа');
        }

        // Показываем успешное сообщение
        alert('Заказ успешно создан!');
        form.reset();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Произошла ошибка при отправке заказа');
    } finally {
        // Восстанавливаем кнопку
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Добавляем обработчики событий при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Находим формы
    const contactForm = document.getElementById('contactForm');
    const orderForm = document.getElementById('orderForm');

    // Добавляем обработчики
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
}); 