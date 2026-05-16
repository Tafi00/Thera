import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hỗ trợ - TheraHome",
  description: "Trung tâm hỗ trợ ứng dụng TheraHome",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 sm:p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Trung tâm hỗ trợ
          </h1>
          <p className="mt-2 text-gray-500">
            Chúng tôi luôn sẵn sàng giúp đỡ bạn
          </p>
        </div>

        <div className="space-y-8">
          {/* Contact Info */}
          <section className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Liên hệ hỗ trợ
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">📧</span>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium">support@therahome.vn</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🌐</span>
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <p className="text-gray-900 font-medium">https://therahome.vn</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="text-sm text-gray-500">Thời gian phản hồi</p>
                  <p className="text-gray-900 font-medium">Trong vòng 24 giờ làm việc</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Câu hỏi thường gặp
            </h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Làm sao để bắt đầu sử dụng ứng dụng?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Tải ứng dụng TheraHome, đăng nhập bằng Google, Apple hoặc Facebook, hoàn thành bài khảo sát 
                  sức khỏe ban đầu. Hệ thống sẽ tự động tạo lộ trình phục hồi phù hợp với bạn.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Tôi có cần thiết bị TheraHome để sử dụng app không?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Không bắt buộc. Bạn hoàn toàn có thể sử dụng các bài tập và tính năng theo dõi 
                  sức khỏe mà không cần thiết bị. Thiết bị TheraHome là phụ kiện hỗ trợ thêm 
                  cho quá trình phục hồi.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Làm sao để kích hoạt thiết bị TheraHome?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Vào tab &quot;Thiết bị&quot; trong ứng dụng, chọn thiết bị bạn có, sau đó sử dụng 
                  tính năng quét mã QR hoặc nhập mã kích hoạt đi kèm thiết bị.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Dữ liệu sức khỏe của tôi có an toàn không?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Có. Chúng tôi sử dụng mã hóa dữ liệu và lưu trữ trên hạ tầng đám mây bảo mật. 
                  Thông tin của bạn không được chia sẻ với bên thứ ba. Xem thêm tại{" "}
                  <a href="/privacy-policy" className="text-blue-600 underline">
                    Chính sách bảo mật
                  </a>.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Làm sao để xóa tài khoản?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Gửi email đến support@therahome.vn với tiêu đề &quot;Yêu cầu xóa tài khoản&quot; 
                  kèm email đăng ký. Chúng tôi sẽ xử lý trong vòng 30 ngày.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Ứng dụng có thay thế được bác sĩ không?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Không. TheraHome là ứng dụng hỗ trợ tập luyện và theo dõi tiến trình phục hồi. 
                  Nếu bạn có vấn đề sức khỏe nghiêm trọng, hãy tham khảo ý kiến bác sĩ hoặc 
                  chuyên gia vật lý trị liệu.
                </p>
              </div>
            </div>
          </section>

          {/* App Info */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Thông tin ứng dụng
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Phiên bản</p>
                <p className="text-gray-900 font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-gray-500">Nền tảng</p>
                <p className="text-gray-900 font-medium">iOS & Android</p>
              </div>
              <div>
                <p className="text-gray-500">Nhà phát triển</p>
                <p className="text-gray-900 font-medium">TheraHome</p>
              </div>
              <div>
                <p className="text-gray-500">Ngôn ngữ</p>
                <p className="text-gray-900 font-medium">Tiếng Việt</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">
            © 2025 TheraHome. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </div>
  );
}
