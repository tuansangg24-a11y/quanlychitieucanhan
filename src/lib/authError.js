export function authError(error) {
  const messages = {
    invalid_credentials: "Email hoặc mật khẩu chưa đúng.",
    email_not_confirmed:
      "Bạn cần xác nhận email trước khi đăng nhập. Hãy kiểm tra hộp thư và mục thư rác.",
    user_already_exists:
      "Email này đã được đăng ký. Hãy chuyển sang đăng nhập.",
    weak_password: "Mật khẩu chưa đáp ứng yêu cầu bảo mật của hệ thống.",
    over_email_send_rate_limit:
      "Bạn đã yêu cầu email quá nhiều lần. Vui lòng thử lại sau.",
    over_request_rate_limit:
      "Có quá nhiều yêu cầu. Vui lòng chờ một lát rồi thử lại.",
    signup_disabled: "Đăng ký hiện đang tạm tắt. Vui lòng thử lại sau.",
  };
  if (messages[error?.code]) return messages[error.code];
  if (/fetch|network|offline/i.test(error?.message || ""))
    return "Không thể kết nối. Hãy kiểm tra mạng rồi thử lại.";
  return "Chưa thể hoàn tất yêu cầu. Vui lòng thử lại sau.";
}
