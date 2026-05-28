<?php

declare(strict_types=1);

// ============================================================
// HEADERS CORS
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================================
// AUTOLOAD — Models
// ============================================================

require_once __DIR__ . "/models/User.php";
require_once __DIR__ . "/models/Session.php";
require_once __DIR__ . "/models/EmailVerificationToken.php";
require_once __DIR__ . "/models/PasswordResetToken.php";
require_once __DIR__ . "/models/Post.php";
require_once __DIR__ . "/models/PostShare.php";
require_once __DIR__ . "/models/Media.php";
require_once __DIR__ . "/models/Comment.php";
require_once __DIR__ . "/models/Baze.php";
require_once __DIR__ . "/models/Follow.php";
require_once __DIR__ . "/models/Block.php";
require_once __DIR__ . "/models/Notification.php";
require_once __DIR__ . "/models/Message.php";
require_once __DIR__ . "/models/Conversation.php";
require_once __DIR__ . "/models/Report.php";

// ============================================================
// AUTOLOAD — DTOs
// ============================================================

require_once __DIR__ . "/dto/UserRegisterDTO.php";
require_once __DIR__ . "/dto/UserLoginDTO.php";
require_once __DIR__ . "/dto/UserDTO.php";
require_once __DIR__ . "/dto/UpdateUserDTO.php";
require_once __DIR__ . "/dto/SessionDTO.php";
require_once __DIR__ . "/dto/EmailVerificationTokenDTO.php";
require_once __DIR__ . "/dto/VerifyEmailDTO.php";
require_once __DIR__ . "/dto/ForgotPasswordDTO.php";
require_once __DIR__ . "/dto/PasswordResetDTO.php";
require_once __DIR__ . "/dto/PasswordResetTokenDTO.php";
require_once __DIR__ . "/dto/PostDTO.php";
require_once __DIR__ . "/dto/MediaDTO.php";
require_once __DIR__ . "/dto/CommentDTO.php";
require_once __DIR__ . "/dto/BazeDTO.php";
require_once __DIR__ . "/dto/FollowDTO.php";
require_once __DIR__ . "/dto/BlockDTO.php";
require_once __DIR__ . "/dto/NotificationDTO.php";
require_once __DIR__ . "/dto/MessageDTO.php";
require_once __DIR__ . "/dto/ConversationDTO.php";
require_once __DIR__ . "/dto/CreateConversationDTO.php";
require_once __DIR__ . "/dto/ReportDTO.php";
require_once __DIR__ . "/dto/PostComMediaDTO.php";

// ============================================================
// AUTOLOAD — Config
// ============================================================

require_once __DIR__ . "/config/Database.php";
require_once __DIR__ . "/config/email.php";

// ============================================================
// AUTOLOAD — Interfaces Repositories
// ============================================================

require_once __DIR__ . "/interfaces/repositories/IUserRepository.php";
require_once __DIR__ . "/interfaces/repositories/ISessionRepository.php";
require_once __DIR__ . "/interfaces/repositories/IEmailVerificationRepository.php";
require_once __DIR__ . "/interfaces/repositories/IPasswordResetRepository.php";
require_once __DIR__ . "/interfaces/repositories/IPostRepository.php";
require_once __DIR__ . "/interfaces/repositories/IMediaRepository.php";
require_once __DIR__ . "/interfaces/repositories/ICommentRepository.php";
require_once __DIR__ . "/interfaces/repositories/IBazeRepository.php";
require_once __DIR__ . "/interfaces/repositories/IFollowRepository.php";
require_once __DIR__ . "/interfaces/repositories/IBlockRepository.php";
require_once __DIR__ . "/interfaces/repositories/INotificationRepository.php";
require_once __DIR__ . "/interfaces/repositories/IMessageRepository.php";
require_once __DIR__ . "/interfaces/repositories/IConversationRepository.php";
require_once __DIR__ . "/interfaces/repositories/IReportRepository.php";

// ============================================================
// AUTOLOAD — Interfaces Services
// ============================================================

