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