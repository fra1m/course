# 🎓 Online Course Platform – Backend

Backend для образовательной платформы на NestJS + PostgreSQL с поддержкой авторизации, курсов, уроков, тестов и аналитики.

## 🚀 Стек

- **NestJS** (структурированный backend)
- **TypeORM** (ORM + миграции)
- **PostgreSQL**
- **Swagger** (`@nestjs/swagger`)
- **JWT + Refresh Token** (через httpOnly cookies)
- **bcrypt** (хеширование паролей)
- **ValidationPipe** + кастомные исключения

---

## 📦 Модули и сущности

### 🔐 AuthModule
- Регистрация и логин с генерацией `accessToken` и `refreshToken`
- Refresh через `httpOnly` cookie
- Logout
- Хеширование токенов (`SHA3-512`), шифрование (`AES-256-GCM`)

### 👤 UsersModule
- Сущность: `UserEntity`
  - `id`, `email`, `passwordHash`, `role`
- Поддержка ролей (`enum`), Guard по ролям
- Автогенерация Swagger схем
- Настраиваемый `ValidationPipe`

### 🎓 CoursesModule
- Сущность: `CourseEntity`
  - `id`, `title`, `description`, `authorId`, `createdAt`, `updatedAt`
- CRUD для курсов
- Привязка к пользователю-автору

### 📚 ModulesModule
- Сущность: `CourseModuleEntity`
  - Привязка к курсу
  - Название и порядок

### 📖 LessonsModule
- Сущность: `LessonEntity`
  - Привязка к модулю курса
  - Название, текст, медиа

### 📦 ContentModule
- Хранилище медиа-контента (в разработке)
- Загрузка файлов

### 🧪 QuizModule
- Сущность: `Quiz`, `Question`, `Answer` (в разработке)
- Проверка ответов
- Поддержка MCQ/одиночного выбора

### 📊 AnalyticsModule
- Сущность: `UserProgress` (в разработке)
- Слежение за прогрессом пользователя

---

## ✅ Реализовано

- [x] Регистрация и логин
- [x] Refresh и Logout
- [x] Валидация через кастомный `ValidationPipe`
- [x] Swagger-документация (`@ApiResponse`, `@ApiTags`, `@ApiCookieAuth`)
- [x] Role Guard (`@Roles('ADMIN')`)
- [x] Роуты для курсов, модулей, уроков
- [x] Хендлинг ошибок через `handleError`

---

## 🔧 Установка

```bash
git clone https://github.com/yourname/your-repo.git
cd your-repo
npm install