require_once __DIR__ . "/interfaces/services/IUserService.php";
require_once __DIR__ . "/interfaces/services/ISessionService.php";
require_once __DIR__ . "/interfaces/services/IEmailVerificationService.php";
require_once __DIR__ . "/interfaces/services/IPasswordResetService.php";
require_once __DIR__ . "/interfaces/services/IPostService.php";
require_once __DIR__ . "/interfaces/services/IMediaService.php";
require_once __DIR__ . "/interfaces/services/ICommentService.php";
require_once __DIR__ . "/interfaces/services/IBazeService.php";
require_once __DIR__ . "/interfaces/services/IFollowService.php";
require_once __DIR__ . "/interfaces/services/IBlockService.php";
require_once __DIR__ . "/interfaces/services/INotificationService.php";
require_once __DIR__ . "/interfaces/services/IMessageService.php";
require_once __DIR__ . "/interfaces/services/IConversationService.php";
require_once __DIR__ . "/interfaces/services/IPostShareService.php";
require_once __DIR__ . "/interfaces/services/IReportService.php";

// ============================================================
// AUTOLOAD — Middleware (dentro de interfaces/middlewares)
// ============================================================

require_once __DIR__ . "/middlewares/AuthMiddleware.php";
require_once __DIR__ . "/middlewares/AdminMiddleware.php";

// ============================================================
// AUTOLOAD — Repositories
// ============================================================

require_once __DIR__ . "/repositories/UserRepository.php";
require_once __DIR__ . "/repositories/SessionRepository.php";
require_once __DIR__ . "/repositories/EmailVerificationRepository.php";
require_once __DIR__ . "/repositories/PasswordResetRepository.php";
require_once __DIR__ . "/repositories/PostRepository.php";
require_once __DIR__ . "/repositories/MediaRepository.php";
require_once __DIR__ . "/repositories/CommentRepository.php";
require_once __DIR__ . "/repositories/BazeRepository.php";
require_once __DIR__ . "/repositories/FollowRepository.php";
require_once __DIR__ . "/repositories/BlockRepository.php";
require_once __DIR__ . "/repositories/NotificationRepository.php";
require_once __DIR__ . "/repositories/MessageRepository.php";
require_once __DIR__ . "/repositories/ConversationRepository.php";
require_once __DIR__ . "/repositories/ReportRepository.php";

// ============================================================
// AUTOLOAD — Services
// ============================================================

require_once __DIR__ . "/services/BaseService.php";
require_once __DIR__ . "/services/EmailService.php";
require_once __DIR__ . "/services/UserService.php";
require_once __DIR__ . "/services/SessionService.php";
require_once __DIR__ . "/services/EmailVerificationService.php";
require_once __DIR__ . "/services/PasswordResetService.php";
require_once __DIR__ . "/services/PostService.php";
require_once __DIR__ . "/services/MediaService.php";
require_once __DIR__ . "/services/CommentService.php";
require_once __DIR__ . "/services/BazeService.php";
require_once __DIR__ . "/services/FollowService.php";
require_once __DIR__ . "/services/BlockService.php";
require_once __DIR__ . "/services/NotificationService.php";
require_once __DIR__ . "/services/MessageService.php";
require_once __DIR__ . "/services/ConversationService.php";
require_once __DIR__ . "/services/ReportService.php";
require_once __DIR__ . "/services/UploadService.php";
// ============================================================
// AUTOLOAD — Controllers
// ============================================================

require_once __DIR__ . "/controllers/BaseController.php";
require_once __DIR__ . "/controllers/AuthController.php";
require_once __DIR__ . "/controllers/UserController.php";
require_once __DIR__ . "/controllers/PostController.php";
require_once __DIR__ . "/controllers/FollowController.php";
require_once __DIR__ . "/controllers/CommentController.php";
require_once __DIR__ . "/controllers/BazeController.php";
require_once __DIR__ . "/controllers/MessageController.php";
require_once __DIR__ . "/controllers/NotificationController.php";
require_once __DIR__ . "/controllers/ReportController.php";
require_once __DIR__ . "/controllers/MediaController.php";
require_once __DIR__ . "/controllers/UploadController.php";
// ============================================================
// AUTOLOAD — Utils
// ============================================================

require_once __DIR__ . "/utils/Validator.php";

// ============================================================
// CONEXÃO À BASE DE DADOS
// ============================================================

$database = new Database();
$conn     = $database->connect();

// ============================================================
// INSTANCIAR REPOSITORIES
// ============================================================

$userRepository              = new UserRepository($conn);
$sessionRepository           = new SessionRepository($conn);
$emailVerificationRepository = new EmailVerificationRepository($conn);
$passwordResetRepository     = new PasswordResetRepository($conn);
$postRepository              = new PostRepository($conn);
$mediaRepository             = new MediaRepository($conn);
$commentRepository           = new CommentRepository($conn);
$bazeRepository              = new BazeRepository($conn);
$followRepository            = new FollowRepository($conn);
$blockRepository             = new BlockRepository($conn);
$notificationRepository      = new NotificationRepository($conn);
$messageRepository           = new MessageRepository($conn);
$conversationRepository      = new ConversationRepository($conn);
$reportRepository            = new ReportRepository($conn);

// ============================================================
// INSTANCIAR SERVICES
// ============================================================
// ============================================================
// INSTANCIAR SERVICES — ORDEM CORRECTA
// ============================================================

$emailService = new EmailService();

$userService = new UserService(
    $userRepository,
    $emailVerificationRepository,
    $emailService
);

$sessionService = new SessionService($sessionRepository);

$emailVerificationService = new EmailVerificationService(
    $emailVerificationRepository,
    $userRepository
);

$passwordResetService = new PasswordResetService(
    $passwordResetRepository,
    $userRepository,
    $sessionRepository,
    $emailService
);

$uploadService = new UploadService();

$mediaService = new MediaService(
    $mediaRepository,
    $uploadService
);

$blockService = new BlockService($blockRepository);

// ── notificationService ANTES de baze, comment, follow, message, report ──

$notificationService = new NotificationService($notificationRepository);

$bazeService = new BazeService(
    $bazeRepository,
    $notificationService,
    $postRepository
);

$commentService = new CommentService(
    $commentRepository,
    $notificationService,
    $postRepository
);

$followService = new FollowService(
    $followRepository,
    $userRepository,
    $notificationService
);

$conversationService = new ConversationService($conversationRepository);

$messageService = new MessageService(
    $messageRepository,
    $conversationRepository,
    $notificationService
);

$reportService = new ReportService(
    $reportRepository,
    $userRepository,
    $notificationService
);

// ── postService POR ÚLTIMO porque depende de baze, comment, media e user ──

$postService = new PostService(
    $postRepository,
    $mediaRepository,
    $bazeRepository,
    $commentRepository,
    $userRepository
);
// ============================================================
// INSTANCIAR MIDDLEWARE
// ============================================================

$authMiddleware  = new AuthMiddleware($conn);
$adminMiddleware = new AdminMiddleware($conn);

// ============================================================
// INPUT E ROUTING
// ============================================================

$input  = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $_GET['action'] ?? null;
$route  = $_GET['route']  ?? 'auth';

// ============================================================
// DISPATCHER
// ============================================================

switch ($route) {

    case 'auth':
        require_once __DIR__ . "/routes/auth.routes.php";
        break;

    case 'user':
        require_once __DIR__ . "/routes/user.routes.php";
        break;

    case 'post':
        require_once __DIR__ . "/routes/post.routes.php";
        break;

    case 'comment':
        require_once __DIR__ . "/routes/comment.routes.php";
        break;

    case 'baze':
        require_once __DIR__ . "/routes/baze.routes.php";
        break;

    case 'follow':
        require_once __DIR__ . "/routes/follow.routes.php";
        break;

    case 'notification':
        require_once __DIR__ . "/routes/notification.routes.php";
        break;

    case 'message':
        require_once __DIR__ . "/routes/message.routes.php";
        break;

    case 'report':
        require_once __DIR__ . "/routes/report.routes.php";
        break;

    case 'upload':
        require_once __DIR__ . "/routes/upload.routes.php";
        break;

    case 'admin':
        require_once __DIR__ . "/routes/admin.routes.php";
        break;

    case 'media':
        require_once __DIR__ . "/routes/media.routes.php";
        break;

    default:
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Rota não encontrada"
        ]);
        break;
}
